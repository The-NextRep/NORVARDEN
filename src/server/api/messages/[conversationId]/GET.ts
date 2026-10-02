/**
 * GET /api/messages/:conversationId
 * Returns messages in a conversation. Marks them as read for the caller.
 * Also marks safety notice as seen.
 * Admins can read any conversation (to review reports) without changing
 * read state.
 */
import type { Request, Response } from 'express';
import { eq, or, and, asc } from 'drizzle-orm';
import { db } from '../../../db/client.js';
import { conversations, messages, memberConnections } from '../../../db/schema.js';
import { getSessionUser } from '../../../middleware/auth-guards.js';

export default async function handler(req: Request, res: Response) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) { res.status(401).json({ error: 'Authentication required.' }); return; }

  const convId = parseInt(String(req.params['conversationId'] ?? ''), 10);
  if (isNaN(convId)) { res.status(400).json({ error: 'Invalid conversation id.' }); return; }

  const [conv] = await db
    .select()
    .from(conversations)
    .where(
      sessionUser.isAdmin
        ? eq(conversations.id, convId)
        : and(
            eq(conversations.id, convId),
            or(
              eq(conversations.companyUserId, sessionUser.id),
              eq(conversations.memberUserId, sessionUser.id)
            )
          )
    )
    .limit(1);

  if (!conv) { res.status(404).json({ error: 'Conversation not found.' }); return; }

  const iAmCompany = conv.companyUserId === sessionUser.id;
  const isParticipant = iAmCompany || conv.memberUserId === sessionUser.id;
  if (isParticipant) {
    // Mark unread messages from the other party as read
    const otherUserId = iAmCompany ? conv.memberUserId : conv.companyUserId;
    if (iAmCompany) {
      await db
        .update(messages)
        .set({ readByCompany: true })
        .where(and(eq(messages.conversationId, convId), eq(messages.senderId, otherUserId)));
    } else {
      await db
        .update(messages)
        .set({ readByMember: true })
        .where(and(eq(messages.conversationId, convId), eq(messages.senderId, otherUserId)));
    }

    // Mark safety notice seen
    if (iAmCompany && !conv.companySafetyNoticeSeen) {
      await db.update(conversations).set({ companySafetyNoticeSeen: true }).where(eq(conversations.id, convId));
    } else if (!iAmCompany && !conv.memberSafetyNoticeSeen) {
      await db.update(conversations).set({ memberSafetyNoticeSeen: true }).where(eq(conversations.id, convId));
    }
  }

  // Connection status
  const [conn] = await db
    .select({ status: memberConnections.status })
    .from(memberConnections)
    .where(eq(memberConnections.id, conv.connectionId))
    .limit(1);

  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, convId))
    .orderBy(asc(messages.createdAt));

  res.json({
    conversation: {
      id: conv.id,
      connectionId: conv.connectionId,
      connectionStatus: conn?.status ?? 'accepted',
      companyUserId: conv.companyUserId,
      memberUserId: conv.memberUserId,
      iAmCompany,
      blockedAt: conv.blockedAt,
      blockedBy: conv.blockedBy,
      reportedAt: conv.reportedAt,
      reportStatus: conv.reportStatus,
      safetyNoticeSeen: iAmCompany ? conv.companySafetyNoticeSeen : conv.memberSafetyNoticeSeen,
    },
    messages: msgs,
  });
}
