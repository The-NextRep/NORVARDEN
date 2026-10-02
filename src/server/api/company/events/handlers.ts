/**
 * Company-hosted events.
 *
 *   GET    /api/company/events              { quote, events } for the signed-in company
 *   POST   /api/company/events              submit { ...event fields, tier } → { id, checkoutUrl? }
 *   PUT    /api/company/events/:id          edit while awaiting payment or review
 *   POST   /api/company/events/:id/pay      new Stripe Checkout link for an unpaid event
 *   POST   /api/company/events/:id/confirm  { sessionId } — marks paid after Checkout
 *                                           (the webhook does the same; whichever runs first wins)
 *   DELETE /api/company/events/:id          withdraw an unpaid event
 *
 * Fees come from quoteForCompany(); the client never sends a price.
 * Flow: submitted → (pay if a fee applies) → admin review → live.
 */
import type { Request, Response } from 'express';
import type Stripe from 'stripe';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { events } from '@/server/db/schema';
import { appBaseUrl, rateLimit } from '@/server/lib/security';
import { getStripeOrNull } from '@/server/lib/plans';
import { EVENT_TIERS, quoteForCompany, type EventTier } from '@/server/lib/event-pricing';
import { sendEventSubmittedToAdmin } from '@/server/lib/mailer';
import { requireEmployer } from '../../stripe/_shared';
import { parseIdParam } from '../../admin/_shared/params';
import { parseEventBody } from '../../events/handlers';

const OWN_FIELDS = {
  id: events.id,
  title: events.title,
  description: events.description,
  startsAt: events.startsAt,
  endsAt: events.endsAt,
  format: events.format,
  location: events.location,
  registrationUrl: events.registrationUrl,
  tier: events.tier,
  status: events.status,
  paymentStatus: events.paymentStatus,
  amountCents: events.amountCents,
  reviewNote: events.reviewNote,
  published: events.published,
  createdAt: events.createdAt,
};

async function createCheckout(
  req: Request,
  ev: { id: number; title: string; tier: EventTier; amountCents: number },
  company: { id: number; legalName: string },
  email: string,
): Promise<string | null> {
  const stripe = getStripeOrNull();
  if (!stripe) return null;
  const base = appBaseUrl(req);
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: email,
    client_reference_id: String(company.id),
    line_items: [{
      quantity: 1,
      price_data: {
        currency: 'usd',
        unit_amount: ev.amountCents,
        product_data: {
          name: `REP | IV ${ev.tier === 'featured' ? 'featured' : 'standard'} event listing`,
          description: ev.title.slice(0, 200),
        },
      },
    }],
    metadata: { kind: 'event_fee', eventId: String(ev.id), companyId: String(company.id) },
    payment_intent_data: { metadata: { kind: 'event_fee', eventId: String(ev.id), companyId: String(company.id) } },
    success_url: `${base}/company/events?paid=${ev.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/company/events?canceled=${ev.id}`,
  });
  await db.update(events).set({ stripeCheckoutSessionId: session.id }).where(eq(events.id, ev.id));
  return session.url;
}

/**
 * Move an event from "awaiting payment" to "awaiting review" once Stripe says
 * the session is paid. Safe to call more than once (webhook + return page).
 */
export async function markEventPaid(session: Stripe.Checkout.Session): Promise<boolean> {
  if (session.metadata?.['kind'] !== 'event_fee' || session.payment_status !== 'paid') return false;
  const eventId = Number(session.metadata['eventId']);
  if (!Number.isInteger(eventId) || eventId <= 0) return false;

  const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null;
  const [result] = await db
    .update(events)
    .set({ status: 'pending_review', paymentStatus: 'paid', stripePaymentIntentId: paymentIntentId, stripeCheckoutSessionId: session.id })
    .where(and(eq(events.id, eventId), eq(events.status, 'pending_payment')));
  const changed = (result as { affectedRows?: number }).affectedRows ?? 0;
  if (changed > 0) {
    const [ev] = await db.select({ title: events.title, hostName: events.hostName, tier: events.tier, amountCents: events.amountCents })
      .from(events).where(eq(events.id, eventId)).limit(1);
    if (ev) {
      void sendEventSubmittedToAdmin(ev.title, ev.hostName ?? 'A company', ev.tier, ev.amountCents)
        .catch((err) => console.error('[events] admin notice failed', err));
    }
  }
  return changed > 0;
}

export async function listCompanyEvents(req: Request, res: Response) {
  const ctx = await requireEmployer(req, res);
  if (!ctx) return;
  const [quote, rows] = await Promise.all([
    quoteForCompany(ctx.company),
    db.select(OWN_FIELDS).from(events).where(eq(events.hostCompanyId, ctx.company.id)).orderBy(desc(events.startsAt)).limit(200),
  ]);
  res.json({ quote, events: rows, companyName: ctx.company.legalName });
}

export async function submitCompanyEvent(req: Request, res: Response) {
  const ctx = await requireEmployer(req, res);
  if (!ctx) return;
  const { user, company } = ctx;
  if (!rateLimit(`event-submit:${company.id}`, 10, 60 * 60 * 1000)) {
    res.status(429).json({ error: 'Too many submissions. Please try again later.' });
    return;
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const parsed = parseEventBody(body);
  if (typeof parsed === 'string') { res.status(400).json({ error: parsed }); return; }
  if (parsed.startsAt.getTime() < Date.now() - 60 * 60 * 1000) {
    res.status(400).json({ error: 'Pick a start time in the future.' });
    return;
  }
  const tier: EventTier = (EVENT_TIERS as readonly string[]).includes(String(body['tier'])) ? (body['tier'] as EventTier) : 'standard';

  const quote = await quoteForCompany(company);
  const price = quote[tier];
  const needsPayment = price.amountCents > 0;

  if (needsPayment && !getStripeOrNull()) {
    res.status(503).json({ error: 'Payments are not available right now. Please contact info@the-nextrep.com.' });
    return;
  }

  const [inserted] = await db.insert(events).values({
    ...parsed,
    hostName: company.legalName,
    hostCompanyId: company.id,
    published: true,
    tier,
    coverage: needsPayment ? 'paid' : 'included',
    status: needsPayment ? 'pending_payment' : 'pending_review',
    paymentStatus: needsPayment ? 'unpaid' : 'not_required',
    amountCents: needsPayment ? price.amountCents : 0,
    submittedByUserId: user.id,
  }).$returningId();

  if (!needsPayment) {
    void sendEventSubmittedToAdmin(parsed.title, company.legalName, tier, null)
      .catch((err) => console.error('[events] admin notice failed', err));
    res.status(201).json({ id: inserted.id, status: 'pending_review' });
    return;
  }

  try {
    const checkoutUrl = await createCheckout(req, { id: inserted.id, title: parsed.title, tier, amountCents: price.amountCents }, company, user.email);
    res.status(201).json({ id: inserted.id, status: 'pending_payment', checkoutUrl });
  } catch (err) {
    console.error('[events] checkout failed', err);
    // The event is saved; the company can pay from My events.
    res.status(201).json({ id: inserted.id, status: 'pending_payment', checkoutUrl: null, error: 'Saved, but payment could not start. Use “Pay now” to try again.' });
  }
}

async function ownEvent(companyId: number, id: number) {
  const [ev] = await db.select().from(events).where(and(eq(events.id, id), eq(events.hostCompanyId, companyId))).limit(1);
  return ev ?? null;
}

export async function updateCompanyEvent(req: Request, res: Response) {
  const ctx = await requireEmployer(req, res);
  if (!ctx) return;
  const id = parseIdParam(req);
  if (!id) { res.status(400).json({ error: 'Invalid event id.' }); return; }
  const ev = await ownEvent(ctx.company.id, id);
  if (!ev) { res.status(404).json({ error: 'Event not found.' }); return; }
  if (ev.status !== 'pending_payment' && ev.status !== 'pending_review') {
    res.status(409).json({ error: 'This event has already been reviewed. Email info@the-nextrep.com to change it.' });
    return;
  }
  const parsed = parseEventBody((req.body ?? {}) as Record<string, unknown>);
  if (typeof parsed === 'string') { res.status(400).json({ error: parsed }); return; }
  await db.update(events).set({ ...parsed, hostName: ctx.company.legalName, published: true }).where(eq(events.id, id));
  res.json({ ok: true });
}

export async function payCompanyEvent(req: Request, res: Response) {
  const ctx = await requireEmployer(req, res);
  if (!ctx) return;
  const id = parseIdParam(req);
  if (!id) { res.status(400).json({ error: 'Invalid event id.' }); return; }
  const ev = await ownEvent(ctx.company.id, id);
  if (!ev) { res.status(404).json({ error: 'Event not found.' }); return; }
  if (ev.status !== 'pending_payment' || !ev.amountCents) { res.status(409).json({ error: 'This event doesn’t need payment.' }); return; }
  if (!rateLimit(`event-pay:${ctx.user.id}`, 10, 10 * 60 * 1000)) {
    res.status(429).json({ error: 'Too many attempts. Please wait a few minutes.' });
    return;
  }
  try {
    const url = await createCheckout(req, { id: ev.id, title: ev.title, tier: ev.tier, amountCents: ev.amountCents }, ctx.company, ctx.user.email);
    if (!url) { res.status(503).json({ error: 'Payments are not available right now.' }); return; }
    res.json({ checkoutUrl: url });
  } catch (err) {
    console.error('[events] checkout failed', err);
    res.status(500).json({ error: 'Could not start payment. Please try again.' });
  }
}

export async function confirmCompanyEventPayment(req: Request, res: Response) {
  const ctx = await requireEmployer(req, res);
  if (!ctx) return;
  const id = parseIdParam(req);
  const sessionId = String((req.body as { sessionId?: unknown } | undefined)?.sessionId ?? '');
  if (!id || !/^cs_[A-Za-z0-9_]{10,200}$/.test(sessionId)) { res.status(400).json({ error: 'Invalid request.' }); return; }
  const ev = await ownEvent(ctx.company.id, id);
  if (!ev) { res.status(404).json({ error: 'Event not found.' }); return; }
  if (ev.status !== 'pending_payment') { res.json({ status: ev.status }); return; }

  const stripe = getStripeOrNull();
  if (!stripe) { res.status(503).json({ error: 'Payments are not available right now.' }); return; }
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.metadata?.['eventId'] !== String(id)) { res.status(400).json({ error: 'This payment is for a different event.' }); return; }
    await markEventPaid(session);
    const [now] = await db.select({ status: events.status }).from(events).where(eq(events.id, id)).limit(1);
    res.json({ status: now?.status ?? ev.status });
  } catch (err) {
    console.error('[events] confirm failed', err);
    res.status(500).json({ error: 'Could not confirm payment yet. Refresh in a minute.' });
  }
}

export async function deleteCompanyEvent(req: Request, res: Response) {
  const ctx = await requireEmployer(req, res);
  if (!ctx) return;
  const id = parseIdParam(req);
  if (!id) { res.status(400).json({ error: 'Invalid event id.' }); return; }
  const ev = await ownEvent(ctx.company.id, id);
  if (!ev) { res.status(404).json({ error: 'Event not found.' }); return; }
  if (ev.paymentStatus === 'paid') {
    res.status(409).json({ error: 'This event is paid. Email info@the-nextrep.com to cancel it and arrange a refund.' });
    return;
  }
  if (ev.status === 'approved') {
    res.status(409).json({ error: 'This event is live. Email info@the-nextrep.com to take it down.' });
    return;
  }
  await db.delete(events).where(eq(events.id, id));
  res.json({ ok: true });
}
