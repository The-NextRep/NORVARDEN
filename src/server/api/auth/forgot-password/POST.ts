/**
 * POST /api/auth/forgot-password
 * Emails a one-hour reset link. Always returns 200 (doesn't reveal accounts).
 */
import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { user, passwordResetTokens } from '@/server/db/schema';
import { sendPasswordReset } from '@/server/lib/mailer';
import { appBaseUrl, clientIp, randomToken, rateLimit, sha256 } from '@/server/lib/security';

const TOKEN_TTL_MS = 60 * 60 * 1000;

export async function issuePasswordReset(
  account: { id: string; email: string; name: string | null },
  req?: Request,
): Promise<void> {
  const token = randomToken(32);
  await db.insert(passwordResetTokens).values({
    userId: account.id,
    token: sha256(token),
    expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
  });
  const resetUrl = `${appBaseUrl(req)}/reset-password?token=${token}`;
  await sendPasswordReset(account.email, account.name ?? 'there', resetUrl);
}

export default async function handler(req: Request, res: Response) {
  const { email } = req.body ?? {};
  if (typeof email !== 'string' || !email.trim()) return res.status(200).json({ ok: true });

  const normalized = email.trim().toLowerCase();
  if (
    !rateLimit(`forgot-ip:${clientIp(req)}`, 10, 60 * 60 * 1000) ||
    !rateLimit(`forgot-email:${normalized}`, 3, 15 * 60 * 1000)
  ) {
    return res.status(200).json({ ok: true });
  }

  const [found] = await db
    .select({ id: user.id, email: user.email, name: user.name })
    .from(user)
    .where(eq(user.email, normalized))
    .limit(1);

  if (found) {
    try {
      await issuePasswordReset(found, req);
    } catch (err) {
      console.error('[forgot-password] email failed for', found.email, err);
    }
  }
  return res.status(200).json({ ok: true });
}
