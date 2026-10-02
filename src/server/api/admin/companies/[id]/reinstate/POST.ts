/**
 * POST /api/admin/companies/:id/reinstate
 * Lifts a company suspension (blocked=false, blockedAt=null).
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

  try {
    const [company] = await db
      .select({ id: verifiedCompanies.id, legalName: verifiedCompanies.legalName, blocked: verifiedCompanies.blocked })
      .from(verifiedCompanies)
      .where(eq(verifiedCompanies.id, id))
      .limit(1);
    if (!company) { res.status(404).json({ error: 'Company not found.' }); return; }
    if (!company.blocked) { res.json({ ok: true, alreadyActive: true }); return; }

    await db.update(verifiedCompanies).set({ blocked: false, blockedAt: null }).where(eq(verifiedCompanies.id, id));
    await logAdminAction(res, 'company_reinstate', 'company', id, company.legalName);

    res.json({ ok: true, blocked: false });
  } catch (err) {
    console.error('[admin/companies/reinstate] failed', err);
    res.status(500).json({ error: 'Failed to reinstate company.' });
  }
}
