import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { pricing } from 'virtual:content';
import { Check, Mail } from 'lucide-react';
import {
  DISCOUNT_NOTE,
  MISSION_APPLIED_NOTE,
  VERIFICATION_MESSAGES,
  subscribe,
  useCompanyBilling,
} from '@/lib/stripe/billing';

const siteUrl = 'https://jobs.the-nextrep.com';

const navy     = 'hsl(var(--hero-navy))';
const gold     = 'hsl(var(--hero-gold))';
const white    = 'hsl(var(--hero-white))';
const ice75    = 'hsl(var(--hero-ice) / 0.78)';
const goldLine = 'hsl(var(--hero-gold) / 0.28)';

const solidButton = {
  fontSize: '12px', fontWeight: 600, letterSpacing: '0.3em', padding: '15px 20px',
  borderRadius: '3px', color: navy, outlineColor: gold,
} as const;

const outlineButton = {
  fontSize: '12px', fontWeight: 600, letterSpacing: '0.3em', padding: '14px 20px',
  borderRadius: '3px', color: gold, border: '1px solid hsl(var(--hero-gold) / 0.7)',
  background: 'transparent', outlineColor: gold,
} as const;

type BillingCycle = 'quarterly' | 'annual';

export default function PricingPage() {
  const [billing, setBilling] = useState<BillingCycle>('annual');
  const [coupon, setCoupon] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const navigate = useNavigate();
  const { status } = useCompanyBilling();

  const hasActivePlan = !!status?.access?.active;
  const missionEligible = !!status?.company?.missionDiscountUnlocked;
  const blockedMessage =
    status?.signedIn && status.verification !== 'approved' && status.verification !== 'not_approved'
      ? VERIFICATION_MESSAGES[status.verification]
      : null;

  async function handleSubscribe(planId: 'scout' | 'partner') {
    setNotice(null);
    setLoading(planId);
    try {
      const outcome = await subscribe(planId, billing, coupon, '/pricing');
      if (outcome.kind === 'redirect') {
        window.location.href = outcome.url;
        return;
      }
      if (outcome.kind === 'navigate') navigate(outcome.to);
      else setNotice(outcome.message);
    } finally {
      setLoading(null);
    }
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${siteUrl}/pricing#webpage`,
    url: `${siteUrl}/pricing`,
    name: 'Pricing — REP | IV',
    isPartOf: { '@id': `${siteUrl}/#website` },
  };

  return (
    <>
      <Helmet>
        <title>Pricing — REP | IV</title>
        <meta name="description" content="Scout at $1,800/quarter or $6,000/year. Partner at $5,400/quarter or $18,000/year. Athletes, coaches, and veterans always free." />
        <link rel="canonical" href={`${siteUrl}/pricing`} />
        <meta property="og:title" content="Pricing — REP | IV" />
        <meta property="og:url" content={`${siteUrl}/pricing`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>
      </Helmet>

      <main style={{ background: navy, color: white }}>
        {/* Hero */}
        <section className="pt-24 pb-14 text-center px-6">
          <p className="font-barlow-condensed uppercase mb-5" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.34em', color: gold }}>
            For companies
          </p>
          <h1 className="font-bodoni mb-5 mx-auto" style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.01em', color: white, maxWidth: '18ch' }}>
            <span>{pricing.hero.heading}</span>
          </h1>
          <div className="mx-auto mb-6" style={{ width: '64px', height: '1px', background: 'hsl(var(--hero-gold) / 0.6)' }} />
          <p className="font-barlow max-w-xl mx-auto" style={{ fontSize: '17px', fontWeight: 300, lineHeight: 1.75, color: ice75 }}>
            <span>{pricing.hero.subheading}</span>
          </p>
        </section>

        <section className="pb-20 px-6">
          <div className="mx-auto" style={{ maxWidth: '1120px' }}>
            {/* Billing toggle */}
            <div className="flex justify-center mb-12">
              <div role="group" aria-label="Billing length" className="inline-flex items-center gap-1 p-1" style={{ border: `1px solid ${goldLine}`, borderRadius: '3px' }}>
                {(['quarterly', 'annual'] as const).map((cycle) => {
                  const active = billing === cycle;
                  return (
                    <button
                      key={cycle}
                      type="button"
                      onClick={() => setBilling(cycle)}
                      aria-pressed={active}
                      className={`font-barlow-condensed uppercase inline-flex items-center gap-2 transition-colors ${active ? 'gold-shimmer-bg' : ''}`}
                      style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.22em', padding: '10px 22px', borderRadius: '2px', color: active ? navy : ice75, outlineColor: gold }}
                    >
                      <span>{cycle === 'quarterly' ? pricing.toggle.quarterly : pricing.toggle.annual}</span>
                      {cycle === 'annual' && (
                        <span className="hidden sm:inline" style={{ fontSize: '10px', letterSpacing: '0.12em', opacity: active ? 0.85 : 0.7 }}>
                          · <span>{pricing.toggle.annualSavings}</span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Plan cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {pricing.plans.map((plan) => {
                const isFounding = plan.id === 'founding';
                const isPartner = plan.id === 'partner';
                const planId = plan.id as 'scout' | 'partner';

                return (
                  <div
                    key={plan.id}
                    className="relative flex flex-col"
                    style={{
                      background: isPartner ? 'hsl(var(--hero-navy-mid))' : 'hsl(var(--hero-panel-bg))',
                      border: `1px solid ${isPartner ? 'hsl(var(--hero-gold) / 0.75)' : goldLine}`,
                      borderRadius: '3px',
                      padding: '36px 30px 30px',
                      boxShadow: isPartner ? '0 24px 60px -30px hsl(var(--hero-gold) / 0.45)' : 'none',
                    }}
                  >
                    {isPartner && (
                      <span
                        className="gold-shimmer-bg font-barlow-condensed uppercase absolute left-1/2 -translate-x-1/2"
                        style={{ top: '-12px', fontSize: '10px', fontWeight: 600, letterSpacing: '0.28em', padding: '5px 14px', borderRadius: '2px', color: navy, whiteSpace: 'nowrap' }}
                      >
                        Most popular
                      </span>
                    )}

                    <p className="font-barlow-condensed uppercase mb-2" style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.3em', color: gold }}>
                      <span>{plan.name}</span>
                    </p>
                    <p className="font-barlow mb-6" style={{ fontSize: '15px', fontWeight: 300, lineHeight: 1.5, color: ice75, minHeight: '45px' }}>
                      <span>{plan.tagline}</span>
                    </p>

                    <div className="mb-6 pb-6" style={{ borderBottom: `1px solid ${goldLine}` }}>
                      {isFounding ? (
                        <p className="font-bodoni" style={{ fontSize: '2.4rem', fontWeight: 400, lineHeight: 1.1, color: white }}>
                          Custom
                        </p>
                      ) : (
                        <p className="flex items-baseline gap-2 flex-wrap">
                          <span className="font-bodoni" style={{ fontSize: '3rem', fontWeight: 400, lineHeight: 1, color: white }}>
                            {billing === 'quarterly' ? <span>{plan.quarterlyPrice}</span> : <span>{plan.annualPrice}</span>}
                          </span>
                          <span className="font-barlow" style={{ fontSize: '14px', fontWeight: 300, color: ice75 }}>
                            {billing === 'quarterly' ? <span>{plan.quarterlyBilling}</span> : <span>{plan.annualBilling}</span>}
                          </span>
                        </p>
                      )}
                      {isFounding && (
                        <p className="font-barlow mt-2" style={{ fontSize: '14px', fontWeight: 300, color: ice75 }}>Tailored partnership terms</p>
                      )}
                    </div>

                    <ul className="flex flex-col gap-3 mb-8 flex-1">
                      {plan.features.map((f) => (
                        <li key={f.id} className="flex items-start gap-3">
                          <Check size={16} strokeWidth={2} className="shrink-0" style={{ color: gold, marginTop: '3px' }} aria-hidden="true" />
                          <span className="font-barlow" style={{ fontSize: '15px', fontWeight: 300, lineHeight: 1.5, color: white }}>
                            <span>{f.text}</span>
                          </span>
                        </li>
                      ))}
                    </ul>

                    {isFounding ? (
                      <a href="mailto:info@the-nextrep.com" className="font-barlow-condensed uppercase inline-flex items-center justify-center gap-2 w-full transition-colors hover:opacity-90" style={outlineButton}>
                        <Mail size={14} aria-hidden="true" />
                        <span>{plan.cta}</span>
                      </a>
                    ) : hasActivePlan ? (
                      <Link to="/company/account" className="font-barlow-condensed uppercase inline-flex justify-center w-full transition-colors hover:opacity-90" style={outlineButton}>
                        Manage plan
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSubscribe(planId)}
                        disabled={loading === planId}
                        className={`font-barlow-condensed uppercase inline-flex justify-center w-full transition-opacity disabled:opacity-60 ${isPartner ? 'gold-shimmer-bg' : 'hover:opacity-90'}`}
                        style={isPartner ? solidButton : outlineButton}
                      >
                        {loading === planId ? 'Redirecting…' : <span>{plan.cta}</span>}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {(notice || blockedMessage) && (
              <p role="alert" className="mt-8 text-center font-barlow" style={{ fontSize: '15px', color: 'hsl(0 85% 75%)' }}>
                {notice ?? blockedMessage}
              </p>
            )}

            {hasActivePlan && (
              <p className="mt-8 text-center font-barlow" style={{ fontSize: '15px', color: ice75 }}>
                Your company already has an active plan.{' '}
                <Link to="/company/account" className="underline" style={{ color: gold }}>Manage plan</Link>
              </p>
            )}

            {missionEligible && !hasActivePlan && (
              <p className="mt-8 text-center font-barlow" style={{ fontSize: '15px', color: white }}>{MISSION_APPLIED_NOTE}</p>
            )}

            {/* Coupon input */}
            {!hasActivePlan && (
              <div className="mt-10 flex justify-center">
                <div className="flex items-center gap-3" style={{ border: `1px solid ${goldLine}`, borderRadius: '3px', padding: '10px 16px', background: 'hsl(var(--hero-panel-bg))' }}>
                  <label htmlFor="coupon" className="font-barlow-condensed uppercase" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.24em', color: ice75 }}>
                    <span>{pricing.discounts.couponLabel}</span>
                  </label>
                  <input
                    id="coupon"
                    type="text"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    placeholder={pricing.discounts.couponCode}
                    autoCapitalize="characters"
                    className="font-barlow bg-transparent border-none outline-none w-32 placeholder:opacity-50"
                    style={{ fontSize: '15px', color: white, letterSpacing: '0.08em' }}
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Discounts */}
        <section className="py-16 px-6 text-center" style={{ background: 'hsl(var(--hero-panel-bg))', borderTop: `1px solid ${goldLine}`, borderBottom: `1px solid ${goldLine}` }}>
          <p className="font-barlow-condensed uppercase mb-4" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.34em', color: gold }}>
            Mission &amp; founding offers
          </p>
          <h2 className="font-bodoni mb-4" style={{ fontSize: '2.2rem', fontWeight: 400, lineHeight: 1.1, color: white }}>
            <span>{pricing.discounts.heading}</span>
          </h2>
          <p className="font-barlow max-w-2xl mx-auto" style={{ fontSize: '16px', fontWeight: 300, lineHeight: 1.75, color: ice75 }}>
            <span>{DISCOUNT_NOTE}</span>
          </p>
        </section>

        {/* Members CTA */}
        <section className="py-20 px-6">
          <div className="text-center mx-auto" style={{ maxWidth: '520px', border: `1px solid ${goldLine}`, borderRadius: '3px', padding: '40px 32px' }}>
            <h2 className="font-bodoni mb-3" style={{ fontSize: '2rem', fontWeight: 400, lineHeight: 1.1, color: white }}>
              <span>{pricing.members.heading}</span>
            </h2>
            <p className="font-barlow mb-7" style={{ fontSize: '16px', fontWeight: 300, lineHeight: 1.75, color: ice75 }}>
              <span>{pricing.members.body}</span>
            </p>
            <Link to="/signup" className="gold-shimmer-bg font-barlow-condensed uppercase inline-flex justify-center" style={{ ...solidButton, width: 'auto', padding: '15px 36px' }}>
              <span>{pricing.members.cta}</span>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
