/**
 * POST /api/auth/resend-2fa
 * Body: { userId: <challenge id from /login> }
 * Sends a fresh code. Max 3 resends per 15 minutes.
 */
import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { user } from '@/server/db/schema';
import { sendTwoFactorCode } from '@/server/lib/mailer';
import { sha256, sixDigitCode } from '@/server/lib/security';

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_MAX = 3;
const RESEND_WINDOW_MS = 15 * 60 * 1000;
const GRACE_MS = 5 * 60 * 1000;

export default async function handler(req: Request, res: Response) {
  const { userId: challenge } = req.body ?? {};
  if (typeof challenge !== 'string' || !challenge) {
    return res.status(400).json({ error: 'Missing sign-in session.' });
  }

  const [found] = await db
    .select()
    .from(user)
    .where(eq(user.twoFactorChallenge, sha256(challenge)))
    .limit(1);

  if (
    !found ||
    !found.pendingSessionCookie ||
    !found.twoFactorExpiry ||
    found.twoFactorExpiry.getTime() + GRACE_MS < Date.now()
  ) {
    return res.status(400).json({
      error: 'no_pending_session',
      message: 'No active verification. Please sign in again.',
    });
  }

  const now = Date.now();
  const windowStart = found.otpResendWindowStart?.getTime() ?? 0;
  const windowActive = now - windowStart < RESEND_WINDOW_MS;
  const currentCount = windowActive ? found.otpResendCount ?? 0 : 0;
  if (windowActive && currentCount >= RESEND_MAX) {
    const minsLeft = Math.ceil((windowStart + RESEND_WINDOW_MS - now) / 60000);
    return res.status(429).json({
      error: 'resend_limit',
      message: `You've requested the maximum number of codes. Please wait ${minsLeft} minute${minsLeft !== 1 ? 's' : ''}.`,
      windowEndsMs: windowStart + RESEND_WINDOW_MS,
      resendsUsed: currentCount,
      resendsMax: RESEND_MAX,
    });
  }

  const code = sixDigitCode();
  const expiry = new Date(now + OTP_TTL_MS);
  await db
    .update(user)
    .set({
      twoFactorCode: code,
      twoFactorExpiry: expiry,
      twoFactorAttempts: 0,
      otpResendCount: currentCount + 1,
      otpResendWindowStart: windowActive ? found.otpResendWindowStart! : new Date(now),
    })
    .where(eq(user.id, found.id));

  try {
    await sendTwoFactorCode(found.email, found.name ?? 'there', code);
  } catch (err) {
    console.error('[resend-2fa] email failed for', found.email, err);
    return res.status(502).json({ error: 'email_failed', message: "We couldn't send the code. Please try again." });
  }

  return res.status(200).json({
    ok: true,
    resendsUsed: currentCount + 1,
    resendsRemaining: RESEND_MAX - currentCount - 1,
    expiresAt: expiry.toISOString(),
  });
}
