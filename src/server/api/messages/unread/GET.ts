/**
 * GET /api/messages/unread
 * Returns total unread message count for the authenticated user.
 */
import type { Request, Response } from 'express';
import { eq, or, and, sql } from 'drizzle-orm';
import { db } from '../../../db/client.js';
import { conversations, messages } from '../../../db/schema.js';
import { getSessionUser } from '../../../middleware/auth-guards.js';

export default async function handler(req: Request, res: Response) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) { res.status(401).json({ error: 'Authentication required.' }); return; }

  const userId = sessionUser.id;

  const convRows = await db
    .select({ id: conversations.id, companyUserId: conversations.companyUserId })
    .from(conversations)
    .where(
      or(
        eq(conversations.companyUserId, userId),
        eq(conversations.memberUserId, userId)
      )
    );

  if (convRows.length === 0) {
    res.json({ unread: 0 });
    return;
  }

  let total = 0;
  for (const conv of convRows) {
    const iAmCompany = conv.companyUserId === userId;
    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(
        and(
          eq(messages.conversationId, conv.id),
          iAmCompany ? eq(messages.readByCompany, false) : eq(messages.readByMember, false),
          // Only messages from the other party
          iAmCompany
            ? sql`${messages.senderId} != ${userId}`
            : sql`${messages.senderId} != ${userId}`
        )
      );
    total += Number(row?.count ?? 0);
  }

  res.json({ unread: total });
}
