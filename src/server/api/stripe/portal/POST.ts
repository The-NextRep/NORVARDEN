/**
 * POST /api/stripe/portal
 *
 * Opens a Stripe Billing Portal session for the signed-in company's Stripe customer.
 * Returns { url }.
 */
import type { Request, Response } from 'express';
import { and, desc, eq, isNotNull } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { companySubscriptions } from '@/server/db/schema';
import { appBaseUrl, rateLimit } from '@/server/lib/security';
import { getStripeOrNull } from '@/server/lib/plans';
import { requireEmployer } from '../_shared';

export default async function handler(req: Request, res: Response) {
  const stripe = getStripeOrNull();
  if (!stripe) {
    res.status(500).json({ error: 'Payments are not configured yet.' });
    return;
  }

  const ctx = await requireEmployer(req, res);
  if (!ctx) return;

  if (!rateLimit(`portal:${ctx.user.id}`, 10, 10 * 60 * 1000)) {
    res.status(429).json({ error: 'Too many attempts. Please wait a few minutes and try again.' });
    return;
  }

  try {
    const [row] = await db
      .select({ customerId: companySubscriptions.stripeCustomerId })
      .from(companySubscriptions)
      .where(and(eq(companySubscriptions.companyId, ctx.company.id), isNotNull(companySubscriptions.stripeCustomerId)))
      .orderBy(desc(companySubscriptions.updatedAt))
      .limit(1);

    if (!row?.customerId) {
      res.status(404).json({ error: 'No billing account found for your company yet.' });
      return;
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: row.customerId,
      return_url: `${appBaseUrl(req)}/company/account`,
    });
    res.json({ url: portal.url });
  } catch (err) {
    console.error('Billing portal error:', err);
    res.status(500).json({ error: 'Could not open billing. Please try again.' });
  }
}
