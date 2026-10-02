/**
 * POST /api/profile/me/photo
 * Body (JSON): { dataUrl: string (base64 / data URL), mimeType?: string }
 *
 * The image type is determined from the file's magic bytes (JPEG, PNG or
 * WebP only), not the declared mimeType. Max 5 MB. Stored under a random
 * filename in <UPLOAD_DIR>/profile-photos and served at
 * /uploads/profile-photos/<file>. The previous photo is deleted.
 */
import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../../../db/client.js';
import { memberProfiles } from '../../../../db/schema.js';
import { getSessionUser } from '../../../../middleware/auth-guards.js';
import {
  PHOTO_MAX_BYTES, decodeBase64Upload, deletePhotoByUrl, savePhoto, sniffImage,
} from '../../../../lib/storage.js';

export default async function handler(req: Request, res: Response) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) { res.status(401).json({ error: 'Authentication required.' }); return; }

  const { dataUrl } = (req.body ?? {}) as { dataUrl?: unknown };
  const buffer = decodeBase64Upload(dataUrl, PHOTO_MAX_BYTES);
  if (buffer === 'too_large') { res.status(413).json({ error: 'File too large. Maximum is 5 MB.' }); return; }
  if (!buffer) { res.status(400).json({ error: 'Please choose an image to upload.' }); return; }

  const kind = sniffImage(buffer);
  if (!kind) { res.status(400).json({ error: 'Only JPEG, PNG, and WebP images are accepted.' }); return; }

  const [existing] = await db
    .select({ photoUrl: memberProfiles.photoUrl })
    .from(memberProfiles)
    .where(eq(memberProfiles.userId, sessionUser.id))
    .limit(1);
  if (!existing) { res.status(404).json({ error: 'Profile not found. Complete sign-up first.' }); return; }

  const photoUrl = await savePhoto(buffer, kind);

  await db
    .update(memberProfiles)
    .set({ photoUrl })
    .where(eq(memberProfiles.userId, sessionUser.id));

  if (existing.photoUrl && existing.photoUrl !== photoUrl) await deletePhotoByUrl(existing.photoUrl);

  res.json({ photoUrl });
}
