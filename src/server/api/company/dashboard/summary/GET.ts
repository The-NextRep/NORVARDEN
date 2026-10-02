/**
 * GET /api/company/dashboard/summary
 * Returns the logged-in employer's company dashboard data:
 *   - company card fields (legalName, website, orgType, verificationStatus flags)
 *   - activeJobPostsCount
 *   - pendingConnectionsCount (outgoing requests still pending member response)
 * Auth-required. Employer-only (memberType must be 'employer').
 */
import type { Request, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { getAuth } from '@/lib/auth/auth';
import { db } from '@/server/db/client';
import {
  memberProfiles,
  verifiedCompanies,
  jobPosts,
  memberConnections,
} from '@/server/db/schema';
import { resolveEmployerForUser, getCompanyAccess } from '@/server/lib/company-access';

export default async function handler(req: Request, res: Response) {
  try {
    const auth    = getAuth();
    const session = await auth.api.getSession({
      headers: req.headers as unknown as Headers,
    });

    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = session.user.id;

    // Confirm employer role
    let memberType: string | null = null;
    try {
      const [mp] = await db
        .select({ memberType: memberProfiles.memberType })
        .from(memberProfiles)
        .where(eq(memberProfiles.userId, userId))
        .limit(1);
      memberType = mp?.memberType ?? null;
    } catch { /* table may not exist yet */ }

    if (memberType !== 'employer') {
      return res.status(403).json({ error: 'Employer account required.' });
    }

    // Look up verified company via the application's contact email
    // (employers sign up with the same email used in the company application)
    let company: {
      id: number;
      legalName: string;
      website: string;
      orgType: string | null;
      missionDiscountUnlocked: boolean | null;
      skillbridgePartner: boolean | null;
      postsPaused: boolean | null;
      blocked: boolean | null;
    } | null = null;

    let verification: string = 'not_employer';
    let planActive = false;
    let activeJobPostsCount    = 0;
    let pendingConnectionsCount = 0;

    try {
      const resolved = await resolveEmployerForUser(userId);
      verification = resolved.ok ? 'approved' : resolved.reason;
      const vc = resolved.ok
        ? (
            await db
              .select({
                id:                      verifiedCompanies.id,
                legalName:               verifiedCompanies.legalName,
                website:                 verifiedCompanies.website,
                orgType:                 verifiedCompanies.orgType,
                missionDiscountUnlocked: verifiedCompanies.missionDiscountUnlocked,
                skillbridgePartner:      verifiedCompanies.skillbridgePartner,
                postsPaused:             verifiedCompanies.postsPaused,
                blocked:                 verifiedCompanies.blocked,
              })
              .from(verifiedCompanies)
              .where(eq(verifiedCompanies.id, resolved.company.id))
              .limit(1)
          )[0]
        : undefined;
      if (resolved.ok) {
        const access = await getCompanyAccess(resolved.company);
        planActive = access.active;
      }
      {
        if (vc) {
          company = vc;

          // Active job posts
          const activePosts = await db
            .select({ id: jobPosts.id })
            .from(jobPosts)
            .where(
              and(
                eq(jobPosts.companyId, vc.id),
                eq(jobPosts.status, 'active'),
              )
            );
          activeJobPostsCount = activePosts.length;
        }
      }
    } catch { /* tables may not exist yet */ }

    // Pending outgoing connection requests (employer sent, member hasn't responded)
    try {
      const pending = await db
        .select({ id: memberConnections.id })
        .from(memberConnections)
        .where(
          and(
            eq(memberConnections.requesterId, userId),
            eq(memberConnections.status, 'pending'),
          )
        );
      pendingConnectionsCount = pending.length;
    } catch { /* table may not exist yet */ }

    return res.status(200).json({
      company,
      verification,
      planActive,
      activeJobPostsCount,
      pendingConnectionsCount,
    });
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
