/**
 * GET /api/admin/members?q=&type=all|athlete|coach|veteran|employer&status=all|active|suspended&page=1
 * All accounts (50 per page), newest first. Admins can see email addresses.
 */
import type { Request, Response } from 'express';
import { and, count, desc, eq, isNull, like, or, type SQL } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { memberProfiles, user } from '@/server/db/schema';
import { escapeLike, parseIntQuery, parseStringQuery } from '../_shared/params';

const PAGE_SIZE = 50;
const TYPES = ['athlete', 'coach', 'veteran', 'employer'] as const;
type MemberType = typeof TYPES[number];

export default async function handler(req: Request, res: Response) {
  try {
    const q = parseStringQuery(req.query['q']);
    const typeRaw = parseStringQuery(req.query['type']);
    const type = (TYPES as readonly string[]).includes(typeRaw) ? (typeRaw as MemberType) : null;
    const statusRaw = parseStringQuery(req.query['status']);
    const status = statusRaw === 'active' || statusRaw === 'suspended' ? statusRaw : 'all';
    const page = parseIntQuery(req.query['page'], 1, 1, 100000);

    const conditions: SQL[] = [];
    if (q) {
      const pattern = `%${escapeLike(q)}%`;
      conditions.push(or(
        like(user.name, pattern),
        like(user.email, pattern),
        like(memberProfiles.firstName, pattern),
        like(memberProfiles.lastName, pattern),
        like(memberProfiles.companyName, pattern),
      ) as SQL);
    }
    if (type) conditions.push(eq(memberProfiles.memberType, type));
    if (status === 'suspended') conditions.push(eq(user.suspended, true));
    if (status === 'active') conditions.push(or(isNull(user.suspended), eq(user.suspended, false)) as SQL);
    const where = conditions.length ? and(...conditions) : undefined;

    const [[totalRow], rows] = await Promise.all([
      db.select({ n: count() })
        .from(user)
        .leftJoin(memberProfiles, eq(memberProfiles.userId, user.id))
        .where(where),
      db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          isAdmin: user.isAdmin,
          suspended: user.suspended,
          suspendedAt: user.suspendedAt,
          createdAt: user.createdAt,
          memberType: memberProfiles.memberType,
          firstName: memberProfiles.firstName,
          lastName: memberProfiles.lastName,
          headline: memberProfiles.headline,
          city: memberProfiles.city,
          state: memberProfiles.state,
          companyName: memberProfiles.companyName,
          verificationStatus: memberProfiles.verificationStatus,
        })
        .from(user)
        .leftJoin(memberProfiles, eq(memberProfiles.userId, user.id))
        .where(where)
        .orderBy(desc(user.createdAt), desc(user.id))
        .limit(PAGE_SIZE)
        .offset((page - 1) * PAGE_SIZE),
    ]);

    res.json({ members: rows, total: Number(totalRow?.n ?? 0), page, pageSize: PAGE_SIZE });
  } catch (err) {
    console.error('[admin/members] failed', err);
    res.status(500).json({ error: 'Failed to load members.' });
  }
}
