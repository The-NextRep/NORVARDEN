/**
 * Shared access rule for a member's private data (contact info, résumé,
 * extended profile fields).
 *
 * A viewer may see it when they are:
 *   (a) the member themself,
 *   (b) an admin, or
 *   (c) an employer (with a verified, non-suspended company) whose connection
 *       request to this member is 'accepted' AND there is no blocked
 *       conversation between them.
 */
import { and, eq, isNotNull } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { conversations, memberConnections } from '../../db/schema.js';
import { resolveEmployerForUser } from '../../lib/company-access.js';
import type { SessionUser } from '../../middleware/auth-guards.js';

export type ViewerAccess = 'self' | 'admin' | 'connected' | 'restricted';

/** Is there an accepted, unblocked connection from employer → member? */
export async function hasActiveConnection(employerUserId: string, memberUserId: string): Promise<boolean> {
  const [conn] = await db
    .select({ id: memberConnections.id })
    .from(memberConnections)
    .where(
      and(
        eq(memberConnections.requesterId, employerUserId),
        eq(memberConnections.recipientId, memberUserId),
        eq(memberConnections.status, 'accepted'),
      ),
    )
    .limit(1);
  if (!conn) return false;

  const [blocked] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(
      and(
        eq(conversations.companyUserId, employerUserId),
        eq(conversations.memberUserId, memberUserId),
        isNotNull(conversations.blockedAt),
      ),
    )
    .limit(1);
  return !blocked;
}

export async function resolveViewerAccess(
  viewer: SessionUser | null,
  memberUserId: string,
): Promise<ViewerAccess> {
  if (!viewer) return 'restricted';
  if (viewer.id === memberUserId) return 'self';
  if (viewer.isAdmin) return 'admin';

  if (!(await hasActiveConnection(viewer.id, memberUserId))) return 'restricted';
  const employer = await resolveEmployerForUser(viewer.id);
  return employer.ok ? 'connected' : 'restricted';
}
