/**
 * POST /api/admin/company-reports/:id/resolve
 * Body: { status: 'reviewed' | 'dismissed' }
 * Marks a company report as handled and refreshes the company's reportCount
 * (distinct reporters on non-dismissed reports). Does not change posts-paused
 * state — use POST /api/admin/companies/:id/access { postsPaused } for that.
 */
import type { Request, Response } from 'express';
import { and, countDistinct, eq, ne } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { companyReports, verifiedCompanies } from '@/server/db/schema';
import { logAdminAction } from '@/server/lib/admin-log';
import { getAdmin, parseIdParam } from '../../../_shared/params';

export default async function handler(req: Request, res: Response) {
  const id = parseIdParam(req);
  if (!id) { res.status(400).json({ error: 'Invalid report id.' }); return; }

  const body = (req.body ?? {}) as { status?: unknown };
  const status = body.status;
  if (status !== 'reviewed' && status !== 'dismissed') {
    res.status(400).json({ error: "status must be 'reviewed' or 'dismissed'." }); return;
  }

  try {
    const [report] = await db
      .select({ id: companyReports.id, companyId: companyReports.companyId, status: companyReports.status, reason: companyReports.reason })
      .from(companyReports)
      .where(eq(companyReports.id, id))
      .limit(1);
    if (!report) { res.status(404).json({ error: 'Report not found.' }); return; }

    const admin = getAdmin(res);
    await db
      .update(companyReports)
      .set({ status, reviewedBy: admin?.email ?? 'admin' })
      .where(eq(companyReports.id, id));

    const [agg] = await db
      .select({ n: countDistinct(companyReports.reporterMemberId) })
      .from(companyReports)
      .where(and(eq(companyReports.companyId, report.companyId), ne(companyReports.status, 'dismissed')));
    const reportCount = Number(agg?.n ?? 0);
    await db.update(verifiedCompanies).set({ reportCount }).where(eq(verifiedCompanies.id, report.companyId));

    await logAdminAction(res, `company_report_${status}`, 'company_report', id, `company ${report.companyId} — ${report.reason}`);

    res.json({ ok: true, status, reportCount });
  } catch (err) {
    console.error('[admin/company-reports/resolve] failed', err);
    res.status(500).json({ error: 'Failed to update report.' });
  }
}
