/**
 * POST /api/admin/companies/:id/suspend
 * Suspends a verified company: sets blocked/blockedAt. Public job listings,
 * messaging and connection requests all check `blocked`.
 * Body: { reason?: string } (recorded in the activity log only)
 */
import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { verifiedCompanies } from '@/server/db/schema';
import { logAdminAction } from '@/server/lib/admin-log';
import { parseIdParam } from '../../../_shared/params';

export default async function handler(req: Request, res: Response) {
  const id = parseIdParam(req);
  if (!id) { res.status(400).json({ error: 'Invalid company id.' }); return; }

  const body = (req.body ?? {}) as { reason?: unknown };
  const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 500) : '';

  try {
    const [company] = await db
      .select({ id: verifiedCompanies.id, legalName: verifiedCompanies.legalName, blocked: verifiedCompanies.blocked })
      .from(verifiedCompanies)
      .where(eq(verifiedCompanies.id, id))
      .limit(1);
    if (!company) { res.status(404).json({ error: 'Company not found.' }); return; }
    if (company.blocked) { res.json({ ok: true, alreadySuspended: true }); return; }

    const blockedAt = new Date();
    await db.update(verifiedCompanies).set({ blocked: true, blockedAt }).where(eq(verifiedCompanies.id, id));
    await logAdminAction(res, 'company_suspend', 'company', id, `${company.legalName}${reason ? ' — ' + reason : ''}`);

    res.json({ ok: true, blocked: true, blockedAt });
  } catch (err) {
    console.error('[admin/companies/suspend] failed', err);
    res.status(500).json({ error: 'Failed to suspend company.' });
  }
}
