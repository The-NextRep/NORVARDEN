/**
 * Local file storage for member uploads (profile photos, résumés).
 *
 * Base dir: process.env.UPLOAD_DIR || <cwd>/data/uploads
 *   <base>/profile-photos      — public, served by serveProfilePhoto at /uploads/profile-photos/:file
 *   <base>/private/resumes     — private, only streamed through access-checked API routes
 *
 * Uploads are validated by magic bytes (not the client-declared type) and
 * stored under random filenames.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import type { Request, Response } from 'express';

export const PHOTO_MAX_BYTES  = 5 * 1024 * 1024;
export const RESUME_MAX_BYTES = 10 * 1024 * 1024;

export const PHOTO_URL_PREFIX = '/uploads/profile-photos/';

const SAFE_NAME = /^[A-Za-z0-9._-]+$/;

export function uploadBaseDir(): string {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), 'data', 'uploads');
}
export function photoDir(): string {
  return path.join(uploadBaseDir(), 'profile-photos');
}
export function resumeDir(): string {
  return path.join(uploadBaseDir(), 'private', 'resumes');
}

/** True if `name` is a plain filename we generated / are willing to serve. */
export function isSafeFileName(name: string): boolean {
  return SAFE_NAME.test(name) && name !== '.' && name !== '..' && !name.startsWith('.');
}

function randomName(ext: string): string {
  return `${crypto.randomBytes(16).toString('hex')}.${ext}`;
}

/**
 * Decode a base64 payload (optionally a data: URL). Returns null if it is not
 * valid base64 or the decoded size exceeds maxBytes.
 */
export function decodeBase64Upload(input: unknown, maxBytes: number): Buffer | null | 'too_large' {
  if (typeof input !== 'string' || !input) return null;
  const b64 = input.replace(/^data:[^;,]*;base64,/, '').replace(/\s+/g, '');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(b64)) return null;
  // Cheap size check before allocating.
  if (Math.floor((b64.length * 3) / 4) > maxBytes + 3) return 'too_large';
  const buf = Buffer.from(b64, 'base64');
  if (buf.byteLength === 0) return null;
  if (buf.byteLength > maxBytes) return 'too_large';
  return buf;
}

// ── Magic-byte sniffing ──────────────────────────────────────────────────────
function startsWith(buf: Buffer, bytes: number[], offset = 0): boolean {
  if (buf.length < offset + bytes.length) return false;
  return bytes.every((b, i) => buf[offset + i] === b);
}

export type PhotoKind = 'jpg' | 'png' | 'webp';
export function sniffImage(buf: Buffer): PhotoKind | null {
  if (startsWith(buf, [0xff, 0xd8, 0xff])) return 'jpg';
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (startsWith(buf, [0x52, 0x49, 0x46, 0x46]) && startsWith(buf, [0x57, 0x45, 0x42, 0x50], 8)) return 'webp';
  return null;
}

export type ResumeKind = 'pdf' | 'docx' | 'doc';
export function sniffResume(buf: Buffer, originalName: string): ResumeKind | null {
  const lower = originalName.toLowerCase();
  if (startsWith(buf, [0x25, 0x50, 0x44, 0x46, 0x2d])) return 'pdf'; // %PDF-
  if (lower.endsWith('.docx') && startsWith(buf, [0x50, 0x4b, 0x03, 0x04])) return 'docx';
  if (lower.endsWith('.doc') && startsWith(buf, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) return 'doc';
  return null;
}

export const RESUME_CONTENT_TYPES: Record<ResumeKind, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc: 'application/msword',
};

const PHOTO_CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

// ── Photos ───────────────────────────────────────────────────────────────────
/** Writes a validated photo and returns its public URL. */
export async function savePhoto(buf: Buffer, kind: PhotoKind): Promise<string> {
  const dir = photoDir();
  await fsp.mkdir(dir, { recursive: true });
  const name = randomName(kind);
  await fsp.writeFile(path.join(dir, name), buf, { flag: 'wx' });
  return PHOTO_URL_PREFIX + name;
}

/** Deletes a previously stored photo given its public URL. Ignores anything not ours. */
export async function deletePhotoByUrl(url: string | null | undefined): Promise<void> {
  if (!url || !url.startsWith(PHOTO_URL_PREFIX)) return;
  const name = url.slice(PHOTO_URL_PREFIX.length);
  if (!isSafeFileName(name)) return;
  await fsp.unlink(path.join(photoDir(), name)).catch(() => {});
}

/** GET /uploads/profile-photos/:file */
export function serveProfilePhoto(req: Request, res: Response): void {
  const name = String(req.params['file'] ?? '');
  if (!isSafeFileName(name)) { res.status(404).end(); return; }
  const ext = path.extname(name).slice(1).toLowerCase();
  const type = PHOTO_CONTENT_TYPES[ext];
  if (!type) { res.status(404).end(); return; }

  const filePath = path.join(photoDir(), name);
  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) { res.status(404).end(); return; }
    res.setHeader('Content-Type', type);
    res.setHeader('Content-Length', String(st.size));
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'");
    if (req.method === 'HEAD') { res.end(); return; }
    const stream = fs.createReadStream(filePath);
    stream.on('error', () => { if (!res.headersSent) res.status(500); res.end(); });
    stream.pipe(res);
  });
}

// ── Résumés ──────────────────────────────────────────────────────────────────
/**
 * Résumé storage key format kept in memberProfiles.resumeUrl:
 *   "stored:<random>.<ext>"  → <base>/private/resumes/<random>.<ext>
 * Legacy rows hold "/api/profile/me/resume/download" with the file at
 * /private/resumes/<userId>/<resumeFileName>.
 */
const RESUME_KEY_PREFIX = 'stored:';

export async function saveResume(buf: Buffer, kind: ResumeKind): Promise<string> {
  const dir = resumeDir();
  await fsp.mkdir(dir, { recursive: true });
  const name = randomName(kind);
  await fsp.writeFile(path.join(dir, name), buf, { flag: 'wx', mode: 0o600 });
  return RESUME_KEY_PREFIX + name;
}

export async function deleteResumeByKey(key: string | null | undefined): Promise<void> {
  if (!key || !key.startsWith(RESUME_KEY_PREFIX)) return;
  const name = key.slice(RESUME_KEY_PREFIX.length);
  if (!isSafeFileName(name)) return;
  await fsp.unlink(path.join(resumeDir(), name)).catch(() => {});
}

/** Resolve the on-disk path of a member's résumé, or null if none exists. */
export function resolveResumePath(
  userId: string,
  resumeKey: string | null | undefined,
  resumeFileName: string | null | undefined,
): string | null {
  if (resumeKey && resumeKey.startsWith(RESUME_KEY_PREFIX)) {
    const name = resumeKey.slice(RESUME_KEY_PREFIX.length);
    if (!isSafeFileName(name)) return null;
    const p = path.join(resumeDir(), name);
    return fs.existsSync(p) ? p : null;
  }
  // Legacy locations
  if (!resumeFileName || !isSafeFileName(resumeFileName) || !isSafeFileName(userId)) return null;
  for (const root of [resumeDir(), '/private/resumes']) {
    const p = path.join(root, userId, resumeFileName);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/** Make a user-supplied filename safe for storage/display and Content-Disposition. */
export function sanitizeDownloadName(name: string | null | undefined, fallback = 'resume'): string {
  const base = String(name ?? '')
    .replace(/[\\/]/g, '_')
    .replace(/[^A-Za-z0-9._ -]/g, '_')
    .replace(/^\.+/, '')
    .trim()
    .slice(0, 150);
  return base || fallback;
}

/** Streams a résumé file as an attachment with the given display filename. */
export function streamResume(res: Response, filePath: string, displayName: string): void {
  const ext = path.extname(filePath).slice(1).toLowerCase() as ResumeKind;
  const type = RESUME_CONTENT_TYPES[ext] ?? 'application/octet-stream';
  let name = sanitizeDownloadName(displayName);
  if (!name.toLowerCase().endsWith(`.${ext}`) && RESUME_CONTENT_TYPES[ext]) name = `${name}.${ext}`;

  res.setHeader('Content-Type', type);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${name.replace(/"/g, '_')}"; filename*=UTF-8''${encodeURIComponent(name)}`,
  );
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const stream = fs.createReadStream(filePath);
  stream.on('error', () => {
    if (!res.headersSent) res.status(500).json({ error: 'Could not read file.' });
    else res.end();
  });
  stream.pipe(res);
}
