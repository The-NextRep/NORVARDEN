/**
 * Events — public list plus admin create/update/delete.
 *
 *   GET    /api/events              published events: { upcoming, past }
 *   GET    /api/admin/events        every event, newest start first
 *   POST   /api/admin/events        create
 *   PUT    /api/admin/events/:id    update
 *   DELETE /api/admin/events/:id    delete
 */
import type { Request, Response } from 'express';
import { and, asc, desc, eq, gte, inArray, isNull, lt, or, sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { events, memberProfiles, messageNotificationPrefs, user as userTable, verifiedCompanies } from '@/server/db/schema';
import { logAdminAction } from '@/server/lib/admin-log';
import { getStripeOrNull } from '@/server/lib/plans';
import { sendEventDecision, sendFeaturedEventEmail } from '@/server/lib/mailer';
import { parseIdParam } from '../admin/_shared/params';

const FORMATS = ['in_person', 'virtual', 'hybrid'] as const;
type EventFormat = (typeof FORMATS)[number];

const PUBLIC_FIELDS = {
  id: events.id,
  title: events.title,
  description: events.description,
  startsAt: events.startsAt,
  endsAt: events.endsAt,
  format: events.format,
  location: events.location,
  registrationUrl: events.registrationUrl,
  hostName: events.hostName,
  tier: events.tier,
};

// An event counts as upcoming until it ends (or until it starts, if no end time).
const endOf = sql`COALESCE(${events.endsAt}, ${events.startsAt})`;
const isLive = and(eq(events.published, true), eq(events.status, 'approved'));

export async function listPublicEvents(_req: Request, res: Response) {
  try {
    const now = new Date();
    const [upcoming, past] = await Promise.all([
      db.select(PUBLIC_FIELDS).from(events)
        .where(and(isLive, gte(endOf, now)))
        .orderBy(asc(events.startsAt))
        .limit(50),
      db.select(PUBLIC_FIELDS).from(events)
        .where(and(isLive, lt(endOf, now)))
        .orderBy(desc(events.startsAt))
        .limit(12),
    ]);
    res.set('Cache-Control', 'no-cache').json({ upcoming, past });
  } catch (err) {
    console.error('[events] list failed', err);
    res.status(500).json({ error: 'Could not load events.' });
  }
}

export async function listAdminEvents(_req: Request, res: Response) {
  const rows = await db
    .select({ ev: events, companyName: verifiedCompanies.legalName, submitterEmail: userTable.email })
    .from(events)
    .leftJoin(verifiedCompanies, eq(verifiedCompanies.id, events.hostCompanyId))
    .leftJoin(userTable, eq(userTable.id, events.submittedByUserId))
    .orderBy(desc(events.startsAt))
    .limit(500);
  res.json({
    events: rows.map(({ ev, companyName, submitterEmail }) => ({
      ...ev,
      stripeCheckoutSessionId: undefined,
      stripePaymentIntentId: undefined,
      companyName,
      submitterEmail,
    })),
  });
}

async function submitterOf(ev: { submittedByUserId: string | null }) {
  if (!ev.submittedByUserId) return null;
  const [u] = await db.select({ email: userTable.email, name: userTable.name }).from(userTable)
    .where(eq(userTable.id, ev.submittedByUserId)).limit(1);
  return u ?? null;
}

export async function approveEvent(req: Request, res: Response) {
  const id = parseIdParam(req);
  if (!id) { res.status(400).json({ error: 'Invalid event id.' }); return; }
  const [ev] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!ev) { res.status(404).json({ error: 'Event not found.' }); return; }
  if (ev.status !== 'pending_review') { res.status(409).json({ error: 'Only events awaiting review can be approved.' }); return; }
  await db.update(events).set({ status: 'approved', published: true, reviewNote: null }).where(eq(events.id, id));
  await logAdminAction(res, 'event.approve', 'event', id, ev.title);
  const to = await submitterOf(ev);
  if (to?.email) void sendEventDecision(to.email, to.name ?? '', ev.title, true).catch((e) => console.error('[events] approve email failed', e));
  res.json({ ok: true });
}

export async function rejectEvent(req: Request, res: Response) {
  const id = parseIdParam(req);
  if (!id) { res.status(400).json({ error: 'Invalid event id.' }); return; }
  const reason = cleanText((req.body as { reason?: unknown } | undefined)?.reason, 1000);
  if (!reason) { res.status(400).json({ error: 'Please give a reason. It is sent to the company.' }); return; }
  const [ev] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!ev) { res.status(404).json({ error: 'Event not found.' }); return; }
  if (ev.status !== 'pending_review' && ev.status !== 'pending_payment') {
    res.status(409).json({ error: 'Only events awaiting review can be rejected.' });
    return;
  }

  let refundedCents: number | null = null;
  if (ev.paymentStatus === 'paid' && ev.stripePaymentIntentId) {
    const stripe = getStripeOrNull();
    if (!stripe) { res.status(503).json({ error: 'Stripe is not configured, so the refund can’t be issued.' }); return; }
    try {
      await stripe.refunds.create({ payment_intent: ev.stripePaymentIntentId, metadata: { eventId: String(id) } });
      refundedCents = ev.amountCents ?? null;
    } catch (err) {
      console.error('[events] refund failed', err);
      res.status(502).json({ error: 'The refund failed in Stripe, so the event was not rejected. Try again or refund it in Stripe first.' });
      return;
    }
  }

  await db.update(events).set({
    status: 'rejected',
    reviewNote: reason,
    ...(refundedCents !== null ? { paymentStatus: 'refunded' as const } : {}),
  }).where(eq(events.id, id));
  await logAdminAction(res, 'event.reject', 'event', id, `${ev.title}: ${reason}${refundedCents ? ' (refunded)' : ''}`);
  const to = await submitterOf(ev);
  if (to?.email) void sendEventDecision(to.email, to.name ?? '', ev.title, false, { reason, refundedCents }).catch((e) => console.error('[events] reject email failed', e));
  res.json({ ok: true, refunded: refundedCents !== null });
}

const AUDIENCES = ['all', 'athlete', 'coach', 'veteran'] as const;
const FORMAT_TEXT = { in_person: 'In person', virtual: 'Virtual', hybrid: 'In person + virtual' } as const;

/** One-time announcement of a featured event to members who allow event emails. */
export async function sendFeaturedEmail(req: Request, res: Response) {
  const id = parseIdParam(req);
  if (!id) { res.status(400).json({ error: 'Invalid event id.' }); return; }
  const body = (req.body ?? {}) as { audience?: unknown; state?: unknown };
  const audience = (AUDIENCES as readonly string[]).includes(String(body.audience)) ? String(body.audience) : 'all';
  const state = cleanText(body.state, 100);

  const [ev] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!ev) { res.status(404).json({ error: 'Event not found.' }); return; }
  if (ev.status !== 'approved' || !ev.published) { res.status(409).json({ error: 'Approve and publish the event first.' }); return; }
  if (ev.featuredEmailSentAt) { res.status(409).json({ error: 'The featured email for this event was already sent.' }); return; }

  const types = audience === 'all' ? (['athlete', 'coach', 'veteran'] as const) : ([audience] as ('athlete' | 'coach' | 'veteran')[]);
  const recipients = await db
    .select({ email: userTable.email, name: userTable.name, firstName: memberProfiles.firstName })
    .from(memberProfiles)
    .innerJoin(userTable, eq(userTable.id, memberProfiles.userId))
    .leftJoin(messageNotificationPrefs, eq(messageNotificationPrefs.userId, memberProfiles.userId))
    .where(and(
      inArray(memberProfiles.memberType, [...types]),
      sql`COALESCE(${userTable.suspended}, false) = false`,
      or(isNull(messageNotificationPrefs.eventEmailsEnabled), eq(messageNotificationPrefs.eventEmailsEnabled, true)),
      ...(state ? [eq(memberProfiles.state, state)] : []),
    ));

  await db.update(events).set({ featuredEmailSentAt: new Date() }).where(eq(events.id, id));
  await logAdminAction(res, 'event.featured_email', 'event', id, `${ev.title} → ${recipients.length} members (${audience}${state ? `, ${state}` : ''})`);

  const when = new Date(ev.startsAt).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago', timeZoneName: 'short',
  });
  const where = `${FORMAT_TEXT[ev.format]}${ev.location ? ` · ${ev.location}` : ''}`;
  // Send in the background, ~2 per second to stay inside the email provider's rate limit.
  void (async () => {
    for (const r of recipients) {
      try {
        await sendFeaturedEventEmail(r.email, r.firstName ?? r.name ?? '', {
          title: ev.title, when, where, hostName: ev.hostName, description: ev.description, registrationUrl: ev.registrationUrl,
        });
      } catch (err) {
        console.error('[events] featured email failed for a recipient', err);
      }
      await new Promise((resolve) => setTimeout(resolve, 550));
    }
  })();

  res.json({ ok: true, recipients: recipients.length });
}

export type EventInput = {
  title: string;
  description: string | null;
  startsAt: Date;
  endsAt: Date | null;
  format: EventFormat;
  location: string | null;
  registrationUrl: string | null;
  hostName: string | null;
  published: boolean;
};

function parseDate(v: unknown): Date | null {
  if (typeof v !== 'string' || v.length > 40) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function cleanText(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
}

/** Validates the request body; returns the clean values or an error message. */
export function parseEventBody(body: Record<string, unknown>): EventInput | string {
  const title = cleanText(body['title'], 200);
  if (!title) return 'Title is required.';

  const startsAt = parseDate(body['startsAt']);
  if (!startsAt) return 'Start date and time are required.';

  let endsAt: Date | null = null;
  if (body['endsAt']) {
    endsAt = parseDate(body['endsAt']);
    if (!endsAt) return 'End date and time are not valid.';
    if (endsAt < startsAt) return 'The event can’t end before it starts.';
  }

  const format = (FORMATS as readonly string[]).includes(String(body['format'])) ? (body['format'] as EventFormat) : 'in_person';

  let registrationUrl = cleanText(body['registrationUrl'], 512);
  if (registrationUrl) {
    if (!/^https?:\/\//i.test(registrationUrl)) registrationUrl = `https://${registrationUrl}`;
    try { new URL(registrationUrl); } catch { return 'Registration link is not a valid web address.'; }
  }

  return {
    title,
    description: cleanText(body['description'], 5000),
    startsAt,
    endsAt,
    format,
    location: cleanText(body['location'], 255),
    registrationUrl,
    hostName: cleanText(body['hostName'], 200),
    published: body['published'] !== false,
  };
}

export async function createEvent(req: Request, res: Response) {
  const parsed = parseEventBody((req.body ?? {}) as Record<string, unknown>);
  if (typeof parsed === 'string') { res.status(400).json({ error: parsed }); return; }
  const [inserted] = await db.insert(events).values(parsed).$returningId();
  await logAdminAction(res, 'event.create', 'event', inserted.id, parsed.title);
  res.status(201).json({ id: inserted.id });
}

export async function updateEvent(req: Request, res: Response) {
  const id = parseIdParam(req);
  if (!id) { res.status(400).json({ error: 'Invalid event id.' }); return; }
  const parsed = parseEventBody((req.body ?? {}) as Record<string, unknown>);
  if (typeof parsed === 'string') { res.status(400).json({ error: parsed }); return; }
  const [existing] = await db.select({ id: events.id }).from(events).where(eq(events.id, id)).limit(1);
  if (!existing) { res.status(404).json({ error: 'Event not found.' }); return; }
  await db.update(events).set(parsed).where(eq(events.id, id));
  await logAdminAction(res, 'event.update', 'event', id, parsed.title);
  res.json({ ok: true });
}

export async function deleteEvent(req: Request, res: Response) {
  const id = parseIdParam(req);
  if (!id) { res.status(400).json({ error: 'Invalid event id.' }); return; }
  const [existing] = await db.select({ title: events.title }).from(events).where(eq(events.id, id)).limit(1);
  if (!existing) { res.status(404).json({ error: 'Event not found.' }); return; }
  await db.delete(events).where(eq(events.id, id));
  await logAdminAction(res, 'event.delete', 'event', id, existing.title);
  res.json({ ok: true });
}
