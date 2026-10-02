/**
 * POST /api/admin/members/:id/suspend
 * Suspends an account (user.suspended=true, suspendedAt=now) and deletes all of
 * its sessions so it is signed out everywhere. Admins (including yourself)
 * can never be suspended here.
 * Body: { reason?: string } (activity log only)
 */
import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { session, user } from '@/server/db/schema';
import { logAdminAction } from '@/server/lib/admin-log';
import { getAdmin, parseStringParam } from '../../../_shared/params';

export default async function handler(req: Request, res: Response) {
  const id = parseStringParam(req, 'id', 36);
  if (!id) { res.status(400).json({ error: 'Invalid member id.' }); return; }

  const admin = getAdmin(res);
  if (admin?.id === id) { res.status(400).json({ error: 'You cannot suspend your own account.' }); return; }

  const body = (req.body ?? {}) as { reason?: unknown };
  const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 500) : '';

  try {
    const [target] = await db
      .select({ id: user.id, email: user.email, isAdmin: user.isAdmin, suspended: user.suspended })
      .from(user)
      .where(eq(user.id, id))
      .limit(1);
    if (!target) { res.status(404).json({ error: 'Member not found.' }); return; }
    if (target.isAdmin) { res.status(403).json({ error: 'Admin accounts cannot be suspended.' }); return; }

    const suspendedAt = new Date();
    if (!target.suspended) {
      await db.update(user).set({ suspended: true, suspendedAt }).where(eq(user.id, id));
    }
    // Always clear sessions (also covers a stale session on an already-suspended account).
    const result = await db.delete(session).where(eq(session.userId, id));
    const sessionsRevoked = result[0]?.affectedRows ?? 0;

    if (!target.suspended) {
      await logAdminAction(res, 'member_suspend', 'user', id, `${target.email}${reason ? ' — ' + reason : ''}`);
    }

    res.json({ ok: true, suspended: true, alreadySuspended: !!target.suspended, sessionsRevoked });
  } catch (err) {
    console.error('[admin/members/suspend] failed', err);
    res.status(500).json({ error: 'Failed to suspend member.' });
  }
}
