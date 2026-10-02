/**
 * Active job post limits per plan. Paused and closed posts don't count, so a
 * company at its limit can pause or close a post to open a new one.
 * Posts that were already live when a limit was introduced stay live.
 */
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { jobPosts } from '@/server/db/schema';
import type { AccessStatus } from '@/server/lib/company-access';

export const JOB_POST_LIMITS = { scout: 5, partner: 20 } as const;

/** null = unlimited (Founding partners with admin-granted access). */
export function jobPostLimit(access: AccessStatus): number | null {
  if (!access.active) return 0;
  if (access.plan === 'scout') return JOB_POST_LIMITS.scout;
  if (access.plan === 'partner') return JOB_POST_LIMITS.partner;
  return null;
}

export async function activeJobPostCount(companyId: number): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`COUNT(*)` })
    .from(jobPosts)
    .where(and(eq(jobPosts.companyId, companyId), eq(jobPosts.status, 'active')));
  return Number(row?.n ?? 0);
}

export function limitMessage(limit: number): string {
  return `Your plan includes ${limit} active job posts, and you're at the limit. Pause or close a post to add another, or upgrade to Partner for up to ${JOB_POST_LIMITS.partner}.`;
}
