/**
 * GET /api/admin/company-reports?status=all|pending|reviewed|dismissed&page=1
 * Member-submitted company reports, pending first, with company and reporter names.
 */
import type { Request, Response } from 'express';
import { count, desc, eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { companyReports, jobPosts, memberProfiles, user, verifiedCompanies } from '@/server/db/schema';
import { parseIntQuery, parseStringQuery } from '../_shared/params';

const PAGE_SIZE = 50;
const STATUSES = ['pending', 'reviewed', 'dismissed'] as const;
type ReportStatus = typeof STATUSES[number];

export default async function handler(req: Request, res: Response) {
  try {
    const statusRaw = parseStringQuery(req.query['status']);
    const status = (STATUSES as readonly string[]).includes(statusRaw) ? (statusRaw as ReportStatus) : null;
    const page = parseIntQuery(req.query['page'], 1, 1, 10000);
    const where = status ? eq(companyReports.status, status) : undefined;

    const [[totalRow], [pendingRow], rows] = await Promise.all([
      db.select({ n: count() }).from(companyReports).where(where),
      db.select({ n: count() }).from(companyReports).where(eq(companyReports.status, 'pending')),
      db
        .select({
          id: companyReports.id,
          companyId: companyReports.companyId,
          reason: companyReports.reason,
          details: companyReports.details,
          jobPostId: companyReports.jobPostId,
          messageId: companyReports.messageId,
          status: companyReports.status,
          reviewedBy: companyReports.reviewedBy,
          createdAt: companyReports.createdAt,
          companyName: verifiedCompanies.legalName,
          companyBlocked: verifiedCompanies.blocked,
          companyPostsPaused: verifiedCompanies.postsPaused,
          reporterMemberId: companyReports.reporterMemberId,
          reporterFirstName: memberProfiles.firstName,
          reporterLastName: memberProfiles.lastName,
          reporterMemberType: memberProfiles.memberType,
          reporterUserId: user.id,
          reporterName: user.name,
          reporterEmail: user.email,
          jobTitle: jobPosts.title,
        })
        .from(companyReports)
        .leftJoin(verifiedCompanies, eq(verifiedCompanies.id, companyReports.companyId))
        .leftJoin(memberProfiles, eq(memberProfiles.id, companyReports.reporterMemberId))
        .leftJoin(user, eq(user.id, memberProfiles.userId))
        .leftJoin(jobPosts, eq(jobPosts.id, companyReports.jobPostId))
        .where(where)
        .orderBy(desc(eq(companyReports.status, 'pending')), desc(companyReports.createdAt), desc(companyReports.id))
        .limit(PAGE_SIZE)
        .offset((page - 1) * PAGE_SIZE),
    ]);

    res.json({
      reports: rows.map((r) => {
        const profileName = [r.reporterFirstName, r.reporterLastName].filter(Boolean).join(' ');
        return { ...r, reporterDisplayName: profileName || r.reporterName || null };
      }),
      total: Number(totalRow?.n ?? 0),
      pending: Number(pendingRow?.n ?? 0),
      page,
      pageSize: PAGE_SIZE,
    });
  } catch (err) {
    console.error('[admin/company-reports] failed', err);
    res.status(500).json({ error: 'Failed to load reports.' });
  }
}
