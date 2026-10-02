/**
 * POST /api/profile/me/resume
 * Body (JSON): { dataUrl: string (base64 / data URL), fileName: string }
 *
 * Accepts PDF, DOCX or DOC, verified by magic bytes. Max 10 MB.
 * Stored privately under a random filename in <UPLOAD_DIR>/private/resumes;
 * memberProfiles.resumeUrl holds the internal storage key and
 * resumeFileName the (sanitized) original name. The previous file is deleted.
 * Downloads go through GET /api/profile/:userId/resume (access-checked).
 */
import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../../../db/client.js';
import { memberProfiles } from '../../../../db/schema.js';
import { getSessionUser } from '../../../../middleware/auth-guards.js';
import {
  RESUME_MAX_BYTES, decodeBase64Upload, deleteResumeByKey, sanitizeDownloadName,
  saveResume, sniffResume,
} from '../../../../lib/storage.js';

export default async function handler(req: Request, res: Response) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) { res.status(401).json({ error: 'Authentication required.' }); return; }

  const { dataUrl, fileName } = (req.body ?? {}) as { dataUrl?: unknown; fileName?: unknown };
  if (typeof fileName !== 'string' || !fileName.trim()) {
    res.status(400).json({ error: 'dataUrl and fileName required.' });
    return;
  }

  const buffer = decodeBase64Upload(dataUrl, RESUME_MAX_BYTES);
  if (buffer === 'too_large') { res.status(413).json({ error: 'File too large. Maximum is 10 MB.' }); return; }
  if (!buffer) { res.status(400).json({ error: 'dataUrl and fileName required.' }); return; }

  const kind = sniffResume(buffer, fileName);
  if (!kind) { res.status(400).json({ error: 'Only PDF, DOCX, or DOC files are accepted.' }); return; }

  const [existing] = await db
    .select({ resumeUrl: memberProfiles.resumeUrl })
    .from(memberProfiles)
    .where(eq(memberProfiles.userId, sessionUser.id))
    .limit(1);
  if (!existing) { res.status(404).json({ error: 'Profile not found. Complete sign-up first.' }); return; }

  let displayName = sanitizeDownloadName(fileName, `resume.${kind}`);
  if (!displayName.toLowerCase().endsWith(`.${kind}`)) {
    displayName = `${displayName.replace(/\.[A-Za-z0-9]{1,5}$/, '')}.${kind}`;
  }

  const storageKey = await saveResume(buffer, kind);

  await db
    .update(memberProfiles)
    .set({ resumeUrl: storageKey, resumeFileName: displayName })
    .where(eq(memberProfiles.userId, sessionUser.id));

  if (existing.resumeUrl && existing.resumeUrl !== storageKey) await deleteResumeByKey(existing.resumeUrl);

  res.json({ resumeUrl: `/api/profile/${encodeURIComponent(sessionUser.id)}/resume`, resumeFileName: displayName });
}
