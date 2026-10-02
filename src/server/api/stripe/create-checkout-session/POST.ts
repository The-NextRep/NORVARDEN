/**
 * POST /api/stripe/create-checkout-session
 *
 * Body: { plan: 'scout' | 'partner', cycle: 'quarterly' | 'annual', couponCode?: string }
 *
 * Everything that affects price is decided server-side: the Stripe price ID,
 * whether FOUNDING10 is valid, and whether the company's mission discount applies.
 * Stripe Checkout accepts one discount: a valid FOUNDING10 wins, otherwise MISSION30
 * if an admin has unlocked it for the company.
 */
import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { and, desc, eq, isNotNull } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { companySubscriptions } from '@/server/db/schema';
import { getCompanyAccess } from '@/server/lib/company-access';
import { appBaseUrl, rateLimit } from '@/server/lib/security';
import {
  FOUNDING_COUPON_ID,
  MISSION_COUPON_ID,
  getStripeOrNull,
  isBillingCycle,
  isPaidPlan,
  priceIdFor,
} from '@/server/lib/plans';
import { requireEmployer } from '../_shared';

async function retrieveCoupon(stripe: Stripe, id: string): Promise<Stripe.Coupon | null> {
  try {
    return await stripe.coupons.retrieve(id);
  } catch (err) {
    if (err instanceof Stripe.errors.StripeError && err.code === 'resource_missing') return null;
    throw err;
  }
}

/** Returns null when a FOUNDING10 coupon with the wrong terms already exists in Stripe. */
async function ensureFoundingCoupon(stripe: Stripe): Promise<Stripe.Coupon | null> {
  const existing = await retrieveCoupon(stripe, FOUNDING_COUPON_ID);
  if (existing) {
    if (existing.percent_off !== 50 || existing.duration !== 'repeating' || existing.max_redemptions !== 10) {
      console.warn(
        `[stripe] Coupon ${FOUNDING_COUPON_ID} exists with unexpected terms ` +
          `(percent_off=${existing.percent_off}, duration=${existing.duration}, max_redemptions=${existing.max_redemptions}). ` +
          'Delete it in the Stripe dashboard so it can be recreated as 50% off for 12 months, max 10 redemptions.',
      );
      return null;
    }
    return existing;
  }
  return stripe.coupons.create({
    id: FOUNDING_COUPON_ID,
    percent_off: 50,
    duration: 'repeating',
    duration_in_months: 12,
    max_redemptions: 10,
    name: 'Founding Partner – 50% off first year',
  });
}

async function ensureMissionCoupon(stripe: Stripe): Promise<Stripe.Coupon> {
  const existing = await retrieveCoupon(stripe, MISSION_COUPON_ID);
  if (existing) return existing;
  return stripe.coupons.create({
    id: MISSION_COUPON_ID,
    percent_off: 30,
    duration: 'forever',
    name: 'Mission discount – 30% off',
  });
}

export default async function handler(req: Request, res: Response) {
  const stripe = getStripeOrNull();
  if (!stripe) {
    res.status(500).json({ error: 'Payments are not configured yet.' });
    return;
  }

  const ctx = await requireEmployer(req, res);
  if (!ctx) return;
  const { user, company } = ctx;

  if (!rateLimit(`checkout:${user.id}`, 10, 10 * 60 * 1000)) {
    res.status(429).json({ error: 'Too many checkout attempts. Please wait a few minutes and try again.' });
    return;
  }

  const body = (req.body ?? {}) as { plan?: unknown; cycle?: unknown; couponCode?: unknown };
  if (!isPaidPlan(body.plan) || !isBillingCycle(body.cycle)) {
    res.status(400).json({ error: 'Choose a plan (Scout or Partner) and a billing length (3 or 12 months).' });
    return;
  }
  const plan = body.plan;
  const cycle = body.cycle;
  const enteredCode =
    typeof body.couponCode === 'string' ? body.couponCode.trim().toUpperCase().slice(0, 64) : '';

  try {
    const access = await getCompanyAccess(company);
    if (access.active) {
      res.status(409).json({
        error: 'Your company already has an active plan. Manage it from your account page.',
        code: 'already_active',
      });
      return;
    }

    let discount: { coupon: string } | null = null;
    let appliedCode = '';

    if (enteredCode) {
      if (enteredCode !== FOUNDING_COUPON_ID) {
        res.status(400).json({ error: 'Invalid code', code: 'invalid_code' });
        return;
      }
      const coupon = await ensureFoundingCoupon(stripe);
      if (!coupon) {
        res.status(503).json({
          error: 'This code is temporarily unavailable. Please contact info@norvarden.com.',
          code: 'code_misconfigured',
        });
        return;
      }
      if (!coupon.valid) {
        res.status(400).json({ error: 'This code is no longer available.', code: 'code_unavailable' });
        return;
      }
      discount = { coupon: coupon.id };
      appliedCode = coupon.id;
    } else if (company.missionDiscountUnlocked) {
      const coupon = await ensureMissionCoupon(stripe);
      if (coupon.valid) {
        discount = { coupon: coupon.id };
        appliedCode = coupon.id;
      }
    }

    // Reuse the company's existing Stripe customer (e.g. a lapsed plan) so billing history stays together.
    const [prior] = await db
      .select({ customerId: companySubscriptions.stripeCustomerId })
      .from(companySubscriptions)
      .where(and(eq(companySubscriptions.companyId, company.id), isNotNull(companySubscriptions.stripeCustomerId)))
      .orderBy(desc(companySubscriptions.updatedAt))
      .limit(1);

    const metadata: Record<string, string> = {
      companyId: String(company.id),
      plan,
      cycle,
      userId: user.id,
      couponCode: appliedCode,
    };

    const base = appBaseUrl(req);
    const params: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      line_items: [{ price: priceIdFor(plan, cycle), quantity: 1 }],
      success_url: `${base}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/pricing`,
      client_reference_id: String(company.id),
      metadata,
      subscription_data: { metadata },
    };
    if (prior?.customerId) params.customer = prior.customerId;
    else params.customer_email = user.email;
    if (discount) params.discounts = [discount];

    const session = await stripe.checkout.sessions.create(params);
    res.json({ url: session.url, sessionId: session.id, discountApplied: appliedCode || null });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ error: 'Could not start checkout. Please try again.' });
  }
}
