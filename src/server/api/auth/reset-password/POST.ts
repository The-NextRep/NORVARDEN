/**
 * POST /api/auth/reset-password
 * Body: { token, password }
 *
 * Uses BetterAuth's own scrypt hasher so normal sign-in can verify the new
 * password. Creates the credential account row if it is missing. Signs the
 * user out everywhere and marks the email as verified (they received the link).
 */
import type { Request, Response } from 'express';
import { and, eq, isNull } from 'drizzle-orm';
import crypto from 'crypto';
import { hashPassword } from '@better-auth/utils/password';
import { db } from '@/server/db/client';
import { user, account, passwordResetTokens, session } from '@/server/db/schema';
import { sha256 } from '@/server/lib/security';

export default async function handler(req: Request, res: Response) {
  const { token, password } = req.body ?? {};
  if (typeof token !== 'string' || !token || typeof password !== 'string') {
    return res.status(400).json({ error: 'Token and new password are required.' });
  }
  if (password.length < 10 || password.length > 128) {
    return res.status(400).json({ error: 'Password must be between 10 and 128 characters.' });
  }

  const [record] = await db
    .select()
    .from(passwordResetTokens)
    .where(and(eq(passwordResetTokens.token, sha256(token)), isNull(passwordResetTokens.usedAt)))
    .limit(1);

  if (!record) {
    return res.status(400).json({
      error: 'invalid_token',
      message: 'This reset link is invalid or has already been used.',
    });
  }
  if (record.expiresAt < new Date()) {
    return res.status(400).json({
      error: 'expired_token',
      message: 'This reset link has expired. Please request a new one.',
    });
  }

  const hash = await hashPassword(password);
  const now = new Date();

  const [existing] = await db
    .select({ id: account.id })
    .from(account)
    .where(and(eq(account.userId, record.userId), eq(account.providerId, 'credential')))
    .limit(1);

  if (existing) {
    await db.update(account).set({ password: hash, updatedAt: now }).where(eq(account.id, existing.id));
  } else {
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: record.userId,
      providerId: 'credential',
      userId: record.userId,
      password: hash,
      createdAt: now,
      updatedAt: now,
    });
  }

  await db.update(passwordResetTokens).set({ usedAt: now }).where(eq(passwordResetTokens.userId, record.userId));
  await db.delete(session).where(eq(session.userId, record.userId));
  await db
    .update(user)
    .set({
      loginAttempts: 0,
      lockedUntil: null,
      emailVerified: true,
      twoFactorCode: null,
      twoFactorChallenge: null,
      pendingSessionCookie: null,
    })
    .where(eq(user.id, record.userId));

  return res.status(200).json({ ok: true });
}
