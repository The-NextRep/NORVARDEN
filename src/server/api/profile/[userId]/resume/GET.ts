/**
 * GET /api/profile/:userId/resume   (requireAuth)
 *
 * Streams a member's résumé as an attachment. Same access rule as contact
 * info: self, admin, or an employer with an accepted, unblocked connection.
 * `:userId` may be "me" for the caller's own résumé.
 */
import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../../../db/client.js';
import { memberProfiles, user as userTable } from '../../../../db/schema.js';
import { getSessionUser, type SessionUser } from '../../../../middleware/auth-guards.js';
import { resolveViewerAccess } from '../../contact-access.js';
import { resolveResumePath, streamResume } from '../../../../lib/storage.js';

export default async function handler(req: Request, res: Response) {
  const sessionUser =
    (res.locals['sessionUser'] as SessionUser | undefined) ?? (await getSessionUser(req));
  if (!sessionUser) { res.status(401).json({ error: 'Authentication required.' }); return; }

  const raw = String(req.params['userId'] ?? '');
  const userId = raw === 'me' ? sessionUser.id : raw;
  if (!userId) { res.status(400).json({ error: 'userId required.' }); return; }

  const [row] = await db
    .select({
      resumeUrl: memberProfiles.resumeUrl,
      resumeFileName: memberProfiles.resumeFileName,
      suspended: userTable.suspended,
    })
    .from(memberProfiles)
    .innerJoin(userTable, eq(userTable.id, memberProfiles.userId))
    .where(eq(memberProfiles.userId, userId))
    .limit(1);

  // Same 404 for "no such member", "suspended" and "not allowed" — don't leak existence.
  if (!row || (row.suspended && !sessionUser.isAdmin)) {
    res.status(404).json({ error: 'Resume not found.' });
    return;
  }

  const access = await resolveViewerAccess(sessionUser, userId);
  if (access === 'restricted') { res.status(404).json({ error: 'Resume not found.' }); return; }

  const filePath = resolveResumePath(userId, row.resumeUrl, row.resumeFileName);
  if (!filePath) { res.status(404).json({ error: 'Resume not found.' }); return; }

  streamResume(res, filePath, row.resumeFileName ?? 'resume');
}
