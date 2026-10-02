/**
 * POST /api/admin/delete-test-data
 * Admin-only. Deletes every account whose email ends in exactly
 * "@theboard.test" and every company application / verified company whose
 * contact email or email domain is theboard.test, with all related rows.
 * IRREVERSIBLE — only exposed in the admin UI behind a double-confirm.
 */
import type { Request, Response } from 'express';
import { logAdminAction } from '@/server/lib/admin-log';
import { purgeAccounts, testDomainMatch } from '@/server/lib/purge-accounts';

export default async function handler(_req: Request, res: Response) {
  try {
    const deleted = await purgeAccounts(testDomainMatch());

    await logAdminAction(
      res,
      'delete_test_data',
      'system',
      undefined,
      Object.entries(deleted).map(([k, v]) => `${k}: ${v}`).join(', '),
    );

    res.json({ ok: true, deleted });
  } catch (err) {
    console.error('[admin/delete-test-data] failed', err);
    res.status(500).json({ ok: false, error: 'Failed to delete test data.' });
  }
}
