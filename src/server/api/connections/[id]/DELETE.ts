/**
 * DELETE /api/connections/:id
 * Either side of a connection (the member recipient or the requesting
 * company user) can remove it. Removal hides the member's contact details
 * from the company again (status is no longer 'accepted'), and the company's
 * status endpoint reports 'unavailable' ("Not available").
 */
import type { Request, Response } from 'express';
import { eq, and, or, ne } from 'drizzle-orm';
import { db } from '../../../db/client.js';
import { memberConnections } from '../../../db/schema.js';
import { getSessionUser } from '../../../middleware/auth-guards.js';

export default async function handler(req: Request, res: Response) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) { res.status(401).json({ error: 'Authentication required.' }); return; }

  const idStr = String(req.params['id'] ?? '');
  if (!/^\d+$/.test(idStr)) { res.status(400).json({ error: 'Invalid connection id.' }); return; }
  const id = Number(idStr);

  // Caller must be a party to this connection
  const ownsIt = and(
    eq(memberConnections.id, id),
    or(
      eq(memberConnections.recipientId, sessionUser.id),
      eq(memberConnections.requesterId, sessionUser.id),
    ),
  );

  const [conn] = await db
    .select({ id: memberConnections.id, status: memberConnections.status })
    .from(memberConnections)
    .where(ownsIt)
    .limit(1);

  if (!conn) { res.status(404).json({ error: 'Connection not found.' }); return; }

  // Already ended — idempotent, and don't restart the 30-day cooldown.
  if (conn.status === 'declined') { res.json({ ok: true }); return; }

  // Mark as declined (with declinedAt) so the 30-day cooldown applies
  await db
    .update(memberConnections)
    .set({ status: 'declined', respondedAt: new Date(), declinedAt: new Date() })
    .where(and(ownsIt, ne(memberConnections.status, 'declined')));

  res.json({ ok: true });
}
