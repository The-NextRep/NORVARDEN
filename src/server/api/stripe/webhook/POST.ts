/**
 * POST /api/stripe/webhook
 *
 * Must be mounted with express.raw({ type: 'application/json' }) so req.body is the
 * raw Buffer Stripe signed. Unverified events are never accepted.
 *
 * Persists subscription state into company_subscriptions (keyed by stripeSubscriptionId).
 */
import type { Request, Response } from 'express';
import type Stripe from 'stripe';
import { getSecret } from '#airo/secrets';
import { getStripeOrNull } from '@/server/lib/plans';
import { invoiceSubscriptionId, upsertSubscription } from '../_shared';
import { markEventPaid } from '../../company/events/handlers';

async function syncById(stripe: Stripe, subscriptionId: string, fallbackCompanyId?: string | null) {
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const ok = await upsertSubscription(sub, fallbackCompanyId);
  if (!ok) console.warn(`[stripe webhook] Subscription ${subscriptionId} has no companyId; not stored.`);
}

export default async function handler(req: Request, res: Response) {
  const stripe = getStripeOrNull();
  const webhookSecret = getSecret('STRIPE_WEBHOOK_SECRET');

  if (!stripe) {
    console.error('[stripe webhook] STRIPE_SECRET_KEY is not configured.');
    res.status(500).json({ error: 'Stripe not configured' });
    return;
  }
  if (!webhookSecret || typeof webhookSecret !== 'string') {
    console.error('[stripe webhook] STRIPE_WEBHOOK_SECRET is not configured; refusing unverified event.');
    res.status(500).json({ error: 'Webhook not configured' });
    return;
  }

  const sig = req.headers['stripe-signature'];
  if (!sig || Array.isArray(sig)) {
    res.status(400).json({ error: 'Missing stripe-signature header' });
    return;
  }
  if (!Buffer.isBuffer(req.body) && typeof req.body !== 'string') {
    console.error('[stripe webhook] Body was already parsed; mount express.raw() for this route.');
    res.status(400).json({ error: 'Invalid payload' });
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer | string, sig, webhookSecret);
  } catch (err) {
    console.error('[stripe webhook] Signature verification failed:', err instanceof Error ? err.message : err);
    res.status(400).json({ error: 'Invalid signature' });
    return;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'payment' && session.metadata?.['kind'] === 'event_fee') {
          await markEventPaid(session);
          break;
        }
        if (session.mode !== 'subscription' || !session.subscription) break;
        const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
        await syncById(stripe, subId, session.metadata?.['companyId'] || session.client_reference_id);
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        // Re-fetch so out-of-order deliveries still store the latest state.
        await syncById(stripe, sub.id);
        break;
      }
      case 'invoice.paid':
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = invoiceSubscriptionId(invoice);
        if (subId) await syncById(stripe, subId);
        if (event.type === 'invoice.payment_failed') {
          console.warn(`[stripe webhook] Payment failed for subscription ${subId ?? '(none)'} (invoice ${invoice.id})`);
        }
        break;
      }
      default:
        break;
    }
    res.json({ received: true });
  } catch (err) {
    // 500 so Stripe retries the delivery.
    console.error(`[stripe webhook] Failed to process ${event.type} (${event.id}):`, err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}
