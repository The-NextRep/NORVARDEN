/**
 * POST /api/stripe/switch-to-yearly
 *
 * Moves the signed-in company's own live 3-month subscription to the same plan's
 * 12-month price. Unused time is prorated. No body needed.
 */
import type { Request, Response } from 'express';
import { getCompanyAccess } from '@/server/lib/company-access';
import { rateLimit } from '@/server/lib/security';
import { getStripeOrNull, isPaidPlan, planForPriceId, priceIdFor } from '@/server/lib/plans';
import { requireEmployer, subscriptionPeriodEnd, upsertSubscription } from '../_shared';

export default async function handler(req: Request, res: Response) {
  const stripe = getStripeOrNull();
  if (!stripe) {
    res.status(500).json({ error: 'Payments are not configured yet.' });
    return;
  }

  const ctx = await requireEmployer(req, res);
  if (!ctx) return;
  const { user, company } = ctx;

  if (!rateLimit(`switch-yearly:${user.id}`, 5, 10 * 60 * 1000)) {
    res.status(429).json({ error: 'Too many attempts. Please wait a few minutes and try again.' });
    return;
  }

  try {
    const access = await getCompanyAccess(company);
    if (!access.active || access.source !== 'stripe' || !access.stripeSubscriptionId) {
      res.status(404).json({ error: 'No active subscription found for your company.' });
      return;
    }

    const sub = await stripe.subscriptions.retrieve(access.stripeSubscriptionId);
    if (sub.metadata?.['companyId'] && sub.metadata['companyId'] !== String(company.id)) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    const item = sub.items.data[0];
    if (!item) {
      res.status(400).json({ error: 'No subscription item found.' });
      return;
    }

    const mapped = planForPriceId(item.price.id);
    const isAnnual = mapped ? mapped.cycle === 'annual' : item.price.recurring?.interval === 'year';
    if (isAnnual) {
      res.status(400).json({ error: 'You are already on 12-month billing.' });
      return;
    }

    const plan = mapped?.plan ?? (isPaidPlan(access.plan) ? access.plan : null);
    if (!plan) {
      res.status(400).json({ error: 'This plan cannot be switched online. Contact info@the-nextrep.com.' });
      return;
    }

    const updated = await stripe.subscriptions.update(sub.id, {
      items: [{ id: item.id, price: priceIdFor(plan, 'annual') }],
      proration_behavior: 'create_prorations',
      metadata: { ...(sub.metadata ?? {}), companyId: String(company.id), plan, cycle: 'annual' },
    });

    await upsertSubscription(updated, String(company.id));

    const periodEnd = subscriptionPeriodEnd(updated);
    res.json({
      success: true,
      subscription: {
        plan,
        billingCycle: 'annual',
        status: updated.status,
        currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        cancelAtPeriodEnd: updated.cancel_at_period_end,
      },
    });
  } catch (err) {
    console.error('Switch to yearly error:', err);
    res.status(500).json({ error: 'Could not switch your plan. Please try again or contact support.' });
  }
}
