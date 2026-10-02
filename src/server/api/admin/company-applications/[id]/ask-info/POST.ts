import type { Request, Response } from 'express';
import { db } from '../../../../../db/client.js';
import { companyApplications, adminNotes } from '../../../../../db/schema.js';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '../../../../../middleware/auth-guards.js';
import { sendCompanyNeedsInfo } from '@/server/lib/mailer';
import { logAdminAction } from '@/server/lib/admin-log';
import { getAdmin, parseIdParam } from '../../../_shared/params';

export { requireAdmin as middleware };

export default async function handler(req: Request, res: Response) {

  const id = parseIdParam(req);
  const body = (req.body ?? {}) as { message?: unknown; adminNote?: unknown };
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 4000) : '';
  const adminNote = typeof body.adminNote === 'string' ? body.adminNote.trim().slice(0, 4000) : '';

  if (!id || !message) { res.status(400).json({ error: 'id and message required' }); return; }

  const apps = await db.select().from(companyApplications).where(eq(companyApplications.id, id)).limit(1);
  const app = apps[0];
  if (!app) { res.status(404).json({ error: 'Application not found' }); return; }
  if (app.status === 'approved') { res.status(400).json({ error: 'Application is already approved' }); return; }

  await db.update(companyApplications)
    .set({ status: 'needs_info', needsInfoMessage: message })
    .where(eq(companyApplications.id, id));

  const admin = getAdmin(res);
  if (adminNote) {
    await db.insert(adminNotes).values({
      applicationId: id,
      adminEmail: admin?.email ?? 'admin',
      note: adminNote,
    });
  }

  let emailSent = false;
  try {
    await sendCompanyNeedsInfo(app.contactEmail, app.contactName || 'there', app.legalName || 'your company', message);
    emailSent = true;
  } catch (err) {
    console.error(`[admin] needs-info email failed for application ${id}`, err);
  }

  await logAdminAction(
    res,
    'application_ask_info',
    'company_application',
    id,
    `${app.legalName ?? '(unnamed)'} — ${message}${emailSent ? '' : ' — email failed'}`,
  );

  res.json({ sent: true, emailSent });
}
