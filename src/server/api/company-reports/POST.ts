import type { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { companyReports, memberProfiles, verifiedCompanies } from '../../db/schema.js';
import { getSessionUser } from '../../middleware/auth-guards.js';
import { eq, and, ne } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

const VALID_REASONS = [
  'fee_for_training','fee_for_equipment','fee_for_background_check',
  'gift_card_request','wire_transfer','crypto','check_deposit',
  'off_platform_chat','other',
] as const;

export default async function handler(req: Request, res: Response) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) { res.status(401).json({ error: 'Authentication required.' }); return; }

  const { companyId, reason, details, jobPostId, messageId } = req.body as {
    companyId?: number;
    reason?: string;
    details?: string;
    jobPostId?: number;
    messageId?: number;
  };

  if (!companyId || !reason) {
    res.status(400).json({ error: 'companyId and reason required' });
    return;
  }

  // The reporter is always the signed-in member (never taken from the body),
  // so one account can't fake several reporters to auto-pause a company.
  const [reporter] = await db
    .select({ id: memberProfiles.id, memberType: memberProfiles.memberType })
    .from(memberProfiles)
    .where(eq(memberProfiles.userId, sessionUser.id))
    .limit(1);
  if (!reporter || reporter.memberType === 'employer') {
    res.status(403).json({ error: 'Only members can report a company.' });
    return;
  }
  const reporterMemberId = reporter.id;

  const [company] = await db.select({ id: verifiedCompanies.id }).from(verifiedCompanies)
    .where(eq(verifiedCompanies.id, Number(companyId))).limit(1);
  if (!company) { res.status(404).json({ error: 'Company not found.' }); return; }

  if (!VALID_REASONS.includes(reason as typeof VALID_REASONS[number])) {
    res.status(400).json({ error: 'Invalid reason' });
    return;
  }

  // Prevent duplicate reports from same member for same company
  const existing = await db.select().from(companyReports)
    .where(and(
      eq(companyReports.companyId, companyId),
      eq(companyReports.reporterMemberId, reporterMemberId),
    ))
    .limit(1);

  if (existing.length > 0) {
    res.status(400).json({ error: 'You have already reported this company.' });
    return;
  }

  await db.insert(companyReports).values({
    companyId,
    reporterMemberId,
    reason: reason as typeof VALID_REASONS[number],
    details: typeof details === 'string' ? details.slice(0, 2000) : null,
    jobPostId,
    messageId,
    status: 'pending',
  });

  // Count distinct reporters for this company
  const countResult = await db
    .select({ count: sql<number>`COUNT(DISTINCT reporter_member_id)` })
    .from(companyReports)
    .where(and(
      eq(companyReports.companyId, companyId),
      ne(companyReports.status, 'dismissed'),
    ));

  const reportCount = Number(countResult[0]?.count ?? 0);

  // Auto-pause at 3 distinct reporters
  if (reportCount >= 3) {
    await db.update(verifiedCompanies)
      .set({
        postsPaused: true,
        postsPausedReason: 'auto_paused_3_reports',
        reportCount,
      })
      .where(eq(verifiedCompanies.id, companyId));
  } else {
    await db.update(verifiedCompanies)
      .set({ reportCount })
      .where(eq(verifiedCompanies.id, companyId));
  }

  res.status(201).json({ reported: true, autoPaused: reportCount >= 3 });
}
