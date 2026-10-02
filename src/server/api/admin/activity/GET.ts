/**
 * GET /api/admin/activity?page=1&pageSize=50
 * Admin activity log, newest first.
 */
import type { Request, Response } from 'express';
import { count, desc } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { adminActivityLog } from '@/server/db/schema';
import { parseIntQuery } from '../_shared/params';

export default async function handler(req: Request, res: Response) {
  try {
    const page = parseIntQuery(req.query['page'], 1, 1, 100000);
    const pageSize = parseIntQuery(req.query['pageSize'], 50, 1, 200);

    const [[totalRow], entries] = await Promise.all([
      db.select({ n: count() }).from(adminActivityLog),
      db.select()
        .from(adminActivityLog)
        .orderBy(desc(adminActivityLog.createdAt), desc(adminActivityLog.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
    ]);

    res.json({ entries, total: Number(totalRow?.n ?? 0), page, pageSize });
  } catch (err) {
    console.error('[admin/activity] failed', err);
    res.status(500).json({ error: 'Failed to load activity.' });
  }
}
