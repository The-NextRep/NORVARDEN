/**
 * Browser-side helpers for company billing (pricing pages, account page).
 */
import { useCallback, useEffect, useState } from 'react';

export type BillingCycle = 'quarterly' | 'annual';
export type PaidPlan = 'scout' | 'partner';
export type Verification = 'approved' | 'not_approved' | 'email_unverified' | 'suspended' | 'not_employer';

export interface CompanyAccess {
  active: boolean;
  source: 'stripe' | 'manual' | null;
  plan: string | null;
  billingCycle: string | null;
  status: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId: string | null;
}

export interface CompanyBillingStatus {
  signedIn: boolean;
  isEmployer: boolean;
  verification: Verification;
  company: { id: number; legalName: string; missionDiscountUnlocked: boolean } | null;
  access: CompanyAccess | null;
}

const SIGNED_OUT: CompanyBillingStatus = {
  signedIn: false,
  isEmployer: false,
  verification: 'not_employer',
  company: null,
  access: null,
};

export async function fetchCompanyBilling(): Promise<CompanyBillingStatus> {
  const res = await fetch('/api/company/subscription', { credentials: 'include' });
  if (res.status === 401) return SIGNED_OUT;
  if (!res.ok) throw new Error('Could not load billing status.');
  return (await res.json()) as CompanyBillingStatus;
}

/** Loads billing status on mount. `status` is null while loading or on error. */
export function useCompanyBilling() {
  const [status, setStatus] = useState<CompanyBillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStatus(await fetchCompanyBilling());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load billing status.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { status, loading, error, reload };
}

export const VERIFICATION_MESSAGES: Record<Exclude<Verification, 'approved'>, string> = {
  not_employer: 'Only company accounts can subscribe. Sign in with your company account.',
  not_approved: 'Your company must be verified before you can subscribe.',
  email_unverified: 'Please sign out and sign in again to confirm your email address, then come back to subscribe.',
  suspended: 'Your company account has been suspended. Contact info@norvarden.com.',
};

export type SubscribeOutcome =
  | { kind: 'redirect'; url: string }
  | { kind: 'navigate'; to: string }
  | { kind: 'message'; message: string };

/**
 * Decide what pressing a plan's "Get started" button should do, and start
 * Stripe Checkout when the company is eligible.
 */
export async function subscribe(
  plan: PaidPlan,
  cycle: BillingCycle,
  couponCode: string,
  returnPath: string,
): Promise<SubscribeOutcome> {
  let status: CompanyBillingStatus;
  try {
    status = await fetchCompanyBilling();
  } catch {
    return { kind: 'message', message: 'Something went wrong. Please try again.' };
  }

  if (!status.signedIn) return { kind: 'navigate', to: `/login?next=${encodeURIComponent(returnPath)}` };
  if (status.verification === 'not_approved') return { kind: 'navigate', to: '/verify-company' };
  if (status.verification !== 'approved') return { kind: 'message', message: VERIFICATION_MESSAGES[status.verification] };
  if (status.access?.active) return { kind: 'navigate', to: '/company/account' };

  const res = await fetch('/api/stripe/create-checkout-session', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan, cycle, couponCode: couponCode.trim() || undefined }),
  });
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string; code?: string };
  if (res.ok && data.url) return { kind: 'redirect', url: data.url };
  if (res.status === 401) return { kind: 'navigate', to: `/login?next=${encodeURIComponent(returnPath)}` };
  if (data.code === 'not_approved') return { kind: 'navigate', to: '/verify-company' };
  if (data.code === 'already_active') return { kind: 'navigate', to: '/company/account' };
  return { kind: 'message', message: data.error ?? 'Something went wrong. Please try again.' };
}

/** Discount copy shown on the pricing pages — discounts never stack. */
export const DISCOUNT_NOTE =
  'Schools, nonprofits, and military-affiliated organizations can be approved for a 30% mission discount. ' +
  'The first 10 companies can use code FOUNDING10 for 50% off their first year. ' +
  'One discount per subscription — discounts do not combine.';

export const MISSION_APPLIED_NOTE =
  'Mission discount applied at checkout (30% off). A valid FOUNDING10 code replaces it — discounts do not combine.';
