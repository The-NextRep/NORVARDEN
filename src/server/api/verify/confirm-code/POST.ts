/**
 * POST /api/verify/confirm-code  { email, code }
 * Five wrong guesses invalidate all of that email's active codes.
 * If the signed-in user's login email matches, it is marked verified too.
 */
import type { Request, Response } from 'express';
import { and, desc, eq, gt } from 'drizzle-orm';
import { db } from '../../../db/client.js';
import { emailVerifications, user } from '../../../db/schema.js';
import { getSessionUser } from '../../../middleware/auth-guards.js';

const MAX_ATTEMPTS = 5;

export default async function handler(req: Request, res: Response) {
  const { email, code } = req.body as { email?: string; code?: string };
  if (typeof email !== 'string' || typeof code !== 'string' || !email || !code) {
    res.status(400).json({ error: 'Email and code required.' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedCode = code.trim();

  const rows = await db
    .select()
    .from(emailVerifications)
    .where(
      and(
        eq(emailVerifications.email, normalizedEmail),
        gt(emailVerifications.expiresAt, new Date()),
        eq(emailVerifications.verified, false),
      ),
    )
    .orderBy(desc(emailVerifications.createdAt))
    .limit(10);

  const usable = rows.filter((r) => (r.attempts ?? 0) < MAX_ATTEMPTS);
  if (usable.length === 0) {
    res.status(400).json({ error: 'Code expired or not found. Request a new one.' });
    return;
  }

  const match = usable.find((r) => r.code === normalizedCode);
  if (!match) {
    const attempts = Math.max(...usable.map((r) => r.attempts ?? 0)) + 1;
    for (const row of usable) {
      await db.update(emailVerifications).set({ attempts }).where(eq(emailVerifications.id, row.id));
    }
    if (attempts >= MAX_ATTEMPTS) {
      res.status(400).json({ error: 'Too many incorrect attempts. Request a new code.' });
    } else {
      res.status(400).json({ error: 'Incorrect code.', attemptsLeft: MAX_ATTEMPTS - attempts });
    }
    return;
  }

  await db.update(emailVerifications).set({ verified: true }).where(eq(emailVerifications.id, match.id));

  const sessionUser = await getSessionUser(req);
  if (sessionUser && sessionUser.email.toLowerCase() === normalizedEmail) {
    await db.update(user).set({ emailVerified: true }).where(eq(user.id, sessionUser.id));
  }

  res.json({ verified: true, email: normalizedEmail });
}
