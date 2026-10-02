/**
 * PUT /api/settings/message-notifications
 * Body: { emailEnabled?: boolean, eventEmailsEnabled?: boolean }
 * Updates the current user's message notification email preference.
 */
import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../../db/client.js';
import { messageNotificationPrefs } from '../../../db/schema.js';
import { getSessionUser } from '../../../middleware/auth-guards.js';

export default async function handler(req: Request, res: Response) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) { res.status(401).json({ error: 'Authentication required.' }); return; }

  const { emailEnabled, eventEmailsEnabled } = req.body as { emailEnabled?: unknown; eventEmailsEnabled?: unknown };
  const patch: { emailEnabled?: boolean; eventEmailsEnabled?: boolean } = {};
  if (typeof emailEnabled === 'boolean') patch.emailEnabled = emailEnabled;
  if (typeof eventEmailsEnabled === 'boolean') patch.eventEmailsEnabled = eventEmailsEnabled;
  if (Object.keys(patch).length === 0) {
    res.status(400).json({ error: 'emailEnabled or eventEmailsEnabled must be a boolean.' });
    return;
  }

  const [existing] = await db
    .select({ id: messageNotificationPrefs.id })
    .from(messageNotificationPrefs)
    .where(eq(messageNotificationPrefs.userId, sessionUser.id))
    .limit(1);

  if (existing) {
    await db
      .update(messageNotificationPrefs)
      .set(patch)
      .where(eq(messageNotificationPrefs.userId, sessionUser.id));
  } else {
    await db.insert(messageNotificationPrefs).values({ userId: sessionUser.id, ...patch });
  }

  res.json({ ok: true, ...patch });
}
