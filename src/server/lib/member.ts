/**
 * Helpers for member-only features (saved jobs, résumé builder).
 * A "member" is a signed-in athlete, coach or veteran — not an employer.
 */
import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { memberProfiles } from '@/server/db/schema';
import type { SessionUser } from '@/server/middleware/auth-guards';

/** Returns the session user if they are a member; otherwise sends 403 and returns null. */
export async function requireMember(res: Response): Promise<SessionUser | null> {
  const user = res.locals['sessionUser'] as SessionUser | undefined;
  if (!user) {
    res.status(401).json({ error: 'Authentication required.' });
    return null;
  }
  const [profile] = await db
    .select({ memberType: memberProfiles.memberType })
    .from(memberProfiles)
    .where(eq(memberProfiles.userId, user.id))
    .limit(1);
  if (profile?.memberType === 'employer') {
    res.status(403).json({ error: 'This feature is for people with disabilities.', code: 'members_only' });
    return null;
  }
  return user;
}

export function parseId(req: Request, param = 'jobId'): number | null {
  const raw = String(req.params[param] ?? '');
  if (!/^\d{1,10}$/.test(raw)) return null;
  const n = parseInt(raw, 10);
  return n > 0 ? n : null;
}
