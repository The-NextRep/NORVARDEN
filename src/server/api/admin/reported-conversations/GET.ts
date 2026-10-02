/**
 * GET /api/admin/reported-conversations
 * Returns conversations that have been reported. Admin only.
 */
import type { Request, Response } from 'express';
import { isNotNull, desc } from 'drizzle-orm';
import { db } from '../../../db/client.js';
import { conversations } from '../../../db/schema.js';

export default async function handler(req: Request, res: Response) {
  const rows = await db
    .select()
    .from(conversations)
    .where(isNotNull(conversations.reportedAt))
    .orderBy(desc(conversations.reportedAt));

  res.json({ conversations: rows });
}
