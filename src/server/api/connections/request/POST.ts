/**
 * POST /api/connections/request
 * Body: { recipientId: string; note?: string }
 * Only verified-company employers may send requests.
 * 30-day cooldown after a decline.
 * Note is capped at 300 characters.
 */
import type { Request, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../../../db/client.js';
import {
  memberConnections,
  memberProfiles,
} from '../../../db/schema.js';
import { getSessionUser } from '../../../middleware/auth-guards.js';
import { resolveEmployerForUser, getCompanyAccess, EMPLOYER_ERRORS } from '@/server/lib/company-access';

export default async function handler(req: Request, res: Response) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) { res.status(401).json({ error: 'Authentication required.' }); return; }

  const resolved = await resolveEmployerForUser(sessionUser.id);
  if (!resolved.ok) {
    res.status(403).json({ error: EMPLOYER_ERRORS[resolved.reason], code: resolved.reason });
    return;
  }
  const company = resolved.company;
  const access = await getCompanyAccess(company);
  if (!access.active) {
    res.status(402).json({ error: 'An active plan is required to send connection requests.', code: 'plan_required' });
    return;
  }

  const { recipientId, note } = req.body as { recipientId?: string; note?: string };
  if (!recipientId) { res.status(400).json({ error: 'recipientId required.' }); return; }
  if (recipientId === sessionUser.id) { res.status(400).json({ error: 'Cannot connect with yourself.' }); return; }

  const trimmedNote = note ? note.trim().slice(0, 300) : null;

  // Check for existing connection
  const [existing] = await db
    .select({
      id: memberConnections.id,
      status: memberConnections.status,
      declinedAt: memberConnections.declinedAt,
    })
    .from(memberConnections)
    .where(
      and(
        eq(memberConnections.requesterId, sessionUser.id),
        eq(memberConnections.recipientId, recipientId)
      )
    )
    .limit(1);

  if (existing) {
    if (existing.status === 'accepted') {
      res.status(409).json({ error: 'Already connected.', status: 'accepted' });
      return;
    }
    if (existing.status === 'pending') {
      res.status(409).json({ error: 'Request already pending.', status: 'pending' });
      return;
    }
    if (existing.status === 'declined' && existing.declinedAt) {
      const cooldownMs = 30 * 24 * 60 * 60 * 1000;
      const elapsed = Date.now() - new Date(existing.declinedAt).getTime();
      if (elapsed < cooldownMs) {
        const daysLeft = Math.ceil((cooldownMs - elapsed) / (24 * 60 * 60 * 1000));
        res.status(429).json({ error: `Not available. You may send another request in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.` });
        return;
      }
      // Cooldown expired — delete old record and allow a fresh request
      await db.delete(memberConnections).where(eq(memberConnections.id, existing.id));
    }
  }

  // Verify recipient is a member (not an employer)
  const [recipientProfile] = await db
    .select({ memberType: memberProfiles.memberType })
    .from(memberProfiles)
    .where(eq(memberProfiles.userId, recipientId))
    .limit(1);

  if (!recipientProfile || recipientProfile.memberType === 'employer') {
    res.status(400).json({ error: 'Recipient must be an athlete, coach, or veteran.' });
    return;
  }

  await db.insert(memberConnections).values({
    requesterId: sessionUser.id,
    verifiedCompanyId: company.id,
    recipientId,
    note: trimmedNote,
    status: 'pending',
  });

  res.status(201).json({ ok: true, status: 'pending' });
}
