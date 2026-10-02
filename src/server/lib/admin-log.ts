/**
 * Records admin actions in admin_activity_log. Never throws.
 */
import type { Response } from 'express';
import { db } from '@/server/db/client';
import { adminActivityLog } from '@/server/db/schema';
import type { SessionUser } from '@/server/middleware/auth-guards';

export async function logAdminAction(
  res: Response,
  action: string,
  targetType?: string,
  targetId?: string | number,
  details?: string,
): Promise<void> {
  const admin = res.locals['sessionUser'] as SessionUser | undefined;
  try {
    await db.insert(adminActivityLog).values({
      adminUserId: admin?.id ?? null,
      adminEmail: admin?.email ?? null,
      action,
      targetType: targetType ?? null,
      targetId: targetId !== undefined ? String(targetId) : null,
      details: details ? details.slice(0, 2000) : null,
    });
  } catch (err) {
    console.error('[admin-log] failed to record', action, err);
  }
}
