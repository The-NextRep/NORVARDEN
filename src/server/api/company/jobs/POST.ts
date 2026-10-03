import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { getAuth } from '@/lib/auth/auth';
import { db } from '@/server/db/client';
import { memberProfiles, jobPosts } from '@/server/db/schema';
import { resolveEmployerCompany } from './_helpers';
import { getCompanyAccess } from '@/server/lib/company-access';
import { activeJobPostCount, jobPostLimit, limitMessage, JOB_POST_LIMITS } from '@/server/lib/job-limits';

const JOB_TYPES = ['full_time', 'part_time', 'contract', 'internship', 'skillbridge'] as const;
type JobType = typeof JOB_TYPES[number];

export default async function handler(req: Request, res: Response) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: req.headers as unknown as Headers });
    if (!session?.user) return res.status(401).json({ error: 'Unauthorized' });

    const [mp] = await db.select({ memberType: memberProfiles.memberType }).from(memberProfiles).where(eq(memberProfiles.userId, session.user.id)).limit(1);
    if (mp?.memberType !== 'employer') return res.status(403).json({ error: 'Employer account required.' });

    const company = await resolveEmployerCompany(session.user.id);
    if (!company) return res.status(403).json({ error: 'No verified company found.' });
    if (company.blocked) return res.status(403).json({ error: 'Account is blocked.' });
    if (company.postsPaused) return res.status(403).json({ error: 'Job posts are currently paused.' });
    const access = await getCompanyAccess(company);
    if (!access.active) {
      return res.status(402).json({ error: 'An active plan is required to post jobs.', code: 'plan_required' });
    }
    const limit = jobPostLimit(access);
    if (limit !== null && (await activeJobPostCount(company.id)) >= limit) {
      const message = limit >= JOB_POST_LIMITS.partner
        ? `Your plan includes ${limit} active job posts, and you're at the limit. Pause or close a post to add another.`
        : limitMessage(limit);
      return res.status(403).json({ error: message, code: 'post_limit', limit });
    }

    const {
      title, description, location, jobType, industry,
      isRemote, payRangeMin, payRangeMax,
      isVeteranReady, requiredSkills, applicationDeadline, accommodations,
    } = req.body as {
      title: string; description: string; location?: string;
      jobType: JobType; industry?: string; isRemote?: boolean;
      payRangeMin?: number; payRangeMax?: number;
      isVeteranReady?: boolean; requiredSkills?: string[]; accommodations?: string | null;
      applicationDeadline?: string;
    };

    if (!title?.trim() || title.length > 255) return res.status(400).json({ error: 'Title is required (max 255 characters).' });
    if (!description?.trim() || description.length > 20000) return res.status(400).json({ error: 'Description is required (max 20,000 characters).' });
    if (!JOB_TYPES.includes(jobType)) return res.status(400).json({ error: 'Invalid job type.' });

    const [inserted] = await db.insert(jobPosts).values({
      companyId: company.id,
      title: title.trim(),
      description: description.trim(),
      location: location?.trim() || null,
      jobType,
      industry: industry?.trim() || null,
      isRemote: !!isRemote,
      payRangeMin: payRangeMin ? Number(payRangeMin) : null,
      payRangeMax: payRangeMax ? Number(payRangeMax) : null,
      isVeteranReady: !!isVeteranReady,
      accommodations: typeof accommodations === 'string' && accommodations.trim() ? accommodations.trim().slice(0, 4000) : null,
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : null,
      applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
      status: 'active',
    });

    return res.status(201).json({ id: (inserted as { insertId?: number })?.insertId ?? null });
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
