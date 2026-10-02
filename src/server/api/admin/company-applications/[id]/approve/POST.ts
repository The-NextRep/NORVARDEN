import type { Request, Response } from 'express';
import { db } from '../../../../../db/client.js';
import { companyApplications, verifiedCompanies } from '../../../../../db/schema.js';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '../../../../../middleware/auth-guards.js';
import { sendCompanyApproved } from '@/server/lib/mailer';
import { logAdminAction } from '@/server/lib/admin-log';
import { getAdmin, parseIdParam } from '../../../_shared/params';

export { requireAdmin as middleware };

export default async function handler(req: Request, res: Response) {

  const id = parseIdParam(req);
  if (!id) { res.status(400).json({ error: 'Invalid id' }); return; }

  const apps = await db.select().from(companyApplications).where(eq(companyApplications.id, id)).limit(1);
  const app = apps[0];
  if (!app) { res.status(404).json({ error: 'Application not found' }); return; }
  if (app.status === 'approved') { res.status(400).json({ error: 'Already approved' }); return; }
  if (!app.orgType) { res.status(400).json({ error: 'Application has no organization type' }); return; }

  const body = (req.body ?? {}) as { missionDiscountConfirmed?: boolean; skillbridgeConfirmed?: boolean };

  // Determine mission discount
  const missionDiscountUnlocked =
    (app.orgType === 'nonprofit' || app.orgType === 'military_affiliated') &&
    body.missionDiscountConfirmed === true;

  // Determine SkillBridge
  const skillbridgePartner = !!app.skillbridgePartnerName && body.skillbridgeConfirmed === true;

  // Create verified company record
  const vcResult = await db.insert(verifiedCompanies).values({
    applicationId: id,
    legalName: app.legalName ?? '',
    website: app.website ?? '',
    emailDomain: app.emailDomain ?? '',
    orgType: app.orgType,
    isStaffingAgency: app.orgType === 'staffing_agency',
    missionDiscountUnlocked,
    skillbridgePartner,
  });

  const vcId = Number(vcResult[0].insertId);

  // Update application status
  const admin = getAdmin(res);
  await db.update(companyApplications)
    .set({ status: 'approved', reviewedAt: new Date(), reviewedBy: admin?.email ?? 'admin' })
    .where(eq(companyApplications.id, id));

  let emailSent = false;
  try {
    await sendCompanyApproved(app.contactEmail, app.contactName || 'there', app.legalName || 'your company');
    emailSent = true;
  } catch (err) {
    console.error(`[admin] approval email failed for application ${id}`, err);
  }

  await logAdminAction(
    res,
    'application_approve',
    'company_application',
    id,
    `${app.legalName ?? '(unnamed)'} → verified_company ${vcId}${missionDiscountUnlocked ? ' (mission discount)' : ''}${emailSent ? '' : ' — email failed'}`,
  );

  res.json({ approved: true, verifiedCompanyId: vcId, missionDiscountUnlocked, skillbridgePartner, emailSent });
}
