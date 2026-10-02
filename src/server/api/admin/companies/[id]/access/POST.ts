/**
 * POST /api/admin/companies/:id/access
 * Body: { manualAccessUntil?: ISO date string | null, missionDiscountUnlocked?: boolean, postsPaused?: boolean }
 * - manualAccessUntil grants paid access outside Stripe (e.g. Founding partners
 *   on invoice). null removes the grant.
 * - missionDiscountUnlocked toggles the 30% mission discount.
 * - postsPaused=false resumes job posts that were auto-paused by member reports
 *   (true pauses them manually).
 * Only the fields present in the body are changed.
 */
import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { verifiedCompanies } from '@/server/db/schema';
import { logAdminAction } from '@/server/lib/admin-log';
import { parseIdParam } from '../../../_shared/params';

const MAX_YEARS_AHEAD = 10;

export default async function handler(req: Request, res: Response) {
  const id = parseIdParam(req);
  if (!id) { res.status(400).json({ error: 'Invalid company id.' }); return; }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const patch: {
    manualAccessUntil?: Date | null;
    missionDiscountUnlocked?: boolean;
    postsPaused?: boolean;
    postsPausedReason?: string | null;
  } = {};

  if ('manualAccessUntil' in body) {
    const v = body['manualAccessUntil'];
    if (v === null || v === '') {
      patch.manualAccessUntil = null;
    } else if (typeof v === 'string' && v.length <= 40) {
      // A bare date (YYYY-MM-DD) means "through the end of that day" (UTC).
      const d = /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(v + 'T23:59:59.000Z') : new Date(v);
      if (isNaN(d.getTime())) { res.status(400).json({ error: 'manualAccessUntil must be an ISO date or null.' }); return; }
      const max = new Date();
      max.setFullYear(max.getFullYear() + MAX_YEARS_AHEAD);
      if (d > max) { res.status(400).json({ error: `manualAccessUntil cannot be more than ${MAX_YEARS_AHEAD} years ahead.` }); return; }
      patch.manualAccessUntil = d;
    } else {
      res.status(400).json({ error: 'manualAccessUntil must be an ISO date or null.' }); return;
    }
  }

  if ('missionDiscountUnlocked' in body) {
    if (typeof body['missionDiscountUnlocked'] !== 'boolean') {
      res.status(400).json({ error: 'missionDiscountUnlocked must be a boolean.' }); return;
    }
    patch.missionDiscountUnlocked = body['missionDiscountUnlocked'];
  }

  if ('postsPaused' in body) {
    if (typeof body['postsPaused'] !== 'boolean') {
      res.status(400).json({ error: 'postsPaused must be a boolean.' }); return;
    }
    patch.postsPaused = body['postsPaused'];
    patch.postsPausedReason = body['postsPaused'] ? 'Paused by admin' : null;
  }

  if (Object.keys(patch).length === 0) {
    res.status(400).json({ error: 'Nothing to update.' }); return;
  }

  try {
    const [company] = await db
      .select({
        id: verifiedCompanies.id,
        legalName: verifiedCompanies.legalName,
        manualAccessUntil: verifiedCompanies.manualAccessUntil,
        missionDiscountUnlocked: verifiedCompanies.missionDiscountUnlocked,
        postsPaused: verifiedCompanies.postsPaused,
      })
      .from(verifiedCompanies)
      .where(eq(verifiedCompanies.id, id))
      .limit(1);
    if (!company) { res.status(404).json({ error: 'Company not found.' }); return; }

    await db.update(verifiedCompanies).set(patch).where(eq(verifiedCompanies.id, id));

    const changes: string[] = [];
    if ('manualAccessUntil' in patch) {
      changes.push(`manual access: ${company.manualAccessUntil?.toISOString() ?? 'none'} → ${patch.manualAccessUntil?.toISOString() ?? 'none'}`);
    }
    if ('missionDiscountUnlocked' in patch) {
      changes.push(`mission discount: ${!!company.missionDiscountUnlocked} → ${patch.missionDiscountUnlocked}`);
    }
    if ('postsPaused' in patch) {
      changes.push(`posts paused: ${!!company.postsPaused} → ${patch.postsPaused}`);
    }
    await logAdminAction(res, 'company_access_update', 'company', id, `${company.legalName} — ${changes.join('; ')}`);

    res.json({
      ok: true,
      manualAccessUntil: 'manualAccessUntil' in patch ? patch.manualAccessUntil : company.manualAccessUntil,
      missionDiscountUnlocked: 'missionDiscountUnlocked' in patch ? patch.missionDiscountUnlocked : !!company.missionDiscountUnlocked,
      postsPaused: 'postsPaused' in patch ? patch.postsPaused : !!company.postsPaused,
    });
  } catch (err) {
    console.error('[admin/companies/access] failed', err);
    res.status(500).json({ error: 'Failed to update access.' });
  }
}
