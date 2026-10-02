/**
 * POST /api/messages/:conversationId/block
 * Member blocks the company in this conversation.
 * This ends the connection and freezes the thread.
 */
import type { Request, Response } from 'express';
import { eq, and, or } from 'drizzle-orm';
import { db } from '../../../../db/client.js';
import { conversations, memberConnections } from '../../../../db/schema.js';
import { getSessionUser } from '../../../../middleware/auth-guards.js';

export default async function handler(req: Request, res: Response) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) { res.status(401).json({ error: 'Authentication required.' }); return; }

  const convId = parseInt(String(req.params['conversationId'] ?? ''), 10);
  if (isNaN(convId)) { res.status(400).json({ error: 'Invalid conversation id.' }); return; }

  const [conv] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, convId),
        or(
          eq(conversations.companyUserId, sessionUser.id),
          eq(conversations.memberUserId, sessionUser.id)
        )
      )
    )
    .limit(1);

  if (!conv) { res.status(404).json({ error: 'Conversation not found.' }); return; }
  if (conv.blockedAt) { res.json({ ok: true, alreadyBlocked: true }); return; }

  // Block the conversation
  await db
    .update(conversations)
    .set({ blockedAt: new Date(), blockedBy: sessionUser.id })
    .where(eq(conversations.id, convId));

  // End the connection — mark as declined with declinedAt so 30-day cooldown applies
  await db
    .update(memberConnections)
    .set({ status: 'declined', respondedAt: new Date(), declinedAt: new Date() })
    .where(eq(memberConnections.id, conv.connectionId));

  res.json({ ok: true });
}
