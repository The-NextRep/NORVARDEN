/**
 * Saved jobs — members bookmark roles to come back to.
 *
 *   GET    /api/saved-jobs           list (newest first), with job + company details
 *   GET    /api/saved-jobs/ids       just the saved job IDs (for bookmark icons)
 *   POST   /api/saved-jobs/:jobId    save (idempotent)
 *   DELETE /api/saved-jobs/:jobId    unsave (idempotent)
 *
 * Jobs that were closed or whose company was paused/suspended stay in the list
 * but are flagged `available: false` so the member understands why.
 */
import type { Request, Response } from 'express';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { jobPosts, savedJobs, verifiedCompanies } from '@/server/db/schema';
import { parseId, requireMember } from '@/server/lib/member';

const MAX_SAVED = 200;

export async function listSavedJobs(_req: Request, res: Response) {
  const user = await requireMember(res);
  if (!user) return;
  try {
    const rows = await db
      .select({
        savedAt: savedJobs.createdAt,
        id: jobPosts.id,
        title: jobPosts.title,
        location: jobPosts.location,
        jobType: jobPosts.jobType,
        industry: jobPosts.industry,
        isRemote: jobPosts.isRemote,
        payRangeMin: jobPosts.payRangeMin,
        payRangeMax: jobPosts.payRangeMax,
        payCurrency: jobPosts.payCurrency,
        isVeteranReady: jobPosts.isVeteranReady,
        applicationDeadline: jobPosts.applicationDeadline,
        postedAt: jobPosts.postedAt,
        status: jobPosts.status,
        companyName: verifiedCompanies.legalName,
        companyBlocked: verifiedCompanies.blocked,
        companyPaused: verifiedCompanies.postsPaused,
      })
      .from(savedJobs)
      .innerJoin(jobPosts, eq(savedJobs.jobId, jobPosts.id))
      .innerJoin(verifiedCompanies, eq(jobPosts.companyId, verifiedCompanies.id))
      .where(eq(savedJobs.userId, user.id))
      .orderBy(desc(savedJobs.createdAt));

    const jobs = rows.map(({ companyBlocked, companyPaused, status, ...j }) => ({
      ...j,
      available: status === 'active' && !companyBlocked && !companyPaused,
    }));
    res.json({ jobs });
  } catch (err) {
    console.error('[saved-jobs] list failed', err);
    res.status(500).json({ error: 'Could not load saved jobs.' });
  }
}

export async function listSavedJobIds(_req: Request, res: Response) {
  const user = await requireMember(res);
  if (!user) return;
  try {
    const rows = await db
      .select({ jobId: savedJobs.jobId })
      .from(savedJobs)
      .where(eq(savedJobs.userId, user.id));
    res.json({ ids: rows.map((r) => r.jobId) });
  } catch (err) {
    console.error('[saved-jobs] ids failed', err);
    res.status(500).json({ error: 'Could not load saved jobs.' });
  }
}

export async function saveJob(req: Request, res: Response) {
  const user = await requireMember(res);
  if (!user) return;
  const jobId = parseId(req);
  if (!jobId) return res.status(400).json({ error: 'Invalid job.' });
  try {
    const [job] = await db
      .select({ id: jobPosts.id, status: jobPosts.status, blocked: verifiedCompanies.blocked, paused: verifiedCompanies.postsPaused })
      .from(jobPosts)
      .innerJoin(verifiedCompanies, eq(jobPosts.companyId, verifiedCompanies.id))
      .where(eq(jobPosts.id, jobId))
      .limit(1);
    if (!job || job.status !== 'active' || job.blocked || job.paused) {
      return res.status(404).json({ error: 'This role is no longer open.' });
    }

    const existing = await db
      .select({ id: savedJobs.id, jobId: savedJobs.jobId })
      .from(savedJobs)
      .where(eq(savedJobs.userId, user.id));
    if (existing.some((s) => s.jobId === jobId)) return res.json({ saved: true });
    if (existing.length >= MAX_SAVED) {
      return res.status(400).json({ error: `You can save up to ${MAX_SAVED} roles. Remove a few first.` });
    }
    await db.insert(savedJobs).values({ userId: user.id, jobId });
    res.json({ saved: true });
  } catch (err) {
    console.error('[saved-jobs] save failed', err);
    res.status(500).json({ error: 'Could not save this role.' });
  }
}

export async function unsaveJob(req: Request, res: Response) {
  const user = await requireMember(res);
  if (!user) return;
  const jobId = parseId(req);
  if (!jobId) return res.status(400).json({ error: 'Invalid job.' });
  try {
    await db.delete(savedJobs).where(and(eq(savedJobs.userId, user.id), eq(savedJobs.jobId, jobId)));
    res.json({ saved: false });
  } catch (err) {
    console.error('[saved-jobs] unsave failed', err);
    res.status(500).json({ error: 'Could not update saved roles.' });
  }
}
