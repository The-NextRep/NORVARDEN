import type { Request, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { getAuth } from '@/lib/auth/auth';
import { db } from '@/server/db/client';
import { memberProfiles, jobPosts } from '@/server/db/schema';
import { resolveEmployerCompany } from '../_helpers';
import { getCompanyAccess } from '@/server/lib/company-access';
import { activeJobPostCount, jobPostLimit, limitMessage } from '@/server/lib/job-limits';

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

    const postId = parseInt(String(req.params.id), 10);
    if (isNaN(postId)) return res.status(400).json({ error: 'Invalid post ID.' });

    // Confirm ownership
    const [existing] = await db.select({ id: jobPosts.id, status: jobPosts.status }).from(jobPosts).where(and(eq(jobPosts.id, postId), eq(jobPosts.companyId, company.id))).limit(1);
    if (!existing) return res.status(404).json({ error: 'Post not found.' });

    const {
      title, description, location, jobType, industry,
      isRemote, payRangeMin, payRangeMax,
      isVeteranReady, requiredSkills, applicationDeadline, status, accommodations,
    } = req.body as {
      title?: string; description?: string; location?: string | null;
      jobType?: JobType; industry?: string | null; isRemote?: boolean;
      payRangeMin?: number; payRangeMax?: number;
      isVeteranReady?: boolean; requiredSkills?: string[]; accommodations?: string | null;
      applicationDeadline?: string; status?: 'active' | 'paused' | 'closed';
    };

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (location !== undefined) updates.location = location?.trim() || null;
    if (jobType !== undefined && JOB_TYPES.includes(jobType)) updates.jobType = jobType;
    if (industry !== undefined) updates.industry = industry?.trim() || null;
    if (isRemote !== undefined) updates.isRemote = !!isRemote;
    if (payRangeMin !== undefined) updates.payRangeMin = payRangeMin ? Number(payRangeMin) : null;
    if (payRangeMax !== undefined) updates.payRangeMax = payRangeMax ? Number(payRangeMax) : null;
    if (isVeteranReady !== undefined) updates.isVeteranReady = !!isVeteranReady;
    if (accommodations !== undefined) updates.accommodations = typeof accommodations === 'string' && accommodations.trim() ? accommodations.trim().slice(0, 4000) : null;
    if (requiredSkills !== undefined) updates.requiredSkills = Array.isArray(requiredSkills) ? requiredSkills : null;
    if (applicationDeadline !== undefined) updates.applicationDeadline = applicationDeadline ? new Date(applicationDeadline) : null;
    if (status !== undefined && ['active', 'paused', 'closed'].includes(status)) updates.status = status;

    // Re-activating a paused/closed post counts against the plan's limit.
    if (updates.status === 'active' && existing.status !== 'active') {
      const limit = jobPostLimit(await getCompanyAccess(company));
      if (limit !== null && (await activeJobPostCount(company.id)) >= limit) {
        return res.status(403).json({ error: limit === 0 ? 'An active plan is required to post jobs.' : limitMessage(limit), code: 'post_limit', limit });
      }
    }

    if (Object.keys(updates).length > 0) {
      await db.update(jobPosts).set(updates).where(eq(jobPosts.id, postId));
    }

    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
