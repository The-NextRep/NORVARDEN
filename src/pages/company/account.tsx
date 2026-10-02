/**
 * /company/account — the signed-in company's plan and billing.
 * Data: GET /api/company/subscription. Actions: switch to yearly, open Stripe billing portal.
 */
import { useState } from 'react';
import { Link } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { company_account } from 'virtual:content';
import { AlertCircle, CheckCircle, CreditCard, RefreshCw } from 'lucide-react';
import { AuthGuard } from '@/components/auth/RouteGuards';
import { VERIFICATION_MESSAGES, useCompanyBilling } from '@/lib/stripe/billing';

// ── Design tokens (match /company/dashboard) ─────────────────────────────────
const navy    = 'hsl(var(--hero-navy))';
const navyMid = 'hsl(var(--hero-navy-mid))';
const gold    = 'hsl(var(--hero-gold))';
const white   = 'hsl(var(--hero-white))';
const ice60   = 'hsl(var(--hero-ice-60))';
const cardBorder = '1px solid hsl(var(--hero-gold) / 0.18)';

const PLAN_NAMES: Record<string, string> = { scout: 'Scout', partner: 'Partner', founding: 'Founding' };
const PLAN_PRICES: Record<string, { quarterly: string; annual: string }> = {
  scout: { quarterly: '$1,800 / 3 months', annual: '$6,000 / year' },
  partner: { quarterly: '$5,400 / 3 months', annual: '$18,000 / year' },
};
const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  trialing: 'Active',
  past_due: 'Payment due',
  unpaid: 'Unpaid',
  canceled: 'Canceled',
  incomplete: 'Incomplete',
  incomplete_expired: 'Expired',
  paused: 'Paused',
};

const labelStyle = { fontSize: '10px', fontWeight: 500, letterSpacing: '0.28em', color: ice60 } as const;
const bodyStyle = { fontSize: '14px', fontWeight: 300, lineHeight: 1.6, color: ice60 } as const;
const goldButton = {
  fontSize: '11px', fontWeight: 500, letterSpacing: '0.28em', padding: '14px 22px',
  borderRadius: '3px', color: navy, outlineColor: gold,
} as const;
const outlineButton = {
  fontSize: '11px', fontWeight: 500, letterSpacing: '0.28em', padding: '13px 22px',
  borderRadius: '3px', color: gold, border: '1px solid hsl(var(--hero-gold) / 0.45)', background: 'transparent',
} as const;

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: navyMid, border: cardBorder, borderRadius: '3px', padding: '28px' }}>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3" style={{ borderTop: '1px solid hsl(var(--hero-gold) / 0.12)' }}>
      <span className="font-barlow-condensed uppercase" style={labelStyle}>{label}</span>
      <span className="font-barlow text-right" style={{ fontSize: '15px', fontWeight: 400, color: white }}>{value}</span>
    </div>
  );
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function AccountContent() {
  const { status, loading, error, reload } = useCompanyBilling();
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const [switchSuccess, setSwitchSuccess] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  async function handleSwitchToYearly() {
    if (!window.confirm('Switch to 12-month billing? Unused time on your current plan is credited and the annual price is charged now.')) return;
    setSwitching(true);
    setSwitchError(null);
    try {
      const res = await fetch('/api/stripe/switch-to-yearly', { method: 'POST', credentials: 'include' });
      const data = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
      if (res.ok && data.success) {
        setSwitchSuccess(true);
        await reload();
      } else {
        setSwitchError(data.error ?? 'Failed to switch plan.');
      }
    } catch {
      setSwitchError('Network error. Please try again.');
    } finally {
      setSwitching(false);
    }
  }

  async function handleManageBilling() {
    setPortalLoading(true);
    setPortalError(null);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST', credentials: 'include' });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setPortalError(data.error ?? 'Could not open billing.');
    } catch {
      setPortalError('Network error. Please try again.');
    }
    setPortalLoading(false);
  }

  const access = status?.access ?? null;
  const plan = access?.plan ?? null;
  const cycle = access?.billingCycle === 'quarterly' || access?.billingCycle === 'annual' ? access.billingCycle : null;
  const dateLabel = formatDate(access?.currentPeriodEnd ?? null);
  const daysLeft = access?.currentPeriodEnd
    ? Math.ceil((new Date(access.currentPeriodEnd).getTime() - Date.now()) / 86_400_000)
    : null;
  const isStripe = access?.source === 'stripe';
  const canSwitch = !!access?.active && isStripe && cycle === 'quarterly' && !access.cancelAtPeriodEnd;
  const hadStripePlan = !!access?.stripeSubscriptionId;

  return (
    <main className="min-h-screen pb-24" style={{ background: navy }}>
      <div className="max-w-3xl mx-auto px-6 pt-16">
        <p className="font-barlow-condensed uppercase mb-3" style={{ ...labelStyle, color: gold }}>
          {status?.company?.legalName ?? 'REP | IV'}
        </p>
        <h1 className="font-bodoni mb-10" style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 400, lineHeight: 1.05, color: white }}>
          <span>{company_account.heading}</span>
        </h1>

        {loading && !status && (
          <div className="flex items-center gap-2 font-barlow" style={bodyStyle}>
            <RefreshCw size={16} className="animate-spin" />
            <span>Loading subscription…</span>
          </div>
        )}

        {error && !status && (
          <Card>
            <p className="font-barlow" style={{ ...bodyStyle, color: white }}>{error}</p>
          </Card>
        )}

        {status && status.verification !== 'approved' && (
          <Card>
            <div className="flex items-start gap-3">
              <AlertCircle size={20} style={{ color: gold, flexShrink: 0, marginTop: '2px' }} />
              <div className="flex flex-col gap-4">
                <p className="font-barlow" style={{ ...bodyStyle, color: white }}>
                  {VERIFICATION_MESSAGES[status.verification]}
                </p>
                {status.verification === 'not_approved' && (
                  <Link to="/verify-company" className="gold-shimmer-bg font-barlow-condensed uppercase inline-flex self-start" style={goldButton}>
                    Verify your company
                  </Link>
                )}
              </div>
            </div>
          </Card>
        )}

        {status?.verification === 'approved' && !access?.active && (
          <Card>
            <div className="flex items-start gap-3 mb-6">
              <AlertCircle size={20} style={{ color: gold, flexShrink: 0, marginTop: '2px' }} />
              <div>
                <p className="font-barlow-condensed uppercase mb-2" style={{ ...labelStyle, color: white }}>
                  <span>{hadStripePlan ? 'Plan ended' : company_account.noPlan.title}</span>
                </p>
                <p className="font-barlow" style={bodyStyle}>
                  <span>{hadStripePlan ? company_account.currentPlan.expired.message : company_account.noPlan.body}</span>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/pricing" className="gold-shimmer-bg font-barlow-condensed uppercase inline-flex" style={goldButton}>
                <span>{hadStripePlan ? company_account.currentPlan.expired.cta : company_account.noPlan.cta}</span>
              </Link>
              {hadStripePlan && (
                <button onClick={handleManageBilling} disabled={portalLoading} className="font-barlow-condensed uppercase disabled:opacity-60" style={outlineButton}>
                  {portalLoading ? 'Opening…' : 'Billing history'}
                </button>
              )}
            </div>
            {portalError && <p className="font-barlow mt-3" style={{ ...bodyStyle, color: gold }}>{portalError}</p>}
          </Card>
        )}

        {status?.verification === 'approved' && access?.active && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card>
              <p className="font-barlow-condensed uppercase mb-3" style={labelStyle}>
                <span>{company_account.currentPlan.label}</span>
              </p>
              <p className="font-bodoni mb-5" style={{ fontSize: '2.2rem', fontWeight: 400, lineHeight: 1, color: white }}>
                {PLAN_NAMES[plan ?? ''] ?? plan ?? '—'}
              </p>
              <Row label="Billing" value={cycle ? (cycle === 'annual' ? '12 months' : '3 months') : isStripe ? '—' : 'Arranged with The NextRep'} />
              {plan && cycle && PLAN_PRICES[plan] && <Row label="Price" value={PLAN_PRICES[plan][cycle]} />}
              <Row label="Status" value={<span style={{ color: access.status === 'past_due' ? gold : white }}>{STATUS_LABELS[access.status ?? ''] ?? access.status ?? '—'}</span>} />
              {dateLabel && (
                <Row
                  label={!isStripe ? 'Access until' : access.cancelAtPeriodEnd ? company_account.currentPlan.cancelsOn : company_account.currentPlan.renewsOn}
                  value={<>{dateLabel}{daysLeft !== null && daysLeft >= 0 && <span style={{ color: ice60, fontSize: '12px' }}> ({daysLeft} days)</span>}</>}
                />
              )}
              {access.status === 'past_due' && (
                <p className="font-barlow mt-4" style={{ ...bodyStyle, color: gold }}>
                  Your last payment did not go through. Update your payment method in billing to keep access.
                </p>
              )}
              {isStripe && (
                <div className="mt-6">
                  <button
                    onClick={handleManageBilling}
                    disabled={portalLoading}
                    className="font-barlow-condensed uppercase inline-flex items-center gap-2 disabled:opacity-60"
                    style={outlineButton}
                  >
                    <CreditCard size={13} />
                    {portalLoading ? 'Opening…' : 'Manage billing'}
                  </button>
                  {portalError && <p className="font-barlow mt-3" style={{ ...bodyStyle, color: gold }}>{portalError}</p>}
                </div>
              )}
            </Card>

            {canSwitch && (
              <Card>
                <p className="font-barlow-condensed uppercase mb-3" style={labelStyle}>
                  <span>{company_account.switchToYearly.label}</span>
                </p>
                <p className="font-bodoni mb-3" style={{ fontSize: '1.5rem', fontWeight: 400, color: white }}>
                  <span>{company_account.switchToYearly.heading}</span>
                </p>
                <p className="font-barlow mb-5" style={bodyStyle}>
                  <span>{company_account.switchToYearly.body}</span>
                </p>
                {switchError && <p className="font-barlow mb-3" style={{ ...bodyStyle, color: gold }}>{switchError}</p>}
                <button
                  onClick={handleSwitchToYearly}
                  disabled={switching}
                  className="gold-shimmer-bg font-barlow-condensed uppercase disabled:opacity-60"
                  style={goldButton}
                >
                  {switching
                    ? <span>{company_account.switchToYearly.switching}</span>
                    : <span>{company_account.switchToYearly.cta}</span>}
                </button>
              </Card>
            )}

            {switchSuccess && !canSwitch && (
              <Card>
                <div className="flex items-center gap-2 font-barlow" style={{ ...bodyStyle, color: white }}>
                  <CheckCircle size={16} style={{ color: gold }} />
                  <span>{company_account.switchToYearly.successMessage}</span>
                </div>
              </Card>
            )}
          </div>
        )}

        <div className="mt-10">
          <Link to="/company/dashboard" className="font-barlow-condensed uppercase" style={{ ...labelStyle, color: gold }}>
            ← Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function CompanyAccountPage() {
  return (
    <>
      <Helmet>
        <title>Account — REP | IV</title>
        <meta name="description" content="Manage your company subscription, billing cycle, and plan on REP | IV." />
        <meta name="robots" content="noindex" />
      </Helmet>
      <AuthGuard>
        <AccountContent />
      </AuthGuard>
    </>
  );
}
