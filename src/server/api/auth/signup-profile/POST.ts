import type { Request, Response } from 'express';
import { db } from '@/server/db/client';
import { eq } from 'drizzle-orm';
import { memberProfiles, user } from '@/server/db/schema';
import { getAuth } from '@/lib/auth/auth';

export default async function handler(req: Request, res: Response) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: req.headers as unknown as Headers });
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const {
      memberType, firstName, lastName, city, state, linkedinUrl, bio,
      sport, league, yearsActive,
      coachingLevel, coachingSport, yearsCoaching,
      branch, mos, yearsServed, isSkillbridgeEligible,
      companyName, companyRole,
    } = req.body;

    if (!memberType || !['athlete', 'coach', 'veteran', 'employer'].includes(memberType)) {
      return res.status(400).json({ error: 'Invalid member type' });
    }
    if (!firstName?.trim() || !lastName?.trim()) {
      return res.status(400).json({ error: 'First and last name are required' });
    }

    await db.insert(memberProfiles).values({
      userId: session.user.id,
      memberType,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      city: city?.trim() || null,
      state: state?.trim() || null,
      linkedinUrl: linkedinUrl?.trim() || null,
      bio: bio?.trim() || null,
      sport: sport?.trim() || null,
      league: league?.trim() || null,
      yearsActive: yearsActive?.trim() || null,
      coachingLevel: coachingLevel || null,
      coachingSport: coachingSport?.trim() || null,
      yearsCoaching: yearsCoaching?.trim() || null,
      branch: branch || null,
      mos: mos?.trim() || null,
      yearsServed: yearsServed?.trim() || null,
      isSkillbridgeEligible: isSkillbridgeEligible === true,
      companyName: companyName?.trim() || null,
      companyRole: companyRole?.trim() || null,
      verificationStatus: 'pending',
    });

    // Signup creates the account with an empty name; fill it in so emails
    // and the admin console can greet people by name.
    await db.update(user)
      .set({ name: `${firstName.trim()} ${lastName.trim()}` })
      .where(eq(user.id, session.user.id));

    return res.status(201).json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('Duplicate entry')) {
      return res.status(409).json({ error: 'Profile already exists for this account' });
    }
    console.error('[signup-profile]', err);
    return res.status(500).json({ error: 'Failed to save profile' });
  }
}
