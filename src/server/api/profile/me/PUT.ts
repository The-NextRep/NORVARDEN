/**
 * PUT /api/profile/me
 * Authenticated member updates their own profile.
 * Only the fields listed in ALLOWED_FIELDS can be written.
 * `phone` is optional (digits, spaces, + - ( ) only, max 30 chars; empty → null)
 * and is only ever shown to a company after the member accepts its request.
 */
import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../../db/client.js';
import { memberProfiles } from '../../../db/schema.js';
import { getSessionUser } from '../../../middleware/auth-guards.js';

const ALLOWED_FIELDS = new Set([
  'firstName', 'lastName', 'headline', 'city', 'state',
  'linkedinUrl', 'bio', 'phone',
  'openTo', 'industriesOfInterest', 'skills', 'experienceSummary',
  // Athlete
  'sport', 'league', 'yearsActive',
  // Coach
  'coachingLevel', 'coachingSport', 'yearsCoaching',
  // Veteran
  'branch', 'mos', 'yearsServed', 'isSkillbridgeEligible',
  'veteranShowBranch', 'veteranShowYears',
  // Employer
  'companyName', 'companyRole',
]);

export default async function handler(req: Request, res: Response) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) { res.status(401).json({ error: 'Authentication required.' }); return; }

  const body = req.body as Record<string, unknown>;

  // Strip any fields not in the allowlist
  const update: Record<string, unknown> = {};
  for (const key of Object.keys(body)) {
    if (ALLOWED_FIELDS.has(key)) update[key] = body[key];
  }

  if ('phone' in update) {
    const raw = update['phone'];
    if (raw === null || raw === undefined) {
      update['phone'] = null;
    } else if (typeof raw !== 'string') {
      res.status(400).json({ error: 'Phone must be text.' });
      return;
    } else {
      const phone = raw.trim().replace(/\s+/g, ' ');
      if (!phone) {
        update['phone'] = null;
      } else if (phone.length > 30 || !/^[0-9 +\-()]+$/.test(phone) || !/[0-9]/.test(phone)) {
        res.status(400).json({ error: 'Phone can only contain digits, spaces, and + - ( ), up to 30 characters.' });
        return;
      } else {
        update['phone'] = phone;
      }
    }
  }

  if (Object.keys(update).length === 0) {
    res.status(400).json({ error: 'No valid fields to update.' });
    return;
  }

  // Upsert — profile may not exist yet if signup-profile POST failed
  const existing = await db
    .select({ id: memberProfiles.id })
    .from(memberProfiles)
    .where(eq(memberProfiles.userId, sessionUser.id))
    .limit(1);

  if (existing.length === 0) {
    res.status(404).json({ error: 'Profile not found. Complete sign-up first.' });
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db
    .update(memberProfiles)
    .set(update as any)
    .where(eq(memberProfiles.userId, sessionUser.id));

  res.json({ ok: true });
}
