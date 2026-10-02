import { coaches } from 'virtual:content';
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
const goldBorder35 = '1px solid hsl(var(--hero-gold) / 0.35)';
const cardBg       = 'hsl(var(--hero-card-bg))';
const goldGradient = `linear-gradient(to right, transparent, ${gold} 30%, ${gold} 70%, transparent)`;

// ─── Hairline ─────────────────────────────────────────────────────────────
function Hairline({ className = '' }: { className?: string }) {
  return (
    <div className={className} style={{ height: '1px', background: goldGradient }} aria-hidden="true" />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────
export default function CoachesPage() {
  const pageUrl = `${siteUrl}/coaches`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${pageUrl}#webpage`,
    url: pageUrl,
    name: coaches.meta.title,
    isPartOf: { '@id': `${siteUrl}/#website` },
    about: { '@id': `${siteUrl}/#organization` },
  };

  return (
    <>
      <Helmet>
        <title>{coaches.meta.title}</title>
        <meta name="description" content={coaches.meta.description} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content={coaches.meta.title} />
        <meta property="og:description" content={coaches.meta.description} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>
      </Helmet>

      <main style={{ background: navy }}>

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section
          className="relative flex items-end overflow-hidden"
          style={{ minHeight: '45vh' }}
          aria-label="Coaches hero"
        >
          {/* Track photo */}
          <div
            className="bg-photo active"
            role="img"
            aria-label="Running track and stadium lights at sunset"
            style={{ backgroundImage: 'url(/images/track-sunset.jpg)' }}
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
            <p
              className="font-barlow-condensed uppercase mb-4"
              style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.36em', color: gold }}
            >
              <span>{coaches.hero.eyebrow}</span>
            </p>
            <div className="mb-5 w-24" style={{ height: '1px', background: gold }} aria-hidden="true" />
            <h1
              className="font-bodoni"
              style={{
                fontSize: 'clamp(2.4rem, 5vw, 4.5rem)',
                fontWeight: 400,
                lineHeight: 1.05,
                letterSpacing: '-0.01em',
                color: white,
                maxWidth: '700px',
              }}
            >
              <span>{coaches.hero.headline}</span>{' '}
              <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>
                <span>{coaches.hero.headlineGold}</span>
              </em>
            </h1>
          </div>
        </section>

        {/* ── SUBHEADLINE ───────────────────────────────────────────────── */}
        <div className="px-6 md:px-12 lg:px-16 pt-10 pb-2 max-w-7xl mx-auto">
          <p
            className="font-barlow"
            style={{ fontSize: '18px', fontWeight: 300, lineHeight: 1.8, color: ice60, maxWidth: '640px' }}
          >
            <span>{coaches.hero.subheadline}</span>
          </p>
        </div>

        {/* ── WHAT REP | IV OFFERS ─────────────────────────────────────── */}
        <section
          className="px-6 md:px-12 lg:px-16 py-24 max-w-7xl mx-auto"
          aria-label="What REP | IV offers coaches"
        >
          <div className="mb-14 flex flex-col gap-4 max-w-2xl">
            <p
              className="font-barlow-condensed uppercase"
              style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.36em', color: gold }}
            >
              <span>{coaches.whatWeOffer.eyebrow}</span>
            </p>
            <Hairline className="w-24" />
            <h2
              className="font-bodoni"
              style={{
                fontSize: 'clamp(2rem, 3.5vw, 3rem)',
                fontWeight: 400,
                lineHeight: 1.05,
                letterSpacing: '-0.01em',
                color: white,
              }}
            >
              <span>{coaches.whatWeOffer.headline}</span>{' '}
              <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>
                <span>{coaches.whatWeOffer.headlineGold}</span>
              </em>
            </h2>
          </div>

          <ContentListContext field="coaches.whatWeOffer.items">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {coaches.whatWeOffer.items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 p-7"
                  style={{
                    background: cardBg,
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: goldBorder35,
                    borderRadius: '3px',
                  }}
                >
                  <span
                    className="font-bodoni"
                    style={{ fontSize: '2.5rem', fontWeight: 400, lineHeight: 1, color: 'hsl(var(--hero-gold) / 0.22)' }}
                  >
                    {item.number}
                  </span>
                  <h3
                    className="font-bodoni"
                    style={{ fontSize: '20px', fontWeight: 400, lineHeight: 1.1, color: white }}
                  >
                    {item.title}
                  </h3>
                  <p
                    className="font-barlow"
                    style={{ fontSize: '15px', fontWeight: 300, lineHeight: 1.75, color: ice60 }}
                  >
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

        {/* ── WHO CAN JOIN ──────────────────────────────────────────────── */}
        <section
          className="px-6 md:px-12 lg:px-16 py-24 max-w-7xl mx-auto"
          aria-label="Who can join"
        >
          <div className="flex flex-col lg:flex-row gap-16">
            {/* Sticky left label */}
            <div className="lg:w-72 shrink-0 flex flex-col gap-4 lg:sticky lg:top-28 lg:self-start">
              <p
                className="font-barlow-condensed uppercase"
                style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.36em', color: gold }}
              >
                <span>{coaches.whoCanJoin.eyebrow}</span>
              </p>
              <Hairline className="w-24" />
              <h2
                className="font-bodoni"
                style={{
                  fontSize: 'clamp(1.8rem, 3vw, 2.6rem)',
                  fontWeight: 400,
                  lineHeight: 1.05,
                  letterSpacing: '-0.01em',
                  color: white,
                }}
              >
                <span>{coaches.whoCanJoin.headline}</span>{' '}
                <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>
                  <span>{coaches.whoCanJoin.headlineGold}</span>
                </em>
              </h2>
            </div>

            {/* Right content */}
            <div className="flex-1">
              <div
                className="p-7 flex flex-col gap-5"
                style={{
                  background: cardBg,
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: goldBorder35,
                  borderRadius: '3px',
                }}
              >
                <p
                  className="font-barlow"
                  style={{ fontSize: '16px', fontWeight: 300, lineHeight: 1.8, color: ice60 }}
                >
                  <span>{coaches.whoCanJoin.body}</span>
                </p>
                <div style={{ height: '1px', background: 'hsl(var(--hero-gold) / 0.20)' }} aria-hidden="true" />
                <div className="flex items-start gap-3">
                  <Shield
                    size={14}
                    strokeWidth={2}
                    style={{ color: gold, marginTop: '3px', flexShrink: 0 }}
                    aria-hidden="true"
                  />
                  <p
                    className="font-barlow-condensed uppercase"
                    style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.28em', color: gold, lineHeight: 1.6 }}
                  >
                    <span>{coaches.whoCanJoin.note}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
          <Hairline />
        </div>

        {/* ── ROLES ─────────────────────────────────────────────────────── */}
        <section
          className="px-6 md:px-12 lg:px-16 py-24 max-w-7xl mx-auto"
          aria-label="Roles to explore"
        >
          <div className="mb-14 flex flex-col gap-4 max-w-2xl">
            <p
              className="font-barlow-condensed uppercase"
              style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.36em', color: gold }}
            >
              <span>{coaches.roles.eyebrow}</span>
            </p>
            <Hairline className="w-24" />
            <h2
              className="font-bodoni"
              style={{
                fontSize: 'clamp(2rem, 3.5vw, 3rem)',
                fontWeight: 400,
                lineHeight: 1.05,
                letterSpacing: '-0.01em',
                color: white,
              }}
            >
              <span>{coaches.roles.headline}</span>{' '}
              <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>
                <span>{coaches.roles.headlineGold}</span>
              </em>
            </h2>
            <p
              className="font-barlow"
              style={{ fontSize: '16px', fontWeight: 300, lineHeight: 1.75, color: ice60 }}
            >
              <span>{coaches.roles.body}</span>
            </p>
          </div>

          <ContentListContext field="coaches.roles.tags">
            <div className="flex flex-wrap gap-3" role="group" aria-label="Coaching roles">
              {coaches.roles.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="font-barlow-condensed uppercase"
                  style={{
                    fontSize: '10px',
                    fontWeight: 500,
                    letterSpacing: '0.30em',
                    padding: '9px 16px',
                    border: goldBorder35,
                    borderRadius: '3px',
                    color: gold,
                    background: 'hsl(var(--hero-gold) / 0.07)',
                  }}
                >
                  {tag.label}
                </span>
              ))}
            </div>
          </ContentListContext>
        </section>

        {/* ── NEVER PAY TO PLAY ─────────────────────────────────────────── */}
        <section className="relative overflow-hidden" aria-label="Never pay to play">
          <div
            className="bg-photo active"
            role="img"
            aria-label="Outdoor basketball court at night with the city skyline behind it"
            style={{ backgroundImage: 'url(/images/hero-court-night.jpg)' }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `linear-gradient(to right, hsl(var(--hero-navy-85)) 0%, hsl(var(--hero-navy-72)) 60%, hsl(var(--hero-navy-55)) 100%)` }}
            aria-hidden="true"
          />
          <div className="relative z-10 px-6 md:px-12 lg:px-16 py-24 max-w-7xl mx-auto">
            <div className="max-w-xl flex flex-col gap-6">
              <p
                className="font-barlow-condensed uppercase"
                style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.36em', color: gold }}
              >
                <span>{coaches.neverPay.eyebrow}</span>
              </p>
              <Hairline className="w-24" />
              <h2
                className="font-bodoni"
                style={{
                  fontSize: 'clamp(2rem, 3.5vw, 3.5rem)',
                  fontWeight: 400,
                  lineHeight: 1.05,
                  letterSpacing: '-0.01em',
                  color: white,
                }}
              >
                <span>{coaches.neverPay.headline}</span>{' '}
                <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>
                  <span>{coaches.neverPay.headlineGold}</span>
                </em>
              </h2>
              <p
                className="font-barlow"
                style={{ fontSize: '17px', fontWeight: 300, lineHeight: 1.8, color: ice60 }}
              >
                <span>{coaches.neverPay.body}</span>
              </p>
              {/* Warning panel */}
              <div
                className="flex items-start gap-4 p-5"
                style={{
                  border: '1px solid hsl(var(--hero-gold) / 0.50)',
                  borderRadius: '3px',
                  background: 'hsl(var(--hero-gold) / 0.07)',
                }}
              >
                <AlertTriangle
                  size={16}
                  strokeWidth={2}
                  style={{ color: gold, marginTop: '2px', flexShrink: 0 }}
                  aria-hidden="true"
                />
                <p
                  className="font-barlow"
                  style={{ fontSize: '14px', fontWeight: 300, lineHeight: 1.7, color: ice60 }}
                >
                  If anyone asks you for money — for access, applications, certifications or anything else — report it immediately. We investigate every report.
                </p>
              </div>
              <Link
                to="/trust"
                className="font-barlow-condensed uppercase inline-flex items-center gap-2 self-start transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  letterSpacing: '0.32em',
                  paddingTop: '16px',
                  paddingBottom: '16px',
                  paddingLeft: '36px',
                  paddingRight: '36px',
                  borderRadius: '3px',
                  border: goldBorder35,
                  color: ice,
                  outlineColor: gold,
                }}
              >
                <span>{coaches.neverPay.reportCta}</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── CLOSING CTA ───────────────────────────────────────────────── */}
        <section
          className="px-6 md:px-12 lg:px-16 py-24 max-w-7xl mx-auto flex flex-col items-start gap-8"
          aria-label="Join free"
        >
          <Hairline className="w-full" />
          <div className="flex flex-wrap items-center gap-6 pt-4">
            <Link
              to="/signup"
              className="gold-shimmer-bg font-barlow-condensed uppercase inline-flex items-center gap-2 transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.32em',
                paddingTop: '17px',
                paddingBottom: '17px',
                paddingLeft: '44px',
                paddingRight: '44px',
                borderRadius: '3px',
                color: navy,
                outlineColor: gold,
              }}
            >
              <span>{coaches.cta.primaryLabel}</span>
              <ChevronRight size={13} />
            </Link>
            <Link
              to="/jobs"
              className="font-barlow transition-opacity hover:opacity-70"
              style={{ fontSize: '15px', fontWeight: 300, color: ice60, letterSpacing: '0.01em' }}
            >
              <span>{coaches.cta.secondaryLabel}</span>
            </Link>
          </div>
        </section>

      </main>
    </>
  );
}
