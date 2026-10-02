/**
 * POST /api/connections/:id/decline
 * The recipient member silently declines a pending connection request.
 * The requester only sees "Not available" if they check status.
 * Records declinedAt for the 30-day cooldown.
 */
import type { Request, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../../../../db/client.js';
import { memberConnections } from '../../../../db/schema.js';
import { getSessionUser } from '../../../../middleware/auth-guards.js';

export default async function handler(req: Request, res: Response) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) { res.status(401).json({ error: 'Authentication required.' }); return; }

  const idStr = String(req.params['id'] ?? '');
  if (!/^\d+$/.test(idStr)) { res.status(400).json({ error: 'Invalid connection id.' }); return; }
  const id = Number(idStr);

  const [conn] = await db
    .select({ id: memberConnections.id })
    .from(memberConnections)
    .where(
      and(
        eq(memberConnections.id, id),
        eq(memberConnections.recipientId, sessionUser.id),
        eq(memberConnections.status, 'pending')
      )
    )
    .limit(1);

  if (!conn) { res.status(404).json({ error: 'Pending request not found.' }); return; }

  await db
    .update(memberConnections)
    .set({ status: 'declined', respondedAt: new Date(), declinedAt: new Date() })
    .where(
      and(
        eq(memberConnections.id, id),
        eq(memberConnections.recipientId, sessionUser.id),
        eq(memberConnections.status, 'pending')
      )
    );

  res.json({ ok: true, status: 'declined' });
}
