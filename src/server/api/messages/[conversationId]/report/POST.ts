/**
 * POST /api/messages/:conversationId/report
 * Body: { reason: string }
 * Reports a conversation for admin review.
 */
import type { Request, Response } from 'express';
import { eq, or, and } from 'drizzle-orm';
import { db } from '../../../../db/client.js';
import { conversations } from '../../../../db/schema.js';
import { getSessionUser } from '../../../../middleware/auth-guards.js';

export default async function handler(req: Request, res: Response) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) { res.status(401).json({ error: 'Authentication required.' }); return; }

  const convId = parseInt(String(req.params['conversationId'] ?? ''), 10);
  if (isNaN(convId)) { res.status(400).json({ error: 'Invalid conversation id.' }); return; }

  const { reason } = req.body as { reason?: string };
  if (!reason) { res.status(400).json({ error: 'reason required.' }); return; }

  const [conv] = await db
    .select({ id: conversations.id, reportedAt: conversations.reportedAt })
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
  if (conv.reportedAt) { res.json({ ok: true, alreadyReported: true }); return; }

  await db
    .update(conversations)
    .set({
      reportedAt: new Date(),
      reportedBy: sessionUser.id,
      reportReason: String(reason).slice(0, 255),
      reportStatus: 'pending',
    })
    .where(eq(conversations.id, convId));

  res.json({ ok: true });
}
