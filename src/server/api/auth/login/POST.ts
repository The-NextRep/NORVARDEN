/**
 * POST /api/auth/login
 *
 * Custom login on top of BetterAuth:
 *  - per-account lockout (5 failures → 15 min) and per-IP rate limit
 *  - email one-time code (2FA) for company accounts and admins
 *  - role-based destination in the response
 *
 * The 2FA step returns a random challenge id (in the `userId` field, for
 * compatibility with the login page). The BetterAuth session cookie is held
 * server-side and only released after the code is verified.
 */
import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { user, memberProfiles } from '@/server/db/schema';
import { getAuth } from '@/lib/auth/auth';
import { sendTwoFactorCode } from '@/server/lib/mailer';
import { clientIp, rateLimit, randomToken, sha256, sixDigitCode } from '@/server/lib/security';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const OTP_TTL_MS = 10 * 60 * 1000;

/**
 * Admin 2FA is ON unless SKIP_ADMIN_2FA=true is set in the environment.
 * Only use that switch temporarily (e.g. while email delivery is being set up).
 */
const skipAdmin2fa = () => /^(1|true|yes)$/i.test(process.env.SKIP_ADMIN_2FA ?? '');

export function roleDestination(memberType: string | null, isAdmin: boolean): string {
  if (isAdmin) return '/admin';
  switch (memberType) {
    case 'employer':
      return '/company/dashboard';
    case 'athlete':
    case 'coach':
    case 'veteran':
      return '/dashboard';
    default:
      // Account exists but sign-up stopped before the profile step.
      return '/signup';
  }
}

function setCookieLines(response: globalThis.Response): string[] {
  return response.headers.getSetCookie
    ? response.headers.getSetCookie()
    : [response.headers.get('set-cookie') ?? ''].filter(Boolean);
}

export default async function handler(req: Request, res: Response) {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  const normalizedEmail = email.trim().toLowerCase();

  if (!rateLimit(`login-ip:${clientIp(req)}`, 30, 15 * 60 * 1000)) {
    return res.status(429).json({
      error: 'rate_limited',
      message: 'Too many sign-in attempts from this network. Please wait 15 minutes.',
    });
  }

  const [found] = await db.select().from(user).where(eq(user.email, normalizedEmail)).limit(1);
  const invalid = () =>
    res.status(401).json({ error: 'invalid_credentials', message: 'Incorrect email or password.' });
  if (!found) return invalid();

  if (found.lockedUntil && found.lockedUntil > new Date()) {
    const secsLeft = Math.ceil((found.lockedUntil.getTime() - Date.now()) / 1000);
    return res.status(429).json({
      error: 'locked',
      message: 'Too many failed attempts. Your account is temporarily locked.',
      lockedUntilMs: found.lockedUntil.getTime(),
      secsLeft,
    });
  }

  const auth = getAuth();
  const signInResponse = await auth.api
    .signInEmail({
      body: { email: normalizedEmail, password },
      headers: req.headers as unknown as Headers,
      asResponse: true,
    })
    .catch(() => null);

  if (!signInResponse || signInResponse.status !== 200) {
    const newAttempts = (found.loginAttempts ?? 0) + 1;
    const lockUntil = newAttempts >= MAX_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MS) : null;
    await db
      .update(user)
      .set(lockUntil ? { lockedUntil: lockUntil, loginAttempts: 0 } : { loginAttempts: newAttempts })
      .where(eq(user.id, found.id));

    if (lockUntil) {
      return res.status(429).json({
        error: 'locked',
        message: 'Too many failed attempts. Your account is locked for 15 minutes.',
        lockedUntilMs: lockUntil.getTime(),
        secsLeft: Math.ceil(LOCKOUT_MS / 1000),
      });
    }
    return invalid();
  }

  // Credentials are correct. Suspended accounts stop here.
  if (found.suspended) {
    return res.status(403).json({
      error: 'suspended',
      message: 'This account has been suspended. Contact info@norvarden.com.',
    });
  }

  await db.update(user).set({ loginAttempts: 0, lockedUntil: null }).where(eq(user.id, found.id));

  const [profile] = await db
    .select({ memberType: memberProfiles.memberType })
    .from(memberProfiles)
    .where(eq(memberProfiles.userId, found.id))
    .limit(1);
  const memberType = profile?.memberType ?? null;
  const isAdmin = found.isAdmin ?? false;

  const needs2FA = memberType === 'employer' || (isAdmin && !skipAdmin2fa());

  if (needs2FA) {
    const challenge = randomToken(24);
    const code = sixDigitCode();
    await db
      .update(user)
      .set({
        twoFactorCode: code,
        twoFactorExpiry: new Date(Date.now() + OTP_TTL_MS),
        twoFactorChallenge: sha256(challenge),
        twoFactorAttempts: 0,
        pendingSessionCookie: setCookieLines(signInResponse).join('\n'),
      })
      .where(eq(user.id, found.id));

    try {
      await sendTwoFactorCode(found.email, found.name ?? 'there', code);
    } catch (err) {
      console.error('[login] 2FA email failed for', found.email, err);
      return res.status(502).json({
        error: 'email_failed',
        message: "We couldn't send your verification code. Please try again in a minute.",
      });
    }

    return res.status(200).json({
      step: '2fa_required',
      userId: challenge,
      deliveryEmail: found.email,
      message: `A 6-digit verification code has been sent to ${found.email}.`,
    });
  }

  for (const line of setCookieLines(signInResponse)) res.append('Set-Cookie', line);

  return res.status(200).json({
    step: 'done',
    destination: roleDestination(memberType, isAdmin),
    user: { id: found.id, email: found.email, name: found.name, memberType, isAdmin },
  });
}
