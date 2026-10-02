/**
 * POST /api/messages
 * Body: { recipientId: string; body: string }
 * Sends a message. Creates the conversation lazily if it doesn't exist.
 * Requires an accepted connection. Blocked conversations are rejected.
 * Sends a notification email to the recipient (unless they opted out).
 */
import type { Request, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../../db/client.js';
import {
  conversations,
  messages,
  memberConnections,
  memberProfiles,
  messageNotificationPrefs,
  user as userTable,
} from '../../db/schema.js';
import { getSessionUser } from '../../middleware/auth-guards.js';
import { sendNewMessageEmail } from '../../lib/mailer.js';

export default async function handler(req: Request, res: Response) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) { res.status(401).json({ error: 'Authentication required.' }); return; }

  const { recipientId, body } = req.body as { recipientId?: string; body?: string };
  if (!recipientId) { res.status(400).json({ error: 'recipientId required.' }); return; }
  if (!body || body.trim().length === 0) { res.status(400).json({ error: 'Message body required.' }); return; }
  if (body.trim().length > 2000) { res.status(400).json({ error: 'Message too long (max 2000 characters).' }); return; }

  const senderId = sessionUser.id;
  if (senderId === recipientId) { res.status(400).json({ error: 'Cannot message yourself.' }); return; }

  // Determine who is the company and who is the member
  const [senderProfile] = await db
    .select({ memberType: memberProfiles.memberType })
    .from(memberProfiles)
    .where(eq(memberProfiles.userId, senderId))
    .limit(1);

  const senderIsEmployer = senderProfile?.memberType === 'employer';

  const companyUserId = senderIsEmployer ? senderId : recipientId;
  const memberUserId  = senderIsEmployer ? recipientId : senderId;

  // Verify accepted connection exists
  const [conn] = await db
    .select()
    .from(memberConnections)
    .where(
      and(
        eq(memberConnections.requesterId, companyUserId),
        eq(memberConnections.recipientId, memberUserId),
        eq(memberConnections.status, 'accepted')
      )
    )
    .limit(1);

  if (!conn) {
    res.status(403).json({ error: 'An accepted connection is required before messaging.' });
    return;
  }

  // Find or create conversation
  let [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.connectionId, conn.id))
    .limit(1);

  if (!conv) {
    const [inserted] = await db
      .insert(conversations)
      .values({
        connectionId: conn.id,
        companyUserId,
        memberUserId,
      })
      .$returningId();
    const [newConv] = await db.select().from(conversations).where(eq(conversations.id, inserted.id)).limit(1);
    conv = newConv!;
  }

  // Check blocked
  if (conv.blockedAt) {
    res.status(403).json({ error: 'This conversation has been blocked.' });
    return;
  }

  // Insert message
  const trimmedBody = body.trim();
  const [inserted] = await db
    .insert(messages)
    .values({
      conversationId: conv.id,
      senderId,
      body: trimmedBody,
      readByMember: senderIsEmployer ? false : true,
      readByCompany: senderIsEmployer ? true : false,
    })
    .$returningId();

  // Update conversation updatedAt
  await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, conv.id));

  // Fetch the inserted message
  const [newMsg] = await db.select().from(messages).where(eq(messages.id, inserted.id)).limit(1);

  // Send notification email to recipient (fire-and-forget)
  void (async () => {
    try {
      // Check if recipient has opted out
      const [pref] = await db
        .select({ emailEnabled: messageNotificationPrefs.emailEnabled })
        .from(messageNotificationPrefs)
        .where(eq(messageNotificationPrefs.userId, recipientId))
        .limit(1);

      const emailEnabled = pref?.emailEnabled ?? true;
      if (!emailEnabled) return;

      const [recipientUser] = await db
        .select({ email: userTable.email, name: userTable.name })
        .from(userTable)
        .where(eq(userTable.id, recipientId))
        .limit(1);

      if (!recipientUser?.email) return;

      // Look up company name from the employer's profile
      const [companyProfile] = await db
        .select({ companyName: memberProfiles.companyName })
        .from(memberProfiles)
        .where(eq(memberProfiles.userId, companyUserId))
        .limit(1);

      const companyName = companyProfile?.companyName ?? 'A company';

      await sendNewMessageEmail(
        recipientUser.email,
        recipientUser.name ?? 'Member',
        companyName,
        conv.id,
      );
    } catch (err) {
      console.error('[messages/POST] notification email failed', err);
    }
  })();

  res.status(201).json({ message: newMsg, conversationId: conv.id });
}
