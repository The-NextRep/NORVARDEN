/**
 * GET /api/profile/:userId
 *
 * Access tiers:
 *   - Self (own profile)     → full profile, all fields
 *   - Admin                  → full profile, all fields
 *   - Connected employer     → full profile (connection accepted)
 *   - Unconnected employer   → restricted: name, badge, headline, location, path only
 *   - Unauthenticated / other member → same restricted view
 *
 * Veterans: branch + years only returned when member opted in via
 * veteranShowBranch / veteranShowYears flags.
 *
 * Contact info (`contact: { email, phone }`) and `canDownloadResume: true` are
 * returned ONLY to self, admins, and employers with an accepted, unblocked
 * connection (see ../contact-access.ts). Suspended users 404 (except to admins).
 */
import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../../db/client.js';
import { memberProfiles, user as userTable } from '../../../db/schema.js';
import { getSessionUser } from '../../../middleware/auth-guards.js';
import { resolveViewerAccess } from '../contact-access.js';

export default async function handler(req: Request, res: Response) {
  const userId = String(req.params['userId'] ?? '');
  if (!userId) { res.status(400).json({ error: 'userId required' }); return; }

  // Resolve session (may be null for unauthenticated)
  const sessionUser = await getSessionUser(req);

  // Fetch the profile
  const [profile] = await db
    .select()
    .from(memberProfiles)
    .where(eq(memberProfiles.userId, userId))
    .limit(1);

  if (!profile) { res.status(404).json({ error: 'Profile not found' }); return; }

  // Fetch the user record (name, email, suspension state)
  const [userRow] = await db
    .select({ name: userTable.name, email: userTable.email, suspended: userTable.suspended })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);

  const isAdmin = sessionUser?.isAdmin ?? false;
  if (!userRow || (userRow.suspended && !isAdmin)) {
    res.status(404).json({ error: 'Profile not found' });
    return;
  }

  // ── Determine access tier ────────────────────────────────────────────────
  const accessTier = await resolveViewerAccess(sessionUser, userId);
  const fullAccess = accessTier !== 'restricted';
  const ownerView = accessTier === 'self' || accessTier === 'admin';

  // ── Build response ────────────────────────────────────────────────────────
  const base = {
    userId,
    memberType:         profile.memberType,
    firstName:          profile.firstName,
    lastName:           profile.lastName,
    headline:           profile.headline,
    city:               profile.city,
    state:              profile.state,
    verificationStatus: profile.verificationStatus,
    photoUrl:           profile.photoUrl,
    // Veteran badge fields — only expose details if opted in
    // (the member and admins always see the stored values, so editing a
    // profile with the toggles off doesn't wipe them)
    branch: (profile.memberType === 'veteran' && (profile.veteranShowBranch || ownerView))
      ? profile.branch : null,
    yearsServed: (profile.memberType === 'veteran' && (profile.veteranShowYears || ownerView))
      ? profile.yearsServed : null,
    // Always expose these for the badge
    veteranShowBranch: profile.veteranShowBranch,
    veteranShowYears:  profile.veteranShowYears,
  };

  if (!fullAccess) {
    // Restricted view — no contact, no resume, no detailed fields
    return res.json({
      ...base,
      accessTier: 'restricted' as const,
    });
  }

  // Full view
  return res.json({
    ...base,
    accessTier,
    // Shared extended fields
    openTo:               profile.openTo,
    industriesOfInterest: profile.industriesOfInterest,
    skills:               profile.skills,
    experienceSummary:    profile.experienceSummary,
    // Private unless the member chose to share it
    workPreferences:      (ownerView || profile.shareWorkPreferences) ? profile.workPreferences : null,
    shareWorkPreferences: ownerView ? !!profile.shareWorkPreferences : undefined,
    // resumeUrl in the DB is an internal storage key — expose the download route instead
    resumeUrl:            profile.resumeFileName ? `/api/profile/${encodeURIComponent(userId)}/resume` : null,
    resumeFileName:       profile.resumeFileName,
    canDownloadResume:    !!profile.resumeFileName,
    contact: {
      email: userRow.email,
      phone: profile.phone ?? null,
    },
    linkedinUrl:          profile.linkedinUrl,
    bio:                  profile.bio,
    // Type-specific
    sport:          profile.sport,
    league:         profile.league,
    yearsActive:    profile.yearsActive,
    coachingLevel:  profile.coachingLevel,
    coachingSport:  profile.coachingSport,
    yearsCoaching:  profile.yearsCoaching,
    mos:            profile.mos,
    isSkillbridgeEligible: profile.isSkillbridgeEligible,
    // Veteran detail (only if opted in — already set in base, repeated for clarity)
    name: userRow.name ?? null,
  });
}
