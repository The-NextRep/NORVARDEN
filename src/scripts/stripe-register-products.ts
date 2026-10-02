#!/usr/bin/env npx tsx
/**
 * Registers REP | IV's plans in Stripe and prints the env vars to set.
 *
 *   npx tsx src/scripts/stripe-register-products.ts
 *
 * Creates (or reuses, by lookup_key) one product per paid plan with two recurring prices:
 *   - 3 months:  interval 'month', interval_count 3
 *   - 12 months: interval 'year',  interval_count 1
 * Safe to re-run: existing prices with the same lookup_key and matching terms are reused.
 * Founding is "Contact us" and has no Stripe price.
 */
import Stripe from 'stripe';
import { getSecret } from '#airo/secrets';
import {
  BILLING_CYCLES,
  PAID_PLANS,
  PLAN_AMOUNTS,
  PLAN_LABELS,
  PRICE_ENV_VARS,
  type BillingCycle,
  type PaidPlan,
} from '../server/lib/plans';

const RECURRING: Record<BillingCycle, { interval: 'month' | 'year'; interval_count: number }> = {
  quarterly: { interval: 'month', interval_count: 3 },
  annual: { interval: 'year', interval_count: 1 },
};

function lookupKey(plan: PaidPlan, cycle: BillingCycle) {
  return `the_board_${plan}_${cycle}`;
}

function matches(price: Stripe.Price, plan: PaidPlan, cycle: BillingCycle) {
  const r = RECURRING[cycle];
  return (
    price.active &&
    price.currency === 'usd' &&
    price.unit_amount === PLAN_AMOUNTS[plan][cycle] &&
    price.recurring?.interval === r.interval &&
    price.recurring?.interval_count === r.interval_count
  );
}

async function main() {
  const secretKey = getSecret('STRIPE_SECRET_KEY');
  if (!secretKey || typeof secretKey !== 'string') {
    console.error('STRIPE_SECRET_KEY is not set.');
    process.exit(1);
  }
  const stripe = new Stripe(secretKey);
  const envLines: string[] = [];

  for (const plan of PAID_PLANS) {
    const keys = BILLING_CYCLES.map((c) => lookupKey(plan, c));
    const existing = await stripe.prices.list({ lookup_keys: keys, active: true, limit: 10 });

    let productId: string | null = null;
    for (const p of existing.data) {
      productId = typeof p.product === 'string' ? p.product : p.product.id;
      break;
    }
    if (!productId) {
      const product = await stripe.products.create({
        name: `REP | IV — ${PLAN_LABELS[plan]}`,
        description: `${PLAN_LABELS[plan]} plan for verified companies on REP | IV by The NextRep.`,
      });
      productId = product.id;
      console.error(`Created product ${product.id} (${PLAN_LABELS[plan]})`);
    }

    for (const cycle of BILLING_CYCLES) {
      const key = lookupKey(plan, cycle);
      const found = existing.data.find((p) => p.lookup_key === key);
      let priceId: string;
      if (found && matches(found, plan, cycle)) {
        priceId = found.id;
        console.error(`Reusing ${key}: ${priceId}`);
      } else {
        const price = await stripe.prices.create({
          product: productId,
          currency: 'usd',
          unit_amount: PLAN_AMOUNTS[plan][cycle],
          recurring: RECURRING[cycle],
          lookup_key: key,
          transfer_lookup_key: true,
          nickname: `${PLAN_LABELS[plan]} — ${cycle === 'annual' ? '12 months' : '3 months'}`,
        });
        priceId = price.id;
        console.error(`Created ${key}: ${priceId}`);
      }
      envLines.push(`${PRICE_ENV_VARS[plan][cycle]}=${priceId}`);
    }
  }

  console.log('\n# Add these to your environment:');
  for (const line of envLines) console.log(line);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
