/**
 * POST /api/verify/send-code  { email }
 * Emails a 6-digit code to a company work email (step 1 of verification).
 */
import type { Request, Response } from 'express';
import { and, eq, gt } from 'drizzle-orm';
import { db } from '../../../db/client.js';
import { emailVerifications } from '../../../db/schema.js';
import { isEmailDomainBlocked, extractDomain, codeExpiresAt } from '../../../lib/verify-helpers.js';
import { sendVerificationCode } from '@/server/lib/mailer';
import { clientIp, rateLimit, sixDigitCode } from '@/server/lib/security';

export default async function handler(req: Request, res: Response) {
  const { email } = req.body as { email?: string };
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.length > 255) {
    res.status(400).json({ error: 'Valid email required.' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (await isEmailDomainBlocked(extractDomain(normalizedEmail))) {
    res.status(400).json({ error: 'Please use your work email.', code: 'FREE_EMAIL' });
    return;
  }

  if (!rateLimit(`verify-send-ip:${clientIp(req)}`, 10, 60 * 60 * 1000)) {
    res.status(429).json({ error: 'Too many requests. Please try again later.' });
    return;
  }

  const recent = await db
    .select({ id: emailVerifications.id })
    .from(emailVerifications)
    .where(and(eq(emailVerifications.email, normalizedEmail), gt(emailVerifications.expiresAt, new Date())));
  if (recent.length >= 3) {
    res.status(429).json({ error: 'Too many codes requested. Please wait 15 minutes.' });
    return;
  }

  const code = sixDigitCode();
  await db.insert(emailVerifications).values({
    email: normalizedEmail,
    code,
    expiresAt: codeExpiresAt(),
    verified: false,
    attempts: 0,
  });

  try {
    await sendVerificationCode(normalizedEmail, code);
  } catch (err) {
    console.error('[verify/send-code] email failed for', normalizedEmail, err);
    res.status(502).json({ error: "We couldn't send the code. Please try again in a minute." });
    return;
  }

  res.json({ sent: true, email: normalizedEmail });
}
