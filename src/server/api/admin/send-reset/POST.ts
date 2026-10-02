/**
 * POST /api/admin/send-reset
 * Admin-only: email a password-reset link to an account's OWN email address.
 * (Links are never sent to a different address, so this can't be used to
 * take over an account.)
 */
import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { user } from '@/server/db/schema';
import { issuePasswordReset } from '../../auth/forgot-password/POST';
import { logAdminAction } from '@/server/lib/admin-log';

export default async function handler(req: Request, res: Response) {
  const { accountEmail } = req.body ?? {};
  if (typeof accountEmail !== 'string' || !accountEmail.trim()) {
    return res.status(400).json({ error: 'accountEmail is required.' });
  }

  const [found] = await db
    .select({ id: user.id, email: user.email, name: user.name })
    .from(user)
    .where(eq(user.email, accountEmail.trim().toLowerCase()))
    .limit(1);
  if (!found) return res.status(404).json({ error: 'No account found for that email.' });

  try {
    await issuePasswordReset(found, req);
  } catch (err) {
    console.error('[admin/send-reset] email failed', err);
    return res.status(502).json({ error: 'Email send failed.' });
  }
  await logAdminAction(res, 'send_password_reset', 'user', found.id, found.email);
  return res.status(200).json({ ok: true, deliveredTo: found.email });
}
