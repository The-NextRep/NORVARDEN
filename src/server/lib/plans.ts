/**
 * Server-side source of truth for NORVARDEN's paid plans and their Stripe prices.
 *
 * The client only ever sends { plan, cycle }; the price ID is resolved here so a
 * caller can never pick an arbitrary Stripe price.
 *
 * Price IDs come from env vars (set them after running
 * src/scripts/stripe-register-products.ts) and fall back to the IDs that were
 * previously hard-coded in the pricing pages.
 */
import Stripe from 'stripe';
import { getSecret } from '#airo/secrets';

export type PaidPlan = 'scout' | 'partner';
export type BillingCycle = 'quarterly' | 'annual';

export const PAID_PLANS: readonly PaidPlan[] = ['scout', 'partner'];
export const BILLING_CYCLES: readonly BillingCycle[] = ['quarterly', 'annual'];

export const PLAN_LABELS: Record<PaidPlan, string> = { scout: 'Scout', partner: 'Partner' };

/** Amounts in cents — used by the product-registration script. */
export const PLAN_AMOUNTS: Record<PaidPlan, Record<BillingCycle, number>> = {
  scout: { quarterly: 180_000, annual: 600_000 },
  partner: { quarterly: 540_000, annual: 1_800_000 },
};

export const PRICE_ENV_VARS: Record<PaidPlan, Record<BillingCycle, string>> = {
  scout: { quarterly: 'STRIPE_PRICE_SCOUT_QUARTERLY', annual: 'STRIPE_PRICE_SCOUT_ANNUAL' },
  partner: { quarterly: 'STRIPE_PRICE_PARTNER_QUARTERLY', annual: 'STRIPE_PRICE_PARTNER_ANNUAL' },
};

const DEFAULT_PRICE_IDS: Record<PaidPlan, Record<BillingCycle, string>> = {
  scout: { quarterly: 'price_1ULY86LWcb1Hq9S06px2sIhd', annual: 'price_1ULY8ALWcb1Hq9S0zL1zLju5' },
  partner: { quarterly: 'price_1ULY8HLWcb1Hq9S0x6YU6trr', annual: 'price_1ULY8MLWcb1Hq9S0EDgvJRzl' },
};

export function isPaidPlan(v: unknown): v is PaidPlan {
  return v === 'scout' || v === 'partner';
}

export function isBillingCycle(v: unknown): v is BillingCycle {
  return v === 'quarterly' || v === 'annual';
}

export function priceIdFor(plan: PaidPlan, cycle: BillingCycle): string {
  const fromEnv = getSecret(PRICE_ENV_VARS[plan][cycle]);
  return typeof fromEnv === 'string' && fromEnv.trim() ? fromEnv.trim() : DEFAULT_PRICE_IDS[plan][cycle];
}

/** Reverse lookup: which plan/cycle does this Stripe price ID belong to? */
export function planForPriceId(priceId: string | null | undefined): { plan: PaidPlan; cycle: BillingCycle } | null {
  if (!priceId) return null;
  for (const plan of PAID_PLANS) {
    for (const cycle of BILLING_CYCLES) {
      if (priceIdFor(plan, cycle) === priceId) return { plan, cycle };
    }
  }
  return null;
}

// ─── Coupons ────────────────────────────────────────────────────────────────
export const FOUNDING_COUPON_ID = 'FOUNDING10';
export const MISSION_COUPON_ID = 'MISSION30';

// ─── Stripe client ──────────────────────────────────────────────────────────
let stripeInstance: Stripe | null = null;

/** Returns a Stripe client, or null when STRIPE_SECRET_KEY is not configured. */
export function getStripeOrNull(): Stripe | null {
  if (stripeInstance) return stripeInstance;
  const key = getSecret('STRIPE_SECRET_KEY');
  if (!key || typeof key !== 'string') return null;
  stripeInstance = new Stripe(key);
  return stripeInstance;
}
