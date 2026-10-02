/**
 * GET /api/connections/status/:recipientId
 * Returns the connection status between the authenticated employer and a member.
 * Returns { status: 'none' | 'pending' | 'accepted' | 'unavailable' }
 *
 * Declines are silent: a declined/removed connection, a blocked conversation,
 * or a suspended member all read as 'unavailable' ("Not available").
 */
import type { Request, Response } from 'express';
import { and, desc, eq, isNotNull } from 'drizzle-orm';
import { db } from '../../../../db/client.js';
import { conversations, memberConnections, user as userTable } from '../../../../db/schema.js';
import { getSessionUser } from '../../../../middleware/auth-guards.js';
import { ensureConversation } from '../../../../lib/conversations.js';

export type PublicConnectionStatus = 'none' | 'pending' | 'accepted' | 'unavailable';

export default async function handler(req: Request, res: Response) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) { res.status(401).json({ error: 'Authentication required.' }); return; }

  const recipientId = String(req.params['recipientId'] ?? '');
  if (!recipientId) { res.status(400).json({ error: 'recipientId required.' }); return; }

  const [conn] = await db
    .select({ id: memberConnections.id, status: memberConnections.status })
    .from(memberConnections)
    .where(
      and(
        eq(memberConnections.requesterId, sessionUser.id),
        eq(memberConnections.recipientId, recipientId)
      )
    )
    .orderBy(desc(memberConnections.id))
    .limit(1);

  let status: PublicConnectionStatus =
    !conn?.status ? 'none'
    : conn.status === 'pending' ? 'pending'
    : conn.status === 'accepted' ? 'accepted'
    : 'unavailable';

  if (status !== 'none') {
    const [recipient] = await db
      .select({ suspended: userTable.suspended })
      .from(userTable)
      .where(eq(userTable.id, recipientId))
      .limit(1);
    if (!recipient || recipient.suspended) status = 'unavailable';
  }

  if (status === 'accepted') {
    const [blocked] = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(
        and(
          eq(conversations.companyUserId, sessionUser.id),
          eq(conversations.memberUserId, recipientId),
          isNotNull(conversations.blockedAt),
        ),
      )
      .limit(1);
    if (blocked) status = 'unavailable';
  }

  // Accepted connections always have a thread so the company can message.
  const conversationId = status === 'accepted' && conn ? await ensureConversation(conn.id) : null;

  res.json({ status, conversationId });
}
