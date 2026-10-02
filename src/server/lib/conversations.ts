/**
 * Finds or creates the message thread for an accepted connection, so both
 * sides see it in /messages as soon as the member accepts.
 */
import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { conversations, memberConnections } from '../db/schema.js';

export async function ensureConversation(connectionId: number): Promise<number | null> {
  const [existing] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(eq(conversations.connectionId, connectionId))
    .limit(1);
  if (existing) return existing.id;

  const [conn] = await db
    .select({ requesterId: memberConnections.requesterId, recipientId: memberConnections.recipientId, status: memberConnections.status })
    .from(memberConnections)
    .where(eq(memberConnections.id, connectionId))
    .limit(1);
  if (!conn || conn.status !== 'accepted') return null;

  const [inserted] = await db
    .insert(conversations)
    .values({ connectionId, companyUserId: conn.requesterId, memberUserId: conn.recipientId })
    .$returningId();
  return inserted.id;
}
