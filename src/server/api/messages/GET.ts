/**
 * GET /api/messages
 * Returns the authenticated user's conversation list.
 */
import type { Request, Response } from 'express';
import { eq, or, and, desc, sql } from 'drizzle-orm';
import { db } from '../../db/client.js';
import {
  conversations,
  messages,
  memberProfiles,
  memberConnections,
  verifiedCompanies,
} from '../../db/schema.js';
import { getSessionUser } from '../../middleware/auth-guards.js';

export default async function handler(req: Request, res: Response) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) { res.status(401).json({ error: 'Authentication required.' }); return; }

  const userId = sessionUser.id;

  const convRows = await db
    .select()
    .from(conversations)
    .where(
      or(
        eq(conversations.companyUserId, userId),
        eq(conversations.memberUserId, userId)
      )
    )
    .orderBy(desc(conversations.updatedAt));

  if (convRows.length === 0) {
    res.json({ conversations: [] });
    return;
  }

  const result = await Promise.all(
    convRows.map(async (conv) => {
      const iAmCompany = conv.companyUserId === userId;
      const otherUserId = iAmCompany ? conv.memberUserId : conv.companyUserId;

      const [otherProfile] = await db
        .select({
          firstName: memberProfiles.firstName,
          lastName: memberProfiles.lastName,
          photoUrl: memberProfiles.photoUrl,
          memberType: memberProfiles.memberType,
        })
        .from(memberProfiles)
        .where(eq(memberProfiles.userId, otherUserId))
        .limit(1);

      let companyName: string | null = null;
      if (!iAmCompany) {
        const [vc] = await db
          .select({ legalName: verifiedCompanies.legalName })
          .from(verifiedCompanies)
          .innerJoin(memberConnections, eq(memberConnections.verifiedCompanyId, verifiedCompanies.id))
          .where(eq(memberConnections.id, conv.connectionId))
          .limit(1);
        companyName = vc?.legalName ?? null;
      }

      const [conn] = await db
        .select({ status: memberConnections.status })
        .from(memberConnections)
        .where(eq(memberConnections.id, conv.connectionId))
        .limit(1);

      const [lastMsg] = await db
        .select({
          body: messages.body,
          senderId: messages.senderId,
          createdAt: messages.createdAt,
        })
        .from(messages)
        .where(eq(messages.conversationId, conv.id))
        .orderBy(desc(messages.createdAt))
        .limit(1);

      const [unreadRow] = await db
        .select({ count: sql<number>`count(*)` })
        .from(messages)
        .where(
          and(
            eq(messages.conversationId, conv.id),
            iAmCompany ? eq(messages.readByCompany, false) : eq(messages.readByMember, false),
            eq(messages.senderId, otherUserId)
          )
        );

      const unreadCount = Number(unreadRow?.count ?? 0);

      const memberName = [otherProfile?.firstName, otherProfile?.lastName].filter(Boolean).join(' ') || 'Member';
      const displayName = iAmCompany
        ? memberName
        : (companyName ?? memberName) || 'Company';

      return {
        id: conv.id,
        connectionId: conv.connectionId,
        connectionStatus: conn?.status ?? 'accepted',
        otherUserId,
        displayName,
        photoUrl: otherProfile?.photoUrl ?? null,
        memberType: otherProfile?.memberType ?? null,
        iAmCompany,
        lastMessageBody: lastMsg ? lastMsg.body.slice(0, 120) : null,
        lastMessageAt: lastMsg?.createdAt ?? conv.createdAt,
        lastMessageSenderId: lastMsg?.senderId ?? null,
        unreadCount,
        blockedAt: conv.blockedAt,
        reportedAt: conv.reportedAt,
        reportStatus: conv.reportStatus,
        safetyNoticeSeen: iAmCompany ? conv.companySafetyNoticeSeen : conv.memberSafetyNoticeSeen,
      };
    })
  );

  result.sort((a, b) => new Date(b.lastMessageAt!).getTime() - new Date(a.lastMessageAt!).getTime());

  res.json({ conversations: result });
}
