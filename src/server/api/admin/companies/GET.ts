/**
 * GET /api/admin/companies?q=&filter=all|active|suspended&page=1
 * Verified companies with contact, plan/access status, open reports and job counts.
 */
import type { Request, Response } from 'express';
import { and, count, desc, eq, inArray, isNull, like, or, type SQL } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { companyApplications, companyReports, jobPosts, verifiedCompanies } from '@/server/db/schema';
import { getAccessForCompanies } from '../_shared/access';
import { escapeLike, parseIntQuery, parseStringQuery } from '../_shared/params';

const PAGE_SIZE = 50;

export default async function handler(req: Request, res: Response) {
  try {
    const q = parseStringQuery(req.query['q']);
    const filterRaw = parseStringQuery(req.query['filter']);
    const filter = filterRaw === 'active' || filterRaw === 'suspended' ? filterRaw : 'all';
    const page = parseIntQuery(req.query['page'], 1, 1, 10000);

    const conditions: SQL[] = [];
    if (q) {
      const pattern = `%${escapeLike(q)}%`;
      conditions.push(or(
        like(verifiedCompanies.legalName, pattern),
        like(verifiedCompanies.emailDomain, pattern),
        like(verifiedCompanies.website, pattern),
      ) as SQL);
    }
    if (filter === 'suspended') conditions.push(eq(verifiedCompanies.blocked, true));
    if (filter === 'active') {
      conditions.push(or(isNull(verifiedCompanies.blocked), eq(verifiedCompanies.blocked, false)) as SQL);
    }
    const where = conditions.length ? and(...conditions) : undefined;

    const [[totalRow], rows] = await Promise.all([
      db.select({ n: count() }).from(verifiedCompanies).where(where),
      db
        .select({
          id: verifiedCompanies.id,
          applicationId: verifiedCompanies.applicationId,
          legalName: verifiedCompanies.legalName,
          website: verifiedCompanies.website,
          emailDomain: verifiedCompanies.emailDomain,
          orgType: verifiedCompanies.orgType,
          missionDiscountUnlocked: verifiedCompanies.missionDiscountUnlocked,
          skillbridgePartner: verifiedCompanies.skillbridgePartner,
          reportCount: verifiedCompanies.reportCount,
          postsPaused: verifiedCompanies.postsPaused,
          postsPausedReason: verifiedCompanies.postsPausedReason,
          blocked: verifiedCompanies.blocked,
          blockedAt: verifiedCompanies.blockedAt,
          manualAccessUntil: verifiedCompanies.manualAccessUntil,
          createdAt: verifiedCompanies.createdAt,
          contactName: companyApplications.contactName,
          contactEmail: companyApplications.contactEmail,
        })
        .from(verifiedCompanies)
        .leftJoin(companyApplications, eq(companyApplications.id, verifiedCompanies.applicationId))
        .where(where)
        .orderBy(desc(verifiedCompanies.createdAt), desc(verifiedCompanies.id))
        .limit(PAGE_SIZE)
        .offset((page - 1) * PAGE_SIZE),
    ]);

    const ids = rows.map((r) => r.id);
    const [access, jobCounts, reportCounts] = await Promise.all([
      getAccessForCompanies(rows),
      ids.length
        ? db.select({ companyId: jobPosts.companyId, n: count() })
            .from(jobPosts)
            .where(and(inArray(jobPosts.companyId, ids), eq(jobPosts.status, 'active')))
            .groupBy(jobPosts.companyId)
        : Promise.resolve([] as { companyId: number; n: number }[]),
      ids.length
        ? db.select({ companyId: companyReports.companyId, n: count() })
            .from(companyReports)
            .where(and(inArray(companyReports.companyId, ids), eq(companyReports.status, 'pending')))
            .groupBy(companyReports.companyId)
        : Promise.resolve([] as { companyId: number; n: number }[]),
    ]);
    const jobsBy = new Map(jobCounts.map((r) => [r.companyId, Number(r.n)]));
    const reportsBy = new Map(reportCounts.map((r) => [r.companyId, Number(r.n)]));

    res.json({
      companies: rows.map((r) => ({
        ...r,
        access: access.get(r.id) ?? null,
        activeJobs: jobsBy.get(r.id) ?? 0,
        pendingReports: reportsBy.get(r.id) ?? 0,
      })),
      total: Number(totalRow?.n ?? 0),
      page,
      pageSize: PAGE_SIZE,
    });
  } catch (err) {
    console.error('[admin/companies] failed', err);
    res.status(500).json({ error: 'Failed to load companies.' });
  }
}
