import { veterans } from 'virtual:content';
import { ContentListContext } from '@airo/content';
import { Helmet } from '@dr.pogodin/react-helmet';
import { Link } from 'react-router';
import { Shield, ChevronRight, AlertTriangle } from 'lucide-react';

const siteUrl = 'https://jobs.the-nextrep.com';

// ─── Design tokens ────────────────────────────────────────────────────────
const navy         = 'hsl(var(--hero-navy))';
const gold         = 'hsl(var(--hero-gold))';
const ice          = 'hsl(var(--hero-ice))';
const white        = 'hsl(var(--hero-white))';
const ice60        = 'hsl(var(--hero-ice-60))';
const goldBorder   = '1px solid hsl(var(--hero-gold))';
const goldBorder35 = '1px solid hsl(var(--hero-gold) / 0.35)';
const cardBg       = 'hsl(var(--hero-card-bg))';
const goldGradient = `linear-gradient(to right, transparent, ${gold} 30%, ${gold} 70%, transparent)`;

// ─── Hairline ─────────────────────────────────────────────────────────────
function Hairline({ className = '' }: { className?: string }) {
  return (
    <div className={className} style={{ height: '1px', background: goldGradient }} aria-hidden="true" />
  );
}



// ─── Main page ────────────────────────────────────────────────────────────
export default function VeteransPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${siteUrl}/veterans#webpage`,
    url: `${siteUrl}/veterans`,
    name: veterans.meta.title,
    isPartOf: { '@id': `${siteUrl}/#website` },
  };

  return (
    <>
      <Helmet>
        <title>{veterans.meta.title}</title>
        <meta name="description" content={veterans.meta.description} />
        <link rel="canonical" href={`${siteUrl}/veterans`} />
        <meta property="og:title" content={veterans.meta.title} />
        <meta property="og:description" content={veterans.meta.description} />
        <meta property="og:url" content={`${siteUrl}/veterans`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>
      </Helmet>

      <main style={{ background: navy }}>

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section
          className="relative flex items-end overflow-hidden"
          style={{ minHeight: '45vh' }}
          aria-label="Veterans hero"
        >
          {/* Jet photo */}
          <div
            className="bg-photo active"
            role="img"
            aria-label="Soldiers boarding helicopters at sunset"
            style={{ backgroundImage: 'url(/images/veterans-helicopter-sunset.jpg)' }}
          />
          {/* Overlays */}
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

          {/* Text */}
          <div className="relative z-10 px-6 md:px-12 lg:px-16 pb-14 pt-28 w-full max-w-7xl mx-auto">
            <p className="font-barlow-condensed uppercase mb-4" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.36em', color: gold }}>
              <span>{veterans.hero.eyebrow}</span>
            </p>
            <div className="mb-5 w-24" style={{ height: '1px', background: gold }} aria-hidden="true" />
            <h1
              className="font-bodoni mb-5"
              style={{ fontSize: 'clamp(2.4rem, 5vw, 4.5rem)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.01em', color: white, maxWidth: '700px' }}
            >
              <span>{veterans.hero.headline}</span>{' '}
              <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>
                <span>{veterans.hero.headlineGold}</span>
              </em>
            </h1>
            <p className="font-barlow mb-8" style={{ fontSize: '17px', fontWeight: 300, lineHeight: 1.75, color: ice60, maxWidth: '520px' }}>
              <span>{veterans.hero.subheadline}</span>
            </p>
            <Link
              to="/signup"
              className="gold-shimmer-bg font-barlow-condensed uppercase inline-flex items-center justify-center gap-2 transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em', paddingTop: '17px', paddingBottom: '17px', paddingLeft: '44px', paddingRight: '44px', borderRadius: '3px', color: navy, outlineColor: gold }}
            >
              <span>{veterans.cta.primaryCta}</span>
              <ChevronRight size={13} />
            </Link>
          </div>
        </section>

        {/* ── WHAT WE OFFER ─────────────────────────────────────────────── */}
        <section className="px-6 md:px-12 lg:px-16 py-24 max-w-7xl mx-auto" aria-label="What REP | IV offers veterans">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Left: heading */}
            <div className="flex flex-col gap-6 lg:sticky lg:top-24">
              <p className="font-barlow-condensed uppercase" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.36em', color: gold }}>
                <span>{veterans.whatWeOffer.eyebrow}</span>
              </p>
              <Hairline className="w-24" />
              <h2 className="font-bodoni" style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.01em', color: white }}>
                <span>{veterans.whatWeOffer.headline}</span>{' '}
                <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>
                  <span>{veterans.whatWeOffer.headlineGold}</span>
                </em>
              </h2>
              <p className="font-barlow" style={{ fontSize: '16px', fontWeight: 300, lineHeight: 1.75, color: ice60 }}>
                REP | IV is always free for veterans. No plan, no subscription, no catch.
              </p>
            </div>

            {/* Right: offer cards */}
            <ContentListContext field="veterans.whatWeOffer.items">
              <div className="flex flex-col gap-4">
                {veterans.whatWeOffer.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 p-7"
                    style={{ background: cardBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: goldBorder35, borderRadius: '3px' }}
                  >
                    <div className="flex items-center gap-3">
                      <Shield size={14} style={{ color: gold, flexShrink: 0 }} />
                      <span className="font-barlow-condensed uppercase" style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.32em', color: gold }}>
                        {item.title}
                      </span>
                    </div>
                    <p className="font-barlow" style={{ fontSize: '16px', fontWeight: 300, lineHeight: 1.75, color: ice }}>
                      {item.body}
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

        {/* ── VERIFICATION ──────────────────────────────────────────────── */}
        <section className="px-6 md:px-12 lg:px-16 py-24 max-w-7xl mx-auto" aria-label="How veteran verification works">
          <div className="mb-14 flex flex-col gap-4 max-w-2xl">
            <p className="font-barlow-condensed uppercase" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.36em', color: gold }}>
              <span>{veterans.verification.eyebrow}</span>
            </p>
            <Hairline className="w-24" />
            <h2 className="font-bodoni" style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.01em', color: white }}>
              <span>{veterans.verification.headline}</span>{' '}
              <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>
                <span>{veterans.verification.headlineGold}</span>
              </em>
            </h2>
            <p className="font-barlow" style={{ fontSize: '17px', fontWeight: 300, lineHeight: 1.75, color: ice60 }}>
              <span>{veterans.verification.body}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Steps */}
            <ContentListContext field="veterans.verification.steps">
              <div className="flex flex-col gap-px" style={{ border: goldBorder35, borderRadius: '3px', overflow: 'hidden' }}>
                {veterans.verification.steps.map((step) => (
                  <div
                    key={step.id}
                    className="flex flex-col gap-4 p-7"
                    style={{ background: cardBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-bodoni" style={{ fontSize: '2rem', fontWeight: 400, lineHeight: 1, color: 'hsl(var(--hero-gold) / 0.30)' }}>
                        {step.number}
                      </span>
                      <h3 className="font-bodoni" style={{ fontSize: '18px', fontWeight: 400, lineHeight: 1.1, color: white }}>
                        {step.title}
                      </h3>
                    </div>
                    <p className="font-barlow" style={{ fontSize: '15px', fontWeight: 300, lineHeight: 1.75, color: ice60 }}>
                      {step.body}
                    </p>
                  </div>
                ))}
              </div>
            </ContentListContext>

            {/* Never ask panel */}
            <div
              className="flex flex-col gap-5 p-8"
              style={{ background: 'hsl(var(--hero-gold) / 0.06)', border: goldBorder35, borderRadius: '3px' }}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle size={16} style={{ color: gold, flexShrink: 0 }} />
                <span className="font-barlow-condensed uppercase" style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.32em', color: gold }}>
                  <span>{veterans.verification.neverAskLabel}</span>
                </span>
              </div>
              <div style={{ height: '1px', background: 'hsl(var(--hero-gold) / 0.25)' }} aria-hidden="true" />
              <ContentListContext field="veterans.verification.neverAsk">
                <ul className="flex flex-col gap-3">
                  {veterans.verification.neverAsk.map((item) => (
                    <li key={item.id} className="flex items-start gap-3">
                      <span style={{ color: 'hsl(var(--hero-gold) / 0.50)', flexShrink: 0, marginTop: '4px', fontSize: '14px', lineHeight: 1 }}>✕</span>
                      <span className="font-barlow" style={{ fontSize: '15px', fontWeight: 300, lineHeight: 1.6, color: ice }}>
                        {item.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </ContentListContext>
              <p className="font-barlow" style={{ fontSize: '13px', fontWeight: 300, lineHeight: 1.7, color: ice60, marginTop: '4px' }}>
                If anyone on REP | IV asks for any of the above, report it immediately using the flag on their profile.
              </p>
            </div>
          </div>
        </section>

        <div className="px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
          <Hairline />
        </div>

        {/* ── RESOURCES ─────────────────────────────────────────────────── */}
        <section className="px-6 md:px-12 lg:px-16 py-24 max-w-7xl mx-auto" aria-label="Veteran career resources">
          <div className="mb-14 flex flex-col gap-4">
            <p className="font-barlow-condensed uppercase" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.36em', color: gold }}>
              <span>{veterans.resources.eyebrow}</span>
            </p>
            <Hairline className="w-24" />
            <h2 className="font-bodoni" style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.01em', color: white }}>
              <span>{veterans.resources.headline}</span>{' '}
              <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>
                <span>{veterans.resources.headlineGold}</span>
              </em>
            </h2>
            <p className="font-barlow" style={{ fontSize: '17px', fontWeight: 300, lineHeight: 1.75, color: ice60, maxWidth: '560px' }}>
              <span>{veterans.resources.body}</span>
            </p>
          </div>

          <ContentListContext field="veterans.resources.items">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {veterans.resources.items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 p-7"
                  style={{ background: cardBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: goldBorder35, borderRadius: '3px' }}
                >
                  <h3 className="font-bodoni" style={{ fontSize: '20px', fontWeight: 400, lineHeight: 1.1, color: white }}>
                    {item.title}
                  </h3>
                  <p className="font-barlow" style={{ fontSize: '15px', fontWeight: 300, lineHeight: 1.75, color: ice60 }}>
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </ContentListContext>
        </section>

        <div className="px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
          <Hairline />
        </div>

        {/* ── BADGES ────────────────────────────────────────────────────── */}
        <section className="px-6 md:px-12 lg:px-16 py-24 max-w-7xl mx-auto" aria-label="Veteran-ready and SkillBridge badges">
          <div className="mb-14 flex flex-col gap-4 max-w-2xl">
            <p className="font-barlow-condensed uppercase" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.36em', color: gold }}>
              <span>{veterans.badges.eyebrow}</span>
            </p>
            <Hairline className="w-24" />
            <h2 className="font-bodoni" style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.01em', color: white }}>
              <span>{veterans.badges.headline}</span>{' '}
              <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>
                <span>{veterans.badges.headlineGold}</span>
              </em>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Veteran-ready badge card */}
            <div
              className="flex flex-col gap-5 p-8"
              style={{ background: cardBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: goldBorder35, borderRadius: '3px' }}
            >
              <span
                className="font-barlow-condensed uppercase"
                style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.28em', padding: '5px 10px', border: goldBorder, borderRadius: '3px', color: gold, background: 'hsl(var(--hero-gold) / 0.08)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Shield size={10} strokeWidth={2.5} style={{ color: gold, flexShrink: 0 }} />
                <span>{veterans.badges.veteranReady.label}</span>
              </span>
              <div style={{ height: '1px', background: 'hsl(var(--hero-gold) / 0.20)' }} aria-hidden="true" />
              <p className="font-barlow" style={{ fontSize: '16px', fontWeight: 300, lineHeight: 1.75, color: ice }}>
                <span>{veterans.badges.veteranReady.body}</span>
              </p>
            </div>

            {/* SkillBridge Partner badge card */}
            <div
              className="flex flex-col gap-5 p-8"
              style={{ background: cardBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: goldBorder35, borderRadius: '3px' }}
            >
              <span
                className="font-barlow-condensed uppercase"
                style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.28em', padding: '5px 10px', border: goldBorder, borderRadius: '3px', color: gold, background: 'hsl(var(--hero-gold) / 0.08)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Shield size={10} strokeWidth={2.5} style={{ color: gold, flexShrink: 0 }} />
                <span>{veterans.badges.skillbridge.label}</span>
              </span>
              <div style={{ height: '1px', background: 'hsl(var(--hero-gold) / 0.20)' }} aria-hidden="true" />
              <p className="font-barlow" style={{ fontSize: '16px', fontWeight: 300, lineHeight: 1.75, color: ice }}>
                <span>{veterans.badges.skillbridge.body}</span>
              </p>
            </div>
          </div>
        </section>

        {/* ── CLOSING CTA ───────────────────────────────────────────────── */}
        <section className="relative overflow-hidden" aria-label="Join free call to action">
          {/* Runway photo */}
          <div
            className="bg-photo active"
            role="img"
            aria-label="Airport runway at sunset with the control tower on the horizon"
            style={{ backgroundImage: 'url(/images/runway-sunset-tower.jpg)' }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `linear-gradient(to right, hsl(var(--hero-navy-90)) 0%, hsl(var(--hero-navy-80)) 50%, hsl(var(--hero-navy-65)) 100%)` }}
            aria-hidden="true"
          />

          <div className="relative z-10 px-6 md:px-12 lg:px-16 py-28 max-w-7xl mx-auto">
            <div className="max-w-2xl flex flex-col gap-6">
              <p className="font-barlow-condensed uppercase" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.36em', color: gold }}>
                <span>{veterans.cta.eyebrow}</span>
              </p>
              <Hairline className="w-24" />
              <h2 className="font-bodoni" style={{ fontSize: 'clamp(2.4rem, 5vw, 4.5rem)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.01em', color: white }}>
                <span>{veterans.cta.headline}</span>{' '}
                <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>
                  <span>{veterans.cta.headlineGold}</span>
                </em>
              </h2>
              <p className="font-barlow" style={{ fontSize: '17px', fontWeight: 300, lineHeight: 1.75, color: ice60, maxWidth: '480px' }}>
                <span>{veterans.cta.body}</span>
              </p>
              <div className="flex flex-wrap gap-4 mt-2">
                <Link
                  to="/signup"
                  className="gold-shimmer-bg font-barlow-condensed uppercase inline-flex items-center justify-center gap-2 transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em', paddingTop: '17px', paddingBottom: '17px', paddingLeft: '44px', paddingRight: '44px', borderRadius: '3px', color: navy, outlineColor: gold }}
                >
                  <span>{veterans.cta.primaryCta}</span>
                  <ChevronRight size={13} />
                </Link>
                <Link
                  to="/jobs"
                  className="font-barlow-condensed uppercase inline-flex items-center justify-center gap-2 transition-all hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em', paddingTop: '16px', paddingBottom: '16px', paddingLeft: '40px', paddingRight: '40px', borderRadius: '3px', border: goldBorder35, color: ice60, outlineColor: gold }}
                >
                  <span>{veterans.cta.secondaryCta}</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
