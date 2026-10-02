import type { Request, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { getAuth } from '@/lib/auth/auth';
import { db } from '@/server/db/client';
import { memberProfiles, jobPosts } from '@/server/db/schema';
import { resolveEmployerCompany } from '../_helpers';

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

    // Confirm ownership, then soft-delete by setting status to 'removed'
    const [existing] = await db.select({ id: jobPosts.id }).from(jobPosts).where(and(eq(jobPosts.id, postId), eq(jobPosts.companyId, company.id))).limit(1);
    if (!existing) return res.status(404).json({ error: 'Post not found.' });

    await db.update(jobPosts).set({ status: 'removed' }).where(eq(jobPosts.id, postId));

    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
