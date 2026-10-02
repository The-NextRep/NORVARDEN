/**
 * POST /api/auth/verify-2fa
 * Body: { userId: <challenge id from /login>, code: '123456' }
 *
 * Five wrong codes cancel the pending sign-in. On success the held session
 * cookie is released to the browser and the email is marked verified
 * (the user just proved they can read that inbox).
 */
import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { user, memberProfiles, session } from '@/server/db/schema';
import { sha256 } from '@/server/lib/security';
import { roleDestination } from '../login/POST';

const MAX_CODE_ATTEMPTS = 5;

function sessionTokenFromCookies(lines: string[]): string | null {
  for (const line of lines) {
    const m = line.match(/^(?:__Secure-)?better-auth\.session_token=([^;]+)/);
    if (m) return decodeURIComponent(m[1]).split('.')[0];
  }
  return null;
}

export default async function handler(req: Request, res: Response) {
  const { userId: challenge, code } = req.body ?? {};
  if (typeof challenge !== 'string' || !challenge || !code) {
    return res.status(400).json({ error: 'Verification code is required.' });
  }

  const [found] = await db
    .select()
    .from(user)
    .where(eq(user.twoFactorChallenge, sha256(challenge)))
    .limit(1);

  const expired = () =>
    res.status(400).json({
      error: 'expired',
      message: 'Your verification code has expired. Please sign in again.',
    });

  if (!found || !found.twoFactorCode || !found.twoFactorExpiry || found.twoFactorExpiry < new Date()) {
    return expired();
  }

  const pendingLines = (found.pendingSessionCookie ?? '').split('\n').filter(Boolean);

  if (found.twoFactorCode !== String(code).trim()) {
    const attempts = (found.twoFactorAttempts ?? 0) + 1;
    if (attempts >= MAX_CODE_ATTEMPTS) {
      // Cancel this sign-in entirely, including the held session.
      const token = sessionTokenFromCookies(pendingLines);
      if (token) await db.delete(session).where(eq(session.token, token));
      await db
        .update(user)
        .set({
          twoFactorCode: null,
          twoFactorExpiry: null,
          twoFactorChallenge: null,
          twoFactorAttempts: 0,
          pendingSessionCookie: null,
        })
        .where(eq(user.id, found.id));
      return res.status(400).json({
        error: 'expired',
        message: 'Too many incorrect codes. Please sign in again.',
      });
    }
    await db.update(user).set({ twoFactorAttempts: attempts }).where(eq(user.id, found.id));
    return res.status(401).json({
      error: 'invalid_code',
      message: `Incorrect code. ${MAX_CODE_ATTEMPTS - attempts} attempt${MAX_CODE_ATTEMPTS - attempts === 1 ? '' : 's'} left.`,
    });
  }

  if (pendingLines.length === 0) return expired();

  await db
    .update(user)
    .set({
      twoFactorCode: null,
      twoFactorExpiry: null,
      twoFactorChallenge: null,
      twoFactorAttempts: 0,
      pendingSessionCookie: null,
      emailVerified: true,
    })
    .where(eq(user.id, found.id));

  for (const line of pendingLines) res.append('Set-Cookie', line);

  const [profile] = await db
    .select({ memberType: memberProfiles.memberType })
    .from(memberProfiles)
    .where(eq(memberProfiles.userId, found.id))
    .limit(1);
  const memberType = profile?.memberType ?? null;
  const isAdmin = found.isAdmin ?? false;

  return res.status(200).json({
    step: 'done',
    destination: roleDestination(memberType, isAdmin),
    user: { id: found.id, email: found.email, name: found.name, memberType, isAdmin },
  });
}
