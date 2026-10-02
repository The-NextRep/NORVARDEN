/**
 * GET /api/stripe/session/:sessionId
 *
 * Returns a minimal summary of a checkout session — only if it belongs to the
 * signed-in user's company. Used by /checkout/success.
 */
import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { getStripeOrNull } from '@/server/lib/plans';
import { requireEmployer } from '../../_shared';

export default async function handler(req: Request, res: Response) {
  const raw = req.params['sessionId'];
  const sessionId = Array.isArray(raw) ? raw[0] : raw;
  if (!sessionId || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) {
    res.status(400).json({ success: false, error: 'Invalid session ID.' });
    return;
  }

  const stripe = getStripeOrNull();
  if (!stripe) {
    res.status(500).json({ success: false, error: 'Payments are not configured yet.' });
    return;
  }

  const ctx = await requireEmployer(req, res);
  if (!ctx) return;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.metadata?.['companyId'] !== String(ctx.company.id)) {
      res.status(404).json({ success: false, error: 'Session not found.' });
      return;
    }
    res.json({
      success: true,
      session: {
        plan: session.metadata?.['plan'] ?? null,
        cycle: session.metadata?.['cycle'] ?? null,
        amount_total: session.amount_total,
        currency: session.currency,
        status: session.status,
        payment_status: session.payment_status,
      },
    });
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError && error.code === 'resource_missing') {
      res.status(404).json({ success: false, error: 'Session not found.' });
      return;
    }
    console.error('get-session failed:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve session.' });
  }
}
