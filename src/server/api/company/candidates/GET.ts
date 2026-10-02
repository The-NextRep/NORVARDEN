/**
 * GET /api/company/candidates?q=&type=&state=&page=
 *
 * Candidate search for approved employers. Returns the same restricted fields
 * as the public profile view (no contact details, no résumé) plus this
 * company's connection status with each member.
 */
import type { Request, Response } from 'express';
import { and, desc, eq, inArray, like, ne, or, sql } from 'drizzle-orm';
import { db } from '../../../db/client.js';
import { memberConnections, memberProfiles, user as userTable } from '../../../db/schema.js';
import { getSessionUser } from '../../../middleware/auth-guards.js';
import { resolveEmployerForUser, EMPLOYER_ERRORS } from '@/server/lib/company-access';

const PAGE_SIZE = 24;
const TYPES = ['athlete', 'coach', 'veteran'] as const;
type CandidateType = (typeof TYPES)[number];

export default async function handler(req: Request, res: Response) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) { res.status(401).json({ error: 'Authentication required.' }); return; }

  if (!sessionUser.isAdmin) {
    const resolved = await resolveEmployerForUser(sessionUser.id);
    if (!resolved.ok) {
      res.status(403).json({ error: EMPLOYER_ERRORS[resolved.reason], code: resolved.reason });
      return;
    }
  }

  const q = String(req.query['q'] ?? '').trim().slice(0, 100);
  const typeParam = String(req.query['type'] ?? '');
  const state = String(req.query['state'] ?? '').trim().slice(0, 100);
  const page = Math.max(1, Math.min(500, parseInt(String(req.query['page'] ?? '1'), 10) || 1));

  const types: CandidateType[] = (TYPES as readonly string[]).includes(typeParam)
    ? [typeParam as CandidateType]
    : [...TYPES];

  const conditions = [
    inArray(memberProfiles.memberType, types),
    sql`COALESCE(${userTable.suspended}, false) = false`,
    ne(memberProfiles.verificationStatus, 'rejected'),
  ];
  if (state) conditions.push(eq(memberProfiles.state, state));
  if (q) {
    const pattern = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    conditions.push(or(
      like(memberProfiles.firstName, pattern),
      like(memberProfiles.lastName, pattern),
      like(memberProfiles.headline, pattern),
      like(memberProfiles.city, pattern),
      like(memberProfiles.sport, pattern),
      like(memberProfiles.coachingSport, pattern),
      like(memberProfiles.mos, pattern),
      sql`CAST(${memberProfiles.skills} AS CHAR) LIKE ${pattern}`,
    )!);
  }
  const where = and(...conditions);

  const rows = await db
    .select({
      userId: memberProfiles.userId,
      memberType: memberProfiles.memberType,
      firstName: memberProfiles.firstName,
      lastName: memberProfiles.lastName,
      headline: memberProfiles.headline,
      city: memberProfiles.city,
      state: memberProfiles.state,
      photoUrl: memberProfiles.photoUrl,
      verificationStatus: memberProfiles.verificationStatus,
    })
    .from(memberProfiles)
    .innerJoin(userTable, eq(userTable.id, memberProfiles.userId))
    .where(where)
    .orderBy(desc(sql`${memberProfiles.verificationStatus} = 'verified'`), desc(memberProfiles.updatedAt))
    .limit(PAGE_SIZE + 1)
    .offset((page - 1) * PAGE_SIZE);

  const hasMore = rows.length > PAGE_SIZE;
  const list = rows.slice(0, PAGE_SIZE);

  // This company's latest connection with each listed member.
  const statusById = new Map<string, 'pending' | 'accepted' | 'unavailable'>();
  if (list.length > 0) {
    const conns = await db
      .select({ recipientId: memberConnections.recipientId, status: memberConnections.status })
      .from(memberConnections)
      .where(and(
        eq(memberConnections.requesterId, sessionUser.id),
        inArray(memberConnections.recipientId, list.map((r) => r.userId)),
      ))
      .orderBy(memberConnections.id);
    for (const c of conns) {
      statusById.set(c.recipientId, c.status === 'pending' ? 'pending' : c.status === 'accepted' ? 'accepted' : 'unavailable');
    }
  }

  res.json({
    candidates: list.map((r) => ({
      ...r,
      connection: statusById.get(r.userId) ?? 'none',
    })),
    page,
    hasMore,
  });
}
