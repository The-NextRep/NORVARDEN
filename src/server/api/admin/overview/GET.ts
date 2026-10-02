/**
 * GET /api/admin/overview
 * Admin dashboard numbers: members by type, employer accounts, application
 * queue, verified/suspended/paid companies, open reports, recent activity.
 */
import type { Request, Response } from 'express';
import { and, count, countDistinct, desc, eq, gt, inArray, isNotNull, isNull, or } from 'drizzle-orm';
import { db } from '@/server/db/client';
import {
  adminActivityLog,
  companyApplications,
  companyReports,
  companySubscriptions,
  conversations,
  memberProfiles,
  user,
  verifiedCompanies,
} from '@/server/db/schema';
import { ACTIVE_SUB_STATUSES } from '../_shared/access';

export default async function handler(_req: Request, res: Response) {
  try {
    const now = new Date();

    const [
      memberRows,
      [userTotal],
      [suspendedUsers],
      appRows,
      [verifiedTotal],
      [suspendedCompanies],
      [pausedCompanies],
      stripeActive,
      manualActive,
      [pendingCompanyReports],
      [pendingConversationReports],
      recentActivity,
    ] = await Promise.all([
      db.select({ memberType: memberProfiles.memberType, n: count() })
        .from(memberProfiles)
        .groupBy(memberProfiles.memberType),
      db.select({ n: count() }).from(user),
      db.select({ n: count() }).from(user).where(eq(user.suspended, true)),
      db.select({ status: companyApplications.status, n: count() })
        .from(companyApplications)
        .where(inArray(companyApplications.status, ['pending_review', 'needs_info']))
        .groupBy(companyApplications.status),
      db.select({ n: count() }).from(verifiedCompanies),
      db.select({ n: count() }).from(verifiedCompanies).where(eq(verifiedCompanies.blocked, true)),
      db.select({ n: count() }).from(verifiedCompanies).where(eq(verifiedCompanies.postsPaused, true)),
      // Companies with a live Stripe subscription (not suspended)
      db.select({ id: companySubscriptions.companyId })
        .from(companySubscriptions)
        .innerJoin(verifiedCompanies, eq(verifiedCompanies.id, companySubscriptions.companyId))
        .where(and(
          inArray(companySubscriptions.status, [...ACTIVE_SUB_STATUSES]),
          or(isNull(companySubscriptions.currentPeriodEnd), gt(companySubscriptions.currentPeriodEnd, now)),
          or(isNull(verifiedCompanies.blocked), eq(verifiedCompanies.blocked, false)),
        )),
      // Companies with admin-granted access (not suspended)
      db.select({ id: verifiedCompanies.id })
        .from(verifiedCompanies)
        .where(and(
          gt(verifiedCompanies.manualAccessUntil, now),
          or(isNull(verifiedCompanies.blocked), eq(verifiedCompanies.blocked, false)),
        )),
      db.select({ n: count() }).from(companyReports).where(eq(companyReports.status, 'pending')),
      db.select({ n: countDistinct(conversations.id) })
        .from(conversations)
        .where(and(
          isNotNull(conversations.reportedAt),
          or(isNull(conversations.reportStatus), eq(conversations.reportStatus, 'pending')),
        )),
      db.select().from(adminActivityLog).orderBy(desc(adminActivityLog.createdAt), desc(adminActivityLog.id)).limit(10),
    ]);

    const members = { athlete: 0, coach: 0, veteran: 0, employer: 0 };
    for (const r of memberRows) members[r.memberType] = Number(r.n);

    const applications = { pendingReview: 0, needsInfo: 0 };
    for (const r of appRows) {
      if (r.status === 'pending_review') applications.pendingReview = Number(r.n);
      if (r.status === 'needs_info') applications.needsInfo = Number(r.n);
    }

    const paid = new Set<number>();
    stripeActive.forEach((r) => paid.add(r.id));
    manualActive.forEach((r) => paid.add(r.id));

    const companyReportsOpen = Number(pendingCompanyReports?.n ?? 0);
    const conversationReportsOpen = Number(pendingConversationReports?.n ?? 0);

    res.json({
      members: {
        ...members,
        totalMembers: members.athlete + members.coach + members.veteran,
        employerAccounts: members.employer,
        totalUsers: Number(userTotal?.n ?? 0),
        suspendedUsers: Number(suspendedUsers?.n ?? 0),
      },
      applications,
      companies: {
        verified: Number(verifiedTotal?.n ?? 0),
        suspended: Number(suspendedCompanies?.n ?? 0),
        postsPaused: Number(pausedCompanies?.n ?? 0),
        activePaid: paid.size,
        activeManual: manualActive.length,
      },
      reports: {
        companyReports: companyReportsOpen,
        conversations: conversationReportsOpen,
        total: companyReportsOpen + conversationReportsOpen,
      },
      recentActivity,
    });
  } catch (err) {
    console.error('[admin/overview] failed', err);
    res.status(500).json({ error: 'Failed to load overview.' });
  }
}
