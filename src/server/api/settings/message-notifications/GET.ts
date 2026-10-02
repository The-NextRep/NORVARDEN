/**
 * GET /api/settings/message-notifications
 * Returns the current user's message notification email preference.
 */
import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../../db/client.js';
import { messageNotificationPrefs } from '../../../db/schema.js';
import { getSessionUser } from '../../../middleware/auth-guards.js';

export default async function handler(req: Request, res: Response) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) { res.status(401).json({ error: 'Authentication required.' }); return; }

  const [pref] = await db
    .select({ emailEnabled: messageNotificationPrefs.emailEnabled, eventEmailsEnabled: messageNotificationPrefs.eventEmailsEnabled })
    .from(messageNotificationPrefs)
    .where(eq(messageNotificationPrefs.userId, sessionUser.id))
    .limit(1);

  res.json({ emailEnabled: pref?.emailEnabled ?? true, eventEmailsEnabled: pref?.eventEmailsEnabled ?? true });
}
