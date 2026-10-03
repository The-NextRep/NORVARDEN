import { useState } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { Link, useNavigate } from 'react-router';
import { for_companies } from 'virtual:content';
import { pricing } from 'virtual:content';
import { ContentListContext } from '@airo/content';
import { Shield, CheckCircle, ChevronRight, Mail, ChevronDown, HeartHandshake } from 'lucide-react';
import {
  DISCOUNT_NOTE,
  MISSION_APPLIED_NOTE,
  VERIFICATION_MESSAGES,
  subscribe,
  useCompanyBilling,
} from '@/lib/stripe/billing';

const siteUrl = 'https://www.norvarden.com';

type BillingCycle = 'quarterly' | 'annual';

// ─── Design tokens ────────────────────────────────────────────────────────
const navy         = 'hsl(var(--hero-navy))';
const gold         = 'hsl(var(--hero-gold))';
const ice          = 'hsl(var(--hero-ice))';
const white        = 'hsl(var(--hero-white))';
const ice60        = 'hsl(var(--hero-ice-60))';
const goldBorder   = '1px solid hsl(var(--hero-gold))';
const goldBorder35 = '1px solid hsl(var(--hero-gold) / 0.35)';
const goldBorder20 = '1px solid hsl(var(--hero-gold) / 0.20)';
const cardBg       = 'hsl(var(--hero-card-bg))';
const goldGradient = `linear-gradient(to right, transparent, ${gold} 30%, ${gold} 70%, transparent)`;

// ─── Hairline (chrome — not content) ─────────────────────────────────────
function Hairline({ className = '' }: { className?: string }) {
  return (
    <div className={className} style={{ height: '1px', background: goldGradient }} aria-hidden="true" />
  );
}

// ─── FAQ open-state is tracked per-index in the page component ───────────
// (no sub-component receives content values as props)

// ─── Main page ────────────────────────────────────────────────────────────
export default function ForCompaniesPage() {
  const [billing, setBilling] = useState<BillingCycle>('annual');
  const [coupon, setCoupon]   = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [faqOpen, setFaqOpen] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  const [notice, setNotice]   = useState<string | null>(null);
  const { status } = useCompanyBilling();

  const hasActivePlan   = !!status?.access?.active;
  const missionEligible = !!status?.company?.missionDiscountUnlocked;
  const blockedMessage  =
    status?.signedIn && status.verification !== 'approved' && status.verification !== 'not_approved'
      ? VERIFICATION_MESSAGES[status.verification]
      : null;

  async function handleSubscribe(planId: 'scout' | 'partner') {
    setNotice(null);
    setLoading(planId);
    try {
      const outcome = await subscribe(planId, billing, coupon, '/for-companies#plans');
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
    '@id': `${siteUrl}/for-companies#webpage`,
    url: `${siteUrl}/for-companies`,
    name: 'For Companies — NORVARDEN',
    isPartOf: { '@id': `${siteUrl}/#website` },
  };

  return (
    <>
      <Helmet>
        <title>For Companies — NORVARDEN</title>
        <meta name="description" content="Hire verified people with disabilities. Every company is reviewed before it can post. Scout from $1,800/quarter or $6,000/year." />
        <link rel="canonical" href={`${siteUrl}/for-companies`} />
        <meta property="og:title" content="For Companies — NORVARDEN" />
        <meta property="og:description" content="Hire verified people with disabilities. Every company is reviewed before it can post." />
        <meta property="og:url" content={`${siteUrl}/for-companies`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>
      </Helmet>

      <main style={{ background: navy }}>

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section
          className="relative flex items-end overflow-hidden"
          style={{ minHeight: '45vh' }}
          aria-label="For companies hero"
        >
          <div
            className="bg-photo active"
            role="img"
            aria-label="City skyline silhouetted against a golden sunset"
            style={{ backgroundImage: 'url(/images/city-skyline-sunset.jpg)' }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `linear-gradient(to right, hsl(var(--hero-navy-80)) 0%, hsl(var(--hero-navy-55)) 55%, hsl(var(--hero-navy-30)) 100%)` }}
            aria-hidden="true"
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
            style={{ background: `linear-gradient(to top, ${navy} 0%, transparent 100%)` }}
            aria-hidden="true"
          />

          <div className="relative z-10 px-6 md:px-12 lg:px-16 pb-14 pt-28 w-full max-w-7xl mx-auto">
            <p className="font-barlow-condensed uppercase mb-4" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.36em', color: gold }}>
              <span>{for_companies.hero.eyebrow}</span>
            </p>
            <div className="mb-5 w-24" style={{ height: '1px', background: gold }} aria-hidden="true" />
            <h1
              className="font-bodoni mb-8"
              style={{ fontSize: 'clamp(2.4rem, 5vw, 4.5rem)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.01em', color: white, maxWidth: '700px' }}
            >
              <span>{for_companies.hero.headline}</span>{' '}
              <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>
                <span>{for_companies.hero.headlineGold}</span>
              </em>
            </h1>
            <button
              onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })}
              className="gold-shimmer-bg font-barlow-condensed uppercase inline-flex items-center justify-center gap-2 transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em', paddingTop: '17px', paddingBottom: '17px', paddingLeft: '44px', paddingRight: '44px', borderRadius: '3px', color: navy, outlineColor: gold }}
            >
              <span>{for_companies.hero.cta}</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </section>

        {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
        <section className="px-6 md:px-12 lg:px-16 py-24 max-w-7xl mx-auto" aria-label="How it works">
          <div className="mb-12 flex flex-col gap-4">
            <p className="font-barlow-condensed uppercase" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.36em', color: gold }}>
              <span>{for_companies.howItWorks.eyebrow}</span>
            </p>
            <Hairline className="w-24" />
            <h2 className="font-bodoni" style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.01em', color: white }}>
              <span>{for_companies.howItWorks.headline}</span>{' '}
              <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>
                <span>{for_companies.howItWorks.headlineGold}</span>
              </em>
            </h2>
          </div>

          <ContentListContext field="for_companies.howItWorks.steps">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ border: goldBorder35, borderRadius: '3px', overflow: 'hidden' }}>
              {for_companies.howItWorks.steps.map((step) => (
                <div
                  key={step.id}
                  className="flex flex-col gap-5 p-8"
                  style={{ background: cardBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
                >
                  <span className="font-bodoni" style={{ fontSize: '3rem', fontWeight: 400, lineHeight: 1, color: 'hsl(var(--hero-gold) / 0.25)' }}>
                    {step.number}
                  </span>
                  <div style={{ height: '1px', background: 'hsl(var(--hero-gold) / 0.25)' }} aria-hidden="true" />
                  <h3 className="font-bodoni" style={{ fontSize: '22px', fontWeight: 400, lineHeight: 1.1, color: white }}>
                    {step.title}
                  </h3>
                  <p className="font-barlow" style={{ fontSize: '16px', fontWeight: 300, lineHeight: 1.75, color: ice60 }}>
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </ContentListContext>
        </section>

        <div className="px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
          <Hairline />
        </div>

        {/* ── WHO YOU'LL MEET ───────────────────────────────────────────── */}
        <section className="px-6 md:px-12 lg:px-16 py-24 max-w-7xl mx-auto" aria-label="Who you'll meet">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div className="flex flex-col gap-6 lg:sticky lg:top-24">
              <p className="font-barlow-condensed uppercase" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.36em', color: gold }}>
                <span>{for_companies.whoYoullMeet.eyebrow}</span>
              </p>
              <Hairline className="w-24" />
              <h2 className="font-bodoni" style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.01em', color: white }}>
                <span>{for_companies.whoYoullMeet.headline}</span>{' '}
                <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>
                  <span>{for_companies.whoYoullMeet.headlineGold}</span>
                </em>
              </h2>
              <p className="font-barlow" style={{ fontSize: '17px', fontWeight: 300, lineHeight: 1.75, color: ice60, maxWidth: '480px' }}>
                <span>{for_companies.whoYoullMeet.body}</span>
              </p>
            </div>

            <ContentListContext field="for_companies.whoYoullMeet.profiles">
              <div className="flex flex-col gap-4">
                {for_companies.whoYoullMeet.profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="flex flex-col gap-3 p-7"
                    style={{ background: cardBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: goldBorder35, borderRadius: '3px' }}
                  >
                    <div className="flex items-center gap-3">
                      <Shield size={14} style={{ color: gold, flexShrink: 0 }} />
                      <span className="font-barlow-condensed uppercase" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.32em', color: gold }}>
                        {profile.label}
                      </span>
                    </div>
                    <p className="font-barlow" style={{ fontSize: '16px', fontWeight: 300, lineHeight: 1.75, color: ice }}>
                      {profile.body}
                    </p>
                  </div>
                ))}
              </div>
            </ContentListContext>
          </div>
        </section>

        <div className="px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
          <Hairline />
        </div>

        {/* ── INCLUSION COURSE ──────────────────────────────────────────── */}
        <section className="px-6 md:px-12 lg:px-16 pt-24 max-w-7xl mx-auto" aria-label="Inclusion course">
          <div
            className="flex flex-col md:flex-row md:items-center gap-6 justify-between p-8 md:p-10 rounded-md"
            style={{ background: 'hsl(var(--hero-navy-mid))', border: '1px solid hsl(var(--hero-gold) / 0.35)' }}
          >
            <div className="flex gap-5 items-start max-w-2xl">
              <HeartHandshake size={34} aria-hidden="true" style={{ color: 'hsl(var(--hero-gold))', flexShrink: 0 }} />
              <div className="flex flex-col gap-2">
                <h2 className="font-bodoni" style={{ fontSize: 'clamp(1.5rem, 2.6vw, 2rem)', color: 'hsl(var(--hero-white))', lineHeight: 1.2 }}>
                  Earn the Inclusion Certified badge
                </h2>
                <p className="font-barlow" style={{ fontSize: '16px', lineHeight: 1.7, color: 'hsl(var(--hero-ice-60))' }}>
                  A free 15-minute course for your hiring team on etiquette, accessible interviews and accommodations.
                  Pass the quiz and every job you post shows the badge for 12 months.
                </p>
              </div>
            </div>
            <Link
              to="/inclusion-course"
              className="gold-shimmer-bg font-barlow-condensed uppercase inline-flex items-center gap-2 self-start md:self-auto whitespace-nowrap"
              style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.24em', padding: '16px 28px', borderRadius: '6px', color: 'hsl(var(--hero-navy))' }}
            >
              Start the course <ChevronRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </section>

        {/* ── PLANS ─────────────────────────────────────────────────────── */}
        <section id="plans" className="px-6 md:px-12 lg:px-16 py-24 max-w-7xl mx-auto" aria-label="Plans and pricing">
          <div className="text-center mb-14 flex flex-col items-center gap-4">
            <p className="font-barlow-condensed uppercase" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.36em', color: gold }}>
              Plans
            </p>
            <Hairline className="w-24" />
            <h2 className="font-bodoni" style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.01em', color: white }}>
              Simple,{' '}
              <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>transparent.</em>
            </h2>
          </div>

          {/* Billing toggle */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex items-center gap-2 p-1" style={{ border: goldBorder20, borderRadius: '4px' }}>
              <button
                onClick={() => setBilling('quarterly')}
                aria-pressed={billing === 'quarterly'}
                className="font-barlow-condensed uppercase transition-all"
                style={{
                  fontSize: '11px', fontWeight: 500, letterSpacing: '0.28em',
                  padding: '12px 28px', borderRadius: '3px',
                  border: billing === 'quarterly' ? goldBorder : goldBorder35,
                  background: billing === 'quarterly' ? 'hsl(var(--hero-gold) / 0.12)' : 'transparent',
                  color: billing === 'quarterly' ? gold : ice60, cursor: 'pointer',
                }}
              >
                <span>{pricing.toggle.quarterly}</span>
              </button>
              <button
                onClick={() => setBilling('annual')}
                aria-pressed={billing === 'annual'}
                className="font-barlow-condensed uppercase inline-flex items-center gap-2 transition-all"
                style={{
                  fontSize: '11px', fontWeight: 500, letterSpacing: '0.28em',
                  padding: '12px 28px', borderRadius: '3px',
                  border: billing === 'annual' ? goldBorder : goldBorder35,
                  background: billing === 'annual' ? 'hsl(var(--hero-gold) / 0.12)' : 'transparent',
                  color: billing === 'annual' ? gold : ice60, cursor: 'pointer',
                }}
              >
                <span>{pricing.toggle.annual}</span>
                {billing === 'annual' && (
                  <span
                    className="font-barlow-condensed uppercase"
                    style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.2em', color: gold, padding: '2px 6px', border: goldBorder35, borderRadius: '2px' }}
                  >
                    <span>{pricing.toggle.annualSavings}</span>
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Plan cards */}
          <ContentListContext field="pricing.plans">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
              {pricing.plans.map((plan) => {
                const isFounding = plan.id === 'founding';
                const isPartner  = plan.id === 'partner';
                const planId     = plan.id as 'scout' | 'partner';
                const isLoading  = loading === plan.id;

                return (
                  <div
                    key={plan.id}
                    className="flex flex-col gap-6 p-8 relative"
                    style={{
                      background: isPartner ? 'hsl(var(--hero-gold) / 0.08)' : cardBg,
                      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                      border: isPartner ? goldBorder : goldBorder35,
                      borderRadius: '3px',
                    }}
                  >
                    {isPartner && (
                      <div
                        className="absolute -top-3 left-1/2 -translate-x-1/2 font-barlow-condensed uppercase whitespace-nowrap"
                        style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em', padding: '3px 10px', background: navy, border: goldBorder, borderRadius: '2px', color: gold }}
                      >
                        Most popular
                      </div>
                    )}

                    <div className="flex flex-col gap-1">
                      <span className="font-barlow-condensed uppercase" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.32em', color: gold }}>
                        <span>{plan.name}</span>
                      </span>
                      <p className="font-barlow" style={{ fontSize: '14px', fontWeight: 300, color: ice60 }}>
                        <span>{plan.tagline}</span>
                      </p>
                    </div>

                    <div style={{ borderTop: goldBorder20, paddingTop: '20px' }}>
                      {isFounding ? (
                        <span className="font-bodoni" style={{ fontSize: '2rem', fontWeight: 400, color: white }}>Custom</span>
                      ) : (
                        <div className="flex items-end gap-2">
                          <span className="font-bodoni" style={{ fontSize: '3rem', fontWeight: 400, lineHeight: 1, color: white }}>
                            {billing === 'quarterly' ? <span>{plan.quarterlyPrice}</span> : <span>{plan.annualPrice}</span>}
                          </span>
                          <span className="font-barlow mb-1" style={{ fontSize: '13px', fontWeight: 300, color: ice60 }}>
                            {billing === 'quarterly' ? <span>{plan.quarterlyBilling}</span> : <span>{plan.annualBilling}</span>}
                          </span>
                        </div>
                      )}
                    </div>

                    <ContentListContext field={`pricing.plans[${pricing.plans.indexOf(plan)}].features`}>
                      <ul className="flex flex-col gap-3">
                        {plan.features.map((f) => (
                          <li key={f.id} className="flex items-start gap-3">
                            <CheckCircle size={14} style={{ color: gold, flexShrink: 0, marginTop: '3px' }} />
                            <span className="font-barlow" style={{ fontSize: '14px', fontWeight: 300, lineHeight: 1.6, color: ice }}>
                              <span>{f.text}</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </ContentListContext>

                    <div className="mt-auto pt-2">
                      {isFounding ? (
                        <a
                          href="mailto:info@norvarden.com"
                          className="gold-shimmer-bg font-barlow-condensed uppercase inline-flex items-center justify-center gap-2 w-full transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                          style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em', paddingTop: '17px', paddingBottom: '17px', borderRadius: '3px', color: navy, outlineColor: gold }}
                        >
                          <Mail size={13} />
                          <span>{plan.cta}</span>
                        </a>
                      ) : hasActivePlan ? (
                        <button
                          onClick={() => navigate('/company/account')}
                          className="gold-shimmer-bg font-barlow-condensed uppercase inline-flex items-center justify-center gap-2 w-full transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                          style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em', paddingTop: '17px', paddingBottom: '17px', borderRadius: '3px', color: navy, outlineColor: gold }}
                        >
                          Manage plan
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSubscribe(planId)}
                          disabled={isLoading}
                          className="gold-shimmer-bg font-barlow-condensed uppercase inline-flex items-center justify-center gap-2 w-full transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
                          style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em', paddingTop: '17px', paddingBottom: '17px', borderRadius: '3px', color: navy, outlineColor: gold }}
                        >
                          {isLoading ? 'Redirecting…' : <span>{plan.cta}</span>}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ContentListContext>

          {/* Coupon + discount note */}
          <div className="mt-10 flex flex-col items-center gap-4">
            <div className="inline-flex items-center gap-3 px-5 py-3" style={{ border: goldBorder20, borderRadius: '3px', background: cardBg }}>
              <label htmlFor="fc-coupon" className="font-barlow-condensed uppercase" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.28em', color: ice60 }}>
                <span>{pricing.discounts.couponLabel}</span>
              </label>
              <input
                id="fc-coupon"
                type="text"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder={pricing.discounts.couponCode}
                className="bg-transparent font-barlow"
                style={{ fontSize: '14px', fontWeight: 300, color: white, outline: 'none', width: '120px' }}
              />
            </div>
            {(notice || blockedMessage) && (
              <p role="alert" className="font-barlow text-center max-w-lg" style={{ fontSize: '14px', fontWeight: 400, lineHeight: 1.7, color: gold }}>
                {notice ?? blockedMessage}
              </p>
            )}
            {missionEligible && !hasActivePlan && (
              <p className="font-barlow text-center max-w-lg" style={{ fontSize: '14px', fontWeight: 400, lineHeight: 1.7, color: white }}>
                {MISSION_APPLIED_NOTE}
              </p>
            )}
            <p className="font-barlow text-center max-w-lg" style={{ fontSize: '14px', fontWeight: 300, lineHeight: 1.7, color: ice60 }}>
              <span>{DISCOUNT_NOTE}</span>
            </p>
          </div>
        </section>

        {/* ── TRUST STRIP ───────────────────────────────────────────────── */}
        <section
          className="px-6 md:px-12 lg:px-16 py-16 max-w-7xl mx-auto"
          aria-label="Trust indicators"
          style={{ borderTop: goldBorder20, borderBottom: goldBorder20 }}
        >
          <ContentListContext field="for_companies.trustStrip.items">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {for_companies.trustStrip.items.map((item) => (
                <div key={item.id} className="flex flex-col items-center text-center gap-2">
                  <span className="font-bodoni" style={{ fontSize: 'clamp(2rem, 3vw, 2.8rem)', fontWeight: 400, lineHeight: 1, color: gold }}>
                    {item.stat}
                  </span>
                  <span className="font-barlow-condensed uppercase" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em', color: ice60 }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </ContentListContext>
        </section>

        {/* ── COMPANY FAQ ───────────────────────────────────────────────── */}
        <section className="px-6 md:px-12 lg:px-16 py-24 max-w-4xl mx-auto" aria-label="Frequently asked questions">
          <div className="mb-12 flex flex-col gap-4">
            <p className="font-barlow-condensed uppercase" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.36em', color: gold }}>
              <span>{for_companies.faq.eyebrow}</span>
            </p>
            <Hairline className="w-24" />
            <h2 className="font-bodoni" style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.01em', color: white }}>
              <span>{for_companies.faq.headline}</span>{' '}
              <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>
                <span>{for_companies.faq.headlineGold}</span>
              </em>
            </h2>
          </div>

          <div style={{ borderTop: goldBorder20 }}>
            <ContentListContext field="for_companies.faq.items">
              {for_companies.faq.items.map((item) => (
                <div key={item.id} style={{ borderBottom: goldBorder20 }}>
                  <button
                    onClick={() => setFaqOpen((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                    className="w-full flex items-center justify-between gap-4 py-5 text-left focus-visible:outline focus-visible:outline-2"
                    style={{ outlineColor: gold }}
                    aria-expanded={!!faqOpen[item.id]}
                  >
                    <span className="font-bodoni" style={{ fontSize: '18px', fontWeight: 400, lineHeight: 1.2, color: white }}>
                      {item.question}
                    </span>
                    <span style={{ color: gold, flexShrink: 0 }}>
                      <ChevronDown size={16} style={{ transform: faqOpen[item.id] ? 'none' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
                    </span>
                  </button>
                  {faqOpen[item.id] && (
                    <div className="pb-5">
                      <p className="font-barlow" style={{ fontSize: '16px', fontWeight: 300, lineHeight: 1.75, color: ice60 }}>
                        {item.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </ContentListContext>
          </div>
        </section>

        {/* ── CLOSING BAND ──────────────────────────────────────────────── */}
        <section className="relative overflow-hidden" aria-label="Closing call to action">
          <div
            className="bg-photo active"
            role="img"
            aria-label="Red sky at sunrise"
            style={{ backgroundImage: 'url(/images/red-sky-sunrise.jpg)' }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `linear-gradient(to right, hsl(var(--hero-navy-90)) 0%, hsl(var(--hero-navy-80)) 50%, hsl(var(--hero-navy-65)) 100%)` }}
            aria-hidden="true"
          />

          <div className="relative z-10 px-6 md:px-12 lg:px-16 py-28 max-w-7xl mx-auto">
            <div className="max-w-2xl flex flex-col gap-6">
              <p className="font-barlow-condensed uppercase" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.36em', color: gold }}>
                <span>{for_companies.closingBand.eyebrow}</span>
              </p>
              <Hairline className="w-24" />
              <h2 className="font-bodoni" style={{ fontSize: 'clamp(2.4rem, 5vw, 4.5rem)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.01em', color: white }}>
                <span>{for_companies.closingBand.headline}</span>{' '}
                <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>
                  <span>{for_companies.closingBand.headlineGold}</span>
                </em>
              </h2>
              <p className="font-barlow" style={{ fontSize: '17px', fontWeight: 300, lineHeight: 1.75, color: ice60, maxWidth: '480px' }}>
                <span>{for_companies.closingBand.body}</span>
              </p>
              <div className="flex flex-wrap gap-4 mt-2">
                <button
                  onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })}
                  className="gold-shimmer-bg font-barlow-condensed uppercase inline-flex items-center justify-center gap-2 transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em', paddingTop: '17px', paddingBottom: '17px', paddingLeft: '44px', paddingRight: '44px', borderRadius: '3px', color: navy, outlineColor: gold }}
                >
                  <span>{for_companies.closingBand.primaryCta}</span>
                  <ChevronRight size={13} />
                </button>
                <a
                  href="/jobs"
                  className="font-barlow-condensed uppercase inline-flex items-center justify-center gap-2 transition-all hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em', paddingTop: '16px', paddingBottom: '16px', paddingLeft: '40px', paddingRight: '40px', borderRadius: '3px', border: goldBorder35, color: ice60, outlineColor: gold }}
                >
                  <span>{for_companies.closingBand.secondaryCta}</span>
                </a>
              </div>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
