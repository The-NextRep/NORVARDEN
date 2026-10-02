import type { Request, Response } from 'express';
import { db } from '../../../../../db/client.js';
import { companyApplications, blockedCompanyDomains } from '../../../../../db/schema.js';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '../../../../../middleware/auth-guards.js';
import { sendCompanyRejected } from '@/server/lib/mailer';
import { logAdminAction } from '@/server/lib/admin-log';
import { getAdmin, parseIdParam } from '../../../_shared/params';

export { requireAdmin as middleware };

export default async function handler(req: Request, res: Response) {

  const id = parseIdParam(req);
  const body = (req.body ?? {}) as { reason?: unknown; blockDomain?: unknown };
  const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 2000) : '';
  const blockDomain = body.blockDomain === true;

  if (!id) { res.status(400).json({ error: 'Invalid id' }); return; }
  if (!reason) { res.status(400).json({ error: 'A rejection reason is required.' }); return; }

  const apps = await db.select().from(companyApplications).where(eq(companyApplications.id, id)).limit(1);
  const app = apps[0];
  if (!app) { res.status(404).json({ error: 'Application not found' }); return; }
  if (app.status === 'approved') { res.status(400).json({ error: 'Application is already approved' }); return; }

  const admin = getAdmin(res);
  await db.update(companyApplications)
    .set({ status: 'rejected', rejectionReason: reason, reviewedAt: new Date(), reviewedBy: admin?.email ?? 'admin' })
    .where(eq(companyApplications.id, id));

  if (blockDomain && app.emailDomain) {
    await db.insert(blockedCompanyDomains).ignore().values({
      domain: app.emailDomain,
      reason: 'rejected',
      companyId: null,
    });
  }

  let emailSent = false;
  try {
    await sendCompanyRejected(app.contactEmail, app.contactName || 'there', app.legalName || 'your company', reason);
    emailSent = true;
  } catch (err) {
    console.error(`[admin] rejection email failed for application ${id}`, err);
  }

  const domainBlocked = blockDomain && !!app.emailDomain;
  await logAdminAction(
    res,
    'application_reject',
    'company_application',
    id,
    `${app.legalName ?? '(unnamed)'} — ${reason}${domainBlocked ? ` (domain ${app.emailDomain} blocked)` : ''}${emailSent ? '' : ' — email failed'}`,
  );

  res.json({ rejected: true, domainBlocked, emailSent });
}
