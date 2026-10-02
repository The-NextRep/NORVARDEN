/**
 * Shared helpers for the Stripe API handlers (not a route).
 */
import type { Request, Response } from 'express';
import type Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { companySubscriptions } from '@/server/db/schema';
import { getSessionUser, type SessionUser } from '@/server/middleware/auth-guards';
import {
  EMPLOYER_ERRORS,
  resolveEmployerForUser,
  type EmployerCompany,
} from '@/server/lib/company-access';
import {
  planForPriceId,
  isPaidPlan,
  isBillingCycle,
  type BillingCycle,
  type PaidPlan,
} from '@/server/lib/plans';

/**
 * Resolve the signed-in user and their verified company.
 * Sends 401/403 and returns null when either is missing.
 */
export async function requireEmployer(
  req: Request,
  res: Response,
): Promise<{ user: SessionUser; company: EmployerCompany } | null> {
  const user = (res.locals['sessionUser'] as SessionUser | undefined) ?? (await getSessionUser(req));
  if (!user) {
    res.status(401).json({ error: 'Authentication required.' });
    return null;
  }
  const r = await resolveEmployerForUser(user.id);
  if (!r.ok) {
    res.status(403).json({ error: EMPLOYER_ERRORS[r.reason], code: r.reason });
    return null;
  }
  return { user, company: r.company };
}

function idOf(v: string | { id: string } | null | undefined): string | null {
  if (!v) return null;
  return typeof v === 'string' ? v : v.id;
}

/** current_period_end moved from the subscription to its items in newer API versions. */
export function subscriptionPeriodEnd(sub: Stripe.Subscription): number | null {
  const fromItem = sub.items?.data?.[0]?.current_period_end;
  if (typeof fromItem === 'number') return fromItem;
  const legacy = (sub as unknown as Record<string, unknown>)['current_period_end'];
  return typeof legacy === 'number' ? legacy : null;
}

/** Subscription ID an invoice belongs to (handles both the new `parent` shape and the legacy field). */
export function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const fromParent = invoice.parent?.subscription_details?.subscription;
  if (fromParent) return idOf(fromParent);
  const legacy = (invoice as unknown as Record<string, unknown>)['subscription'];
  if (typeof legacy === 'string') return legacy;
  if (legacy && typeof legacy === 'object' && 'id' in legacy) return String((legacy as { id: unknown }).id);
  return null;
}

/**
 * Upsert a Stripe subscription into company_subscriptions (keyed by stripeSubscriptionId).
 * Returns false when the subscription cannot be tied to a company.
 */
export async function upsertSubscription(
  sub: Stripe.Subscription,
  fallbackCompanyId?: string | null,
): Promise<boolean> {
  const meta = sub.metadata ?? {};
  const rawCompanyId = meta['companyId'] || fallbackCompanyId || null;
  let companyId = rawCompanyId ? Number.parseInt(rawCompanyId, 10) : NaN;

  if (!Number.isInteger(companyId) || companyId <= 0) {
    // Maybe we already know this subscription from an earlier event.
    const [existing] = await db
      .select({ companyId: companySubscriptions.companyId })
      .from(companySubscriptions)
      .where(eq(companySubscriptions.stripeSubscriptionId, sub.id))
      .limit(1);
    if (!existing) return false;
    companyId = existing.companyId;
  }

  const item = sub.items?.data?.[0];
  const priceId = item?.price?.id ?? null;
  const mapped = planForPriceId(priceId);
  const metaPlan = meta['plan'];
  const metaCycle = meta['cycle'];
  const plan: PaidPlan | 'unknown' = mapped?.plan ?? (isPaidPlan(metaPlan) ? metaPlan : 'unknown');
  let cycle: BillingCycle | null = mapped?.cycle ?? (isBillingCycle(metaCycle) ? metaCycle : null);
  if (!cycle && item?.price?.recurring) {
    const { interval, interval_count } = item.price.recurring;
    if (interval === 'year') cycle = 'annual';
    else if (interval === 'month' && interval_count === 3) cycle = 'quarterly';
  }

  const periodEnd = subscriptionPeriodEnd(sub);
  const values = {
    companyId,
    stripeCustomerId: idOf(sub.customer),
    stripeSubscriptionId: sub.id,
    priceId,
    plan,
    billingCycle: cycle,
    status: sub.status,
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    cancelAtPeriodEnd: !!sub.cancel_at_period_end,
    couponCode: meta['couponCode'] || null,
  };

  await db
    .insert(companySubscriptions)
    .values(values)
    .onDuplicateKeyUpdate({
      set: {
        companyId: values.companyId,
        stripeCustomerId: values.stripeCustomerId,
        priceId: values.priceId,
        plan: values.plan,
        billingCycle: values.billingCycle,
        status: values.status,
        currentPeriodEnd: values.currentPeriodEnd,
        cancelAtPeriodEnd: values.cancelAtPeriodEnd,
        couponCode: values.couponCode,
      },
    });
  return true;
}
