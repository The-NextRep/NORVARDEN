/**
 * GET /api/connections/pending
 * Returns the authenticated member's incoming pending connection requests.
 * Each item includes: id, requesterId, companyName, note, requestedAt.
 * Auth required. Non-employer members only.
 */
import type { Request, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../../../db/client.js';
import { memberConnections, verifiedCompanies } from '../../../db/schema.js';
import { getSessionUser } from '../../../middleware/auth-guards.js';

export default async function handler(req: Request, res: Response) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) { res.status(401).json({ error: 'Authentication required.' }); return; }

  const rows = await db
    .select({
      id: memberConnections.id,
      requesterId: memberConnections.requesterId,
      note: memberConnections.note,
      requestedAt: memberConnections.requestedAt,
      companyName: verifiedCompanies.legalName,
      companyWebsite: verifiedCompanies.website,
      skillbridgePartner: verifiedCompanies.skillbridgePartner,
    })
    .from(memberConnections)
    .leftJoin(verifiedCompanies, eq(memberConnections.verifiedCompanyId, verifiedCompanies.id))
    .where(
      and(
        eq(memberConnections.recipientId, sessionUser.id),
        eq(memberConnections.status, 'pending')
      )
    )
    .orderBy(memberConnections.requestedAt);

  res.json({ requests: rows });
}
