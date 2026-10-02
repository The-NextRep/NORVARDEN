import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { jobPosts, verifiedCompanies } from '../../../db/schema.js';
import { eq, and, or, isNull } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const rawId = String(req.params.id ?? '');
    const id = /^\d+$/.test(rawId) ? parseInt(rawId, 10) : NaN;
    if (isNaN(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid job ID' });
      return;
    }

    const rows = await db
      .select({
        id: jobPosts.id,
        title: jobPosts.title,
        description: jobPosts.description,
        location: jobPosts.location,
        jobType: jobPosts.jobType,
        industry: jobPosts.industry,
        isRemote: jobPosts.isRemote,
        payRangeMin: jobPosts.payRangeMin,
        payRangeMax: jobPosts.payRangeMax,
        payCurrency: jobPosts.payCurrency,
        isVeteranReady: jobPosts.isVeteranReady,
        requiredSkills: jobPosts.requiredSkills,
        applicationDeadline: jobPosts.applicationDeadline,
        status: jobPosts.status,
        postedAt: jobPosts.postedAt,
        companyId: verifiedCompanies.id,
        companyName: verifiedCompanies.legalName,
        companyWebsite: verifiedCompanies.website,
        orgType: verifiedCompanies.orgType,
        isStaffingAgency: verifiedCompanies.isStaffingAgency,
        skillbridgePartner: verifiedCompanies.skillbridgePartner,
        inclusionCertifiedAt: verifiedCompanies.inclusionCertifiedAt,
        missionDiscountUnlocked: verifiedCompanies.missionDiscountUnlocked,
      })
      .from(jobPosts)
      .innerJoin(verifiedCompanies, eq(jobPosts.companyId, verifiedCompanies.id))
      .where(
        and(
          eq(jobPosts.id, id),
          eq(jobPosts.status, 'active'),
          // Hide jobs from suspended (blocked) or paused companies
          or(isNull(verifiedCompanies.blocked), eq(verifiedCompanies.blocked, false)),
          or(isNull(verifiedCompanies.postsPaused), eq(verifiedCompanies.postsPaused, false)),
        ),
      )
      .limit(1);

    if (rows.length === 0) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    res.json({ job: rows[0] });
  } catch (err) {
    console.error(`GET /api/jobs/:id error:`, err);
    res.status(500).json({ error: 'Failed to load job' });
  }
}
