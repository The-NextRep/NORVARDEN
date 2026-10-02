import type { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { jobPosts, verifiedCompanies } from '../../db/schema.js';
import { eq, and, desc, like, or, gte, lte, isNull, SQL } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const {
      search,
      location,
      jobType,
      industry,
      remote,
      veteranReady,
      payMin,
      payMax,
      skills,
    } = req.query as Record<string, string | undefined>;

    // Only live jobs from companies that are neither suspended nor paused.
    const conditions: SQL[] = [
      eq(jobPosts.status, 'active'),
      or(isNull(verifiedCompanies.blocked), eq(verifiedCompanies.blocked, false)) as SQL,
      or(isNull(verifiedCompanies.postsPaused), eq(verifiedCompanies.postsPaused, false)) as SQL,
    ];

    if (search) {
      conditions.push(
        or(
          like(jobPosts.title, `%${search}%`),
          like(jobPosts.description, `%${search}%`)
        ) as SQL
      );
    }
    if (location) {
      conditions.push(like(jobPosts.location, `%${location}%`) as SQL);
    }
    if (jobType && ['full_time', 'part_time', 'contract', 'internship', 'skillbridge'].includes(jobType)) {
      conditions.push(eq(jobPosts.jobType, jobType as 'full_time' | 'part_time' | 'contract' | 'internship' | 'skillbridge'));
    }
    if (industry) {
      conditions.push(like(jobPosts.industry, `%${industry}%`) as SQL);
    }
    if (remote === 'true') {
      conditions.push(eq(jobPosts.isRemote, true));
    }
    if (veteranReady === 'true') {
      conditions.push(eq(jobPosts.isVeteranReady, true));
    }
    if (payMin) {
      const min = parseInt(payMin, 10);
      if (!isNaN(min)) conditions.push(gte(jobPosts.payRangeMax, min) as SQL);
    }
    if (payMax) {
      const max = parseInt(payMax, 10);
      if (!isNaN(max)) conditions.push(lte(jobPosts.payRangeMin, max) as SQL);
    }

    const rows = await db
      .select({
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
        requiredSkills: jobPosts.requiredSkills,
        applicationDeadline: jobPosts.applicationDeadline,
        postedAt: jobPosts.postedAt,
        companyId: verifiedCompanies.id,
        companyName: verifiedCompanies.legalName,
        isStaffingAgency: verifiedCompanies.isStaffingAgency,
        skillbridgePartner: verifiedCompanies.skillbridgePartner,
        inclusionCertifiedAt: verifiedCompanies.inclusionCertifiedAt,
      })
      .from(jobPosts)
      .innerJoin(verifiedCompanies, eq(jobPosts.companyId, verifiedCompanies.id))
      .where(and(...conditions))
      .orderBy(desc(jobPosts.postedAt));

    // Client-side skills filter (JSON column — can't use SQL LIKE on array)
    let result = rows;
    if (skills) {
      const wanted = skills.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
      if (wanted.length > 0) {
        result = rows.filter((r) => {
          const postSkills = (r.requiredSkills ?? []).map((s: string) => s.toLowerCase());
          return wanted.some((w) => postSkills.some((ps: string) => ps.includes(w)));
        });
      }
    }

    res.json({ jobs: result });
  } catch (err) {
    console.error('GET /api/jobs error:', err);
    res.status(500).json({ error: 'Failed to load jobs' });
  }
}
