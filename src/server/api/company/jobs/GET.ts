import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { getAuth } from '@/lib/auth/auth';
import { db } from '@/server/db/client';
import { memberProfiles, jobPosts } from '@/server/db/schema';
import { resolveEmployerCompany } from './_helpers';
import { getCompanyAccess } from '@/server/lib/company-access';
import { jobPostLimit } from '@/server/lib/job-limits';

export default async function handler(req: Request, res: Response) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: req.headers as unknown as Headers });
    if (!session?.user) return res.status(401).json({ error: 'Unauthorized' });

    const [mp] = await db.select({ memberType: memberProfiles.memberType }).from(memberProfiles).where(eq(memberProfiles.userId, session.user.id)).limit(1);
    if (mp?.memberType !== 'employer') return res.status(403).json({ error: 'Employer account required.' });

    const company = await resolveEmployerCompany(session.user.id);
    if (!company) return res.status(403).json({ error: 'No verified company found.' });

    const posts = await db
      .select()
      .from(jobPosts)
      .where(eq(jobPosts.companyId, company.id))
      .orderBy(jobPosts.postedAt);

    const access = await getCompanyAccess(company);
    const activeCount = posts.filter((p) => p.status === 'active').length;
    return res.json({ posts, limit: jobPostLimit(access), activeCount, plan: access.active ? access.plan : null });
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
