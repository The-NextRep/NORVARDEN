/**
 * GET /api/profile/me/resume/download
 * Streams the authenticated member's own résumé (kept for older links;
 * equivalent to GET /api/profile/me/resume).
 */
import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../../../../db/client.js';
import { memberProfiles } from '../../../../../db/schema.js';
import { getSessionUser } from '../../../../../middleware/auth-guards.js';
import { resolveResumePath, streamResume } from '../../../../../lib/storage.js';

export default async function handler(req: Request, res: Response) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) { res.status(401).json({ error: 'Authentication required.' }); return; }

  const [profile] = await db
    .select({ resumeUrl: memberProfiles.resumeUrl, resumeFileName: memberProfiles.resumeFileName })
    .from(memberProfiles)
    .where(eq(memberProfiles.userId, sessionUser.id))
    .limit(1);

  const filePath = profile ? resolveResumePath(sessionUser.id, profile.resumeUrl, profile.resumeFileName) : null;
  if (!profile || !filePath) {
    res.status(404).json({ error: 'No resume on file.' });
    return;
  }

  streamResume(res, filePath, profile.resumeFileName ?? 'resume');
}
