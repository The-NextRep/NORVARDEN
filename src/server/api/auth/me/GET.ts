/**
 * GET /api/auth/me
 * Returns the current user enriched with memberType and isAdmin.
 * Returns { user: null } when not authenticated.
 */
import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { getAuth } from '@/lib/auth/auth';
import { db } from '@/server/db/client';
import { memberProfiles } from '@/server/db/schema';

export default async function handler(req: Request, res: Response) {
  try {
    const auth    = getAuth();
    const session = await auth.api.getSession({
      headers: req.headers as unknown as Headers,
    });

    if (!session?.user || (session.user as { suspended?: boolean }).suspended) {
      return res.status(200).json({ user: null });
    }

    // Fetch member profile for role
    let memberType: string | null = null;
    try {
      const [profile] = await db
        .select({ memberType: memberProfiles.memberType })
        .from(memberProfiles)
        .where(eq(memberProfiles.userId, session.user.id))
        .limit(1);
      memberType = profile?.memberType ?? null;
    } catch {
      // Table may not exist yet — treat as no profile
    }

    const isAdmin = (session.user as { isAdmin?: boolean }).isAdmin ?? false;

    return res.status(200).json({
      user: {
        id:         session.user.id,
        email:      session.user.email,
        name:       session.user.name,
        memberType,
        isAdmin,
      },
    });
  } catch {
    return res.status(200).json({ user: null });
  }
}
