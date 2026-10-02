/**
 * GET /api/dashboard/summary
 * Returns the logged-in member's dashboard data:
 *   - profile card fields (name, headline, photo, verification status, memberType)
 *   - savedJobsCount
 *   - pendingConnectionsCount (incoming requests they haven't responded to)
 * Auth-required. Returns 401 if not authenticated.
 */
import type { Request, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { getAuth } from '@/lib/auth/auth';
import { db } from '@/server/db/client';
import { memberProfiles, memberConnections, savedJobs } from '@/server/db/schema';

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

    // Profile
    let profile: {
      firstName: string | null;
      lastName: string | null;
      headline: string | null;
      photoUrl: string | null;
      memberType: string | null;
      verificationStatus: string | null;
      city: string | null;
      state: string | null;
    } | null = null;

    let savedJobsCount = 0;
    let pendingConnectionsCount = 0;

    try {
      const [row] = await db
        .select({
          firstName:          memberProfiles.firstName,
          lastName:           memberProfiles.lastName,
          headline:           memberProfiles.headline,
          photoUrl:           memberProfiles.photoUrl,
          memberType:         memberProfiles.memberType,
          verificationStatus: memberProfiles.verificationStatus,
          city:               memberProfiles.city,
          state:              memberProfiles.state,
        })
        .from(memberProfiles)
        .where(eq(memberProfiles.userId, userId))
        .limit(1);

      if (row) profile = row;
    } catch {
      // Table may not exist yet
    }

    // Saved jobs
    try {
      const saved = await db.select({ id: savedJobs.id }).from(savedJobs).where(eq(savedJobs.userId, userId));
      savedJobsCount = saved.length;
    } catch {
      // Table may not exist yet
    }

    // Pending incoming connection requests
    try {
      const pending = await db
        .select({ id: memberConnections.id })
        .from(memberConnections)
        .where(
          and(
            eq(memberConnections.recipientId, userId),
            eq(memberConnections.status, 'pending'),
          )
        );
      pendingConnectionsCount = pending.length;
    } catch {
      // Table may not exist yet
    }

    return res.status(200).json({
      profile,
      savedJobsCount,
      pendingConnectionsCount,
    });
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
