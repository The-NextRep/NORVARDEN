/**
 * POST /api/admin/reported-conversations/:id/dismiss
 * Admin dismisses a reported conversation.
 */
import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../../../../db/client.js';
import { conversations } from '../../../../../db/schema.js';
import { logAdminAction } from '@/server/lib/admin-log';
import { parseIdParam } from '../../../_shared/params';

export default async function handler(req: Request, res: Response) {
  const id = parseIdParam(req);
  if (!id) { res.status(400).json({ error: 'Invalid id.' }); return; }

  const [conv] = await db
    .select({ id: conversations.id, reportReason: conversations.reportReason })
    .from(conversations)
    .where(eq(conversations.id, id))
    .limit(1);
  if (!conv) { res.status(404).json({ error: 'Conversation not found.' }); return; }

  await db
    .update(conversations)
    .set({ reportStatus: 'dismissed' })
    .where(eq(conversations.id, id));

  await logAdminAction(res, 'conversation_report_dismiss', 'conversation', id, conv.reportReason ?? undefined);

  res.json({ ok: true });
}
