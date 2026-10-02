/**
 * POST /api/admin/members/:id/reinstate
 * Lifts an account suspension (suspended=false, suspendedAt=null).
 */
import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { user } from '@/server/db/schema';
import { logAdminAction } from '@/server/lib/admin-log';
import { parseStringParam } from '../../../_shared/params';

export default async function handler(req: Request, res: Response) {
  const id = parseStringParam(req, 'id', 36);
  if (!id) { res.status(400).json({ error: 'Invalid member id.' }); return; }

  try {
    const [target] = await db
      .select({ id: user.id, email: user.email, suspended: user.suspended })
      .from(user)
      .where(eq(user.id, id))
      .limit(1);
    if (!target) { res.status(404).json({ error: 'Member not found.' }); return; }
    if (!target.suspended) { res.json({ ok: true, alreadyActive: true }); return; }

    await db.update(user).set({ suspended: false, suspendedAt: null }).where(eq(user.id, id));
    await logAdminAction(res, 'member_reinstate', 'user', id, target.email);

    res.json({ ok: true, suspended: false });
  } catch (err) {
    console.error('[admin/members/reinstate] failed', err);
    res.status(500).json({ error: 'Failed to reinstate member.' });
  }
}
