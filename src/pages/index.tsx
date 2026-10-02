import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { home } from 'virtual:content';
import { ContentListContext } from '@airo/content';
import { Shield, ChevronRight, ChevronLeft, Pause, Play, ChevronDown } from 'lucide-react';
import BrandMark from '@/components/BrandMark';
import TechBackdrop from '@/components/TechBackdrop';
import UpcomingEvents from '@/components/UpcomingEvents';

const siteUrl = 'https://www.norvarden.com';

// ─── Design tokens ────────────────────────────────────────────────────────
const navy       = 'hsl(var(--hero-navy))';
const gold       = 'hsl(var(--hero-gold))';
const white      = 'hsl(var(--hero-white))';
const ice        = 'hsl(var(--hero-ice))';
const ice60      = 'hsl(var(--hero-ice-60))';
const cardBg     = 'hsl(var(--hero-card-bg))';
const goldBorder35 = '1px solid hsl(var(--hero-gold) / 0.35)';
const goldGrad   = `linear-gradient(to right, transparent, ${gold} 30%, ${gold} 70%, transparent)`;

// ─── Hairline ─────────────────────────────────────────────────────────────
function Hairline({ className = '' }: { className?: string }) {
  return <div className={className} style={{ height: '1px', background: goldGrad }} aria-hidden="true" />;
}

// ─── Main page ────────────────────────────────────────────────────────────
export default function HomePage() {
  const [activeStory, setActiveStory]   = useState(0);
  const [paused, setPaused]             = useState(false);
  const [faqOpen, setFaqOpen]           = useState<Record<string, boolean>>({});
  const prefersReduced                  = useRef(false);
  const storyTimer                      = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    prefersReduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Story auto-advance
  useEffect(() => {
    if (paused || prefersReduced.current) return;
    storyTimer.current = setInterval(() => setActiveStory(s => (s + 1) % home.stories.length), 5000);
    return () => { if (storyTimer.current) clearInterval(storyTimer.current); };
  }, [paused]);

  function togglePause() {
    setPaused(p => {
      const next = !p;
      if (!next) return next;
      if (storyTimer.current)  clearInterval(storyTimer.current);
      return next;
    });
  }

  function prevStory() { setActiveStory(s => (s - 1 + home.stories.length) % home.stories.length); }
  function nextStory() { setActiveStory(s => (s + 1) % home.stories.length); }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': `${siteUrl}/#website`, url: siteUrl, name: 'NORVARDEN' },
      { '@type': 'Organization', '@id': `${siteUrl}/#organization`, name: 'NORVARDEN', url: siteUrl, email: 'info@norvarden.com' },
      { '@type': 'WebPage', '@id': `${siteUrl}/#webpage`, url: siteUrl, name: home.meta.title, isPartOf: { '@id': `${siteUrl}/#website` } },
    ],
  };

  return (
    <>
      <Helmet>
        <title>{home.meta.title}</title>
        <meta name="description" content={home.meta.description} />
        <link rel="canonical" href={siteUrl} />
        <meta property="og:title" content={home.meta.title} />
        <meta property="og:description" content={home.meta.description} />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={`${siteUrl}/images/og-norvarden.jpg`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="NORVARDEN — Another Way Forward" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>
      </Helmet>

      <main style={{ background: navy }}>

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden" style={{ minHeight: '100vh' }} aria-label="Hero">

          <TechBackdrop />

          <div
            className="absolute bottom-0 left-0 right-0 pointer-events-none"
            style={{ height: '200px', background: `linear-gradient(to top, ${navy} 0%, transparent 100%)` }}
            aria-hidden="true"
          />

          {/* Content grid */}
          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12 px-6 md:px-12 lg:px-16 pt-32 pb-20 max-w-7xl mx-auto min-h-screen">

            {/* Left: headline + CTA */}
            <div className="flex-1 flex flex-col gap-6 max-w-xl">
              <div className="flex flex-col items-start gap-4">
                <BrandMark size={26} tagline />
              </div>
              <Hairline className="w-24" />
              <h1
                className="font-bodoni"
                style={{ fontSize: 'clamp(2.6rem, 5.5vw, 5rem)', fontWeight: 400, lineHeight: 1.04, letterSpacing: '-0.01em', color: white }}
              >
                <span>{home.hero.headline}</span>{' '}
                <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>
                  <span>{home.hero.headlineGold}</span>
                </em>
              </h1>
              <p className="font-barlow" style={{ fontSize: '17px', fontWeight: 300, lineHeight: 1.8, color: ice60, maxWidth: '480px' }}>
                <span>{home.hero.subheadline}</span>
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-5 mt-2">
                <Link
                  to="/signup"
                  className="gold-shimmer-bg font-barlow-condensed uppercase inline-flex items-center gap-2 transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em', paddingTop: '17px', paddingBottom: '17px', paddingLeft: '44px', paddingRight: '44px', borderRadius: '3px', color: navy, outlineColor: gold }}
                >
                  <span>{home.hero.primaryCta}</span>
                  <ChevronRight size={13} />
                </Link>
                <Link
                  to="/jobs"
                  className="font-barlow transition-opacity hover:opacity-70"
                  style={{ fontSize: '15px', fontWeight: 300, color: ice60, letterSpacing: '0.01em' }}
                >
                  <span>{home.hero.secondaryCta}</span>
                </Link>
              </div>

              {/* Badges */}
              <ContentListContext field="home.hero.badges">
                <div className="flex flex-wrap gap-2 mt-1">
                  {home.hero.badges.map((badge) => (
                    <span
                      key={badge.id}
                      className="font-barlow-condensed uppercase"
                      style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.28em', padding: '5px 10px', border: goldBorder35, borderRadius: '3px', color: gold, background: 'hsl(var(--hero-gold) / 0.08)' }}
                    >
                      <Shield size={8} strokeWidth={2.5} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
                      {badge.label}
                    </span>
                  ))}
                </div>
              </ContentListContext>
            </div>

            {/* Right: story card */}
            <div
              className="w-full lg:w-80 xl:w-96 flex flex-col gap-0 shrink-0"
              style={{ border: goldBorder35, borderRadius: '3px', background: cardBg, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
            >
              {/* Progress dashes */}
              <div className="flex gap-1 px-5 pt-5">
                {home.stories.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveStory(i)}
                    aria-label={`Story ${i + 1}`}
                    style={{
                      flex: 1, height: '2px', borderRadius: '1px', border: 'none', cursor: 'pointer',
                      background: i === activeStory
                        ? gold
                        : i < activeStory
                          ? 'hsl(var(--hero-gold) / 0.60)'
                          : 'hsl(var(--hero-gold) / 0.20)',
                      transition: 'background 0.3s',
                    }}
                  />
                ))}
              </div>

              {/* Story body */}
              <div className="px-6 py-6 flex flex-col gap-3" style={{ minHeight: '180px' }}>
                <h2 className="font-bodoni" style={{ fontSize: '20px', fontWeight: 400, lineHeight: 1.1, color: white }}>
                  {home.stories[activeStory].heading}
                </h2>
                <p className="font-barlow" style={{ fontSize: '15px', fontWeight: 300, lineHeight: 1.75, color: ice60 }}>
                  {home.stories[activeStory].body}
                  {home.stories[activeStory].highlight ? (
                    <>
                      {' '}
                      <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>
                        {home.stories[activeStory].highlight}
                      </em>
                    </>
                  ) : null}
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between px-5 pb-5 pt-2" style={{ borderTop: '1px solid hsl(var(--hero-gold) / 0.15)' }}>
                <div className="flex gap-2">
                  <button
                    onClick={prevStory}
                    aria-label="Previous story"
                    className="flex items-center justify-center transition-opacity hover:opacity-70"
                    style={{ width: '28px', height: '28px', borderRadius: '50%', border: goldBorder35, background: 'transparent', color: gold, cursor: 'pointer' }}
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <button
                    onClick={nextStory}
                    aria-label="Next story"
                    className="flex items-center justify-center transition-opacity hover:opacity-70"
                    style={{ width: '28px', height: '28px', borderRadius: '50%', border: goldBorder35, background: 'transparent', color: gold, cursor: 'pointer' }}
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
                <button
                  onClick={togglePause}
                  aria-label={paused ? 'Resume slideshow' : 'Pause slideshow'}
                  className="flex items-center justify-center transition-opacity hover:opacity-70"
                  style={{ width: '28px', height: '28px', borderRadius: '50%', border: goldBorder35, background: 'transparent', color: gold, cursor: 'pointer' }}
                >
                  {paused ? <Play size={11} /> : <Pause size={11} />}
                </button>
              </div>
            </div>

          </div>
        </section>

        <UpcomingEvents />

        {/* ── TRUST STRIP ───────────────────────────────────────────────── */}
        <section className="px-6 md:px-12 lg:px-16 py-16 max-w-7xl mx-auto" aria-label="Trust highlights">
          <ContentListContext field="home.trustStrip">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px" style={{ border: goldBorder35, borderRadius: '3px', overflow: 'hidden' }}>
              {home.trustStrip.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 p-6"
                  style={{ background: cardBg, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                >
                  <span className="font-barlow-condensed uppercase" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.30em', color: gold }}>
                    {item.label}
                  </span>
                  <p className="font-barlow" style={{ fontSize: '14px', fontWeight: 300, lineHeight: 1.65, color: ice60 }}>
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </ContentListContext>
        </section>

        <div className="px-6 md:px-12 lg:px-16 max-w-7xl mx-auto"><Hairline /></div>

        {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
        <section className="px-6 md:px-12 lg:px-16 py-24 max-w-7xl mx-auto" aria-label="How it works">
          <div className="mb-14 flex flex-col gap-4 max-w-2xl">
            <p className="font-barlow-condensed uppercase" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.36em', color: gold }}>
              <span>{home.howItWorks.eyebrow}</span>
            </p>
            <Hairline className="w-24" />
            <h2 className="font-bodoni" style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.01em', color: white }}>
              <span>{home.howItWorks.headline}</span>{' '}
              <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>
                <span>{home.howItWorks.headlineGold}</span>
              </em>
            </h2>
          </div>
          <ContentListContext field="home.howItWorks.steps">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {home.howItWorks.steps.map((step) => (
                <div
                  key={step.id}
                  className="flex flex-col gap-4 p-7"
                  style={{ background: cardBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: goldBorder35, borderRadius: '3px' }}
                >
                  <span className="font-bodoni" style={{ fontSize: '2.5rem', fontWeight: 400, lineHeight: 1, color: 'hsl(var(--hero-gold) / 0.25)' }}>
                    {step.number}
                  </span>
                  <h3 className="font-bodoni" style={{ fontSize: '20px', fontWeight: 400, lineHeight: 1.1, color: white }}>
                    {step.title}
                  </h3>
                  <p className="font-barlow" style={{ fontSize: '15px', fontWeight: 300, lineHeight: 1.75, color: ice60 }}>
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </ContentListContext>
        </section>

        <div className="px-6 md:px-12 lg:px-16 max-w-7xl mx-auto"><Hairline /></div>

        {/* ── WHO IT'S FOR ──────────────────────────────────────────────── */}
        <section className="px-6 md:px-12 lg:px-16 py-24 max-w-7xl mx-auto" aria-label="Who it's for">
          <div className="mb-14 flex flex-col gap-4 max-w-2xl">
            <p className="font-barlow-condensed uppercase" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.36em', color: gold }}>
              <span>{home.whoItsFor.eyebrow}</span>
            </p>
            <Hairline className="w-24" />
            <h2 className="font-bodoni" style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.01em', color: white }}>
              <span>{home.whoItsFor.headline}</span>{' '}
              <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>
                <span>{home.whoItsFor.headlineGold}</span>
              </em>
            </h2>
          </div>
          <ContentListContext field="home.whoItsFor.cards">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {home.whoItsFor.cards.map((card) => (
                <div
                  key={card.id}
                  className="flex flex-col gap-4 p-7"
                  style={{ background: cardBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: goldBorder35, borderRadius: '3px' }}
                >
                  <span className="font-barlow-condensed uppercase" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em', color: gold }}>
                    {card.label}
                  </span>
                  <h3 className="font-bodoni" style={{ fontSize: '20px', fontWeight: 400, lineHeight: 1.1, color: white }}>
                    {card.title}
                  </h3>
                  <p className="font-barlow" style={{ fontSize: '15px', fontWeight: 300, lineHeight: 1.75, color: ice60 }}>
                    {card.body}
                  </p>
                </div>
              ))}
            </div>
          </ContentListContext>
        </section>

        {/* ── JOB SEEKERS BAND ────────────────────────────────────────────── */}
        <section className="relative overflow-hidden" aria-label="Job seekers">
          <div
            className="absolute inset-0"
            aria-hidden="true"
            style={{
              backgroundImage: 'linear-gradient(hsl(210 30% 80% / 0.06) 1px, transparent 1px), linear-gradient(90deg, hsl(210 30% 80% / 0.06) 1px, transparent 1px), radial-gradient(ellipse 60% 80% at 85% 50%, hsl(36 40% 66% / 0.12), transparent 70%)',
              backgroundSize: '48px 48px, 48px 48px, 100% 100%',
              background: undefined,
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `linear-gradient(to right, hsl(var(--hero-navy-85)) 0%, hsl(var(--hero-navy-72)) 60%, hsl(var(--hero-navy-55)) 100%)` }}
            aria-hidden="true"
          />
          <div className="relative z-10 px-6 md:px-12 lg:px-16 py-24 max-w-7xl mx-auto">
            <div className="max-w-xl flex flex-col gap-6">
              <p className="font-barlow-condensed uppercase" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.36em', color: gold }}>
                <span>{home.athletesBand.eyebrow}</span>
              </p>
              <Hairline className="w-24" />
              <h2 className="font-bodoni" style={{ fontSize: 'clamp(2rem, 3.5vw, 3.5rem)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.01em', color: white }}>
                <span>{home.athletesBand.headline}</span>{' '}
                <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>
                  <span>{home.athletesBand.headlineGold}</span>
                </em>
              </h2>
              <p className="font-barlow" style={{ fontSize: '17px', fontWeight: 300, lineHeight: 1.8, color: ice60 }}>
                <span>{home.athletesBand.body}</span>
              </p>
              <ContentListContext field="home.athletesBand.badges">
                <div className="flex flex-wrap gap-2">
                  {home.athletesBand.badges.map((badge) => (
                    <span
                      key={badge.id}
                      className="font-barlow-condensed uppercase"
                      style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.28em', padding: '5px 10px', border: goldBorder35, borderRadius: '3px', color: gold, background: 'hsl(var(--hero-gold) / 0.08)' }}
                    >
                      <Shield size={8} strokeWidth={2.5} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
                      {badge.label}
                    </span>
                  ))}
                </div>
              </ContentListContext>
              <Link
                to="/jobs"
                className="font-barlow-condensed uppercase inline-flex items-center gap-2 self-start transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em', paddingTop: '16px', paddingBottom: '16px', paddingLeft: '36px', paddingRight: '36px', borderRadius: '3px', border: goldBorder35, color: ice, outlineColor: gold }}
              >
                <span>{home.athletesBand.cta}</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── STUDENTS BAND ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden" aria-label="Students and early career">
          <div
            className="absolute inset-0"
            aria-hidden="true"
            style={{
              backgroundImage: 'linear-gradient(hsl(210 30% 80% / 0.06) 1px, transparent 1px), linear-gradient(90deg, hsl(210 30% 80% / 0.06) 1px, transparent 1px), radial-gradient(ellipse 60% 80% at 85% 50%, hsl(36 40% 66% / 0.12), transparent 70%)',
              backgroundSize: '48px 48px, 48px 48px, 100% 100%',
              background: undefined,
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `linear-gradient(to right, hsl(var(--hero-navy-85)) 0%, hsl(var(--hero-navy-72)) 60%, hsl(var(--hero-navy-55)) 100%)` }}
            aria-hidden="true"
          />
          <div className="relative z-10 px-6 md:px-12 lg:px-16 py-24 max-w-7xl mx-auto">
            <div className="max-w-xl flex flex-col gap-6">
              <p className="font-barlow-condensed uppercase" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.36em', color: gold }}>
                <span>{home.coachesBand.eyebrow}</span>
              </p>
              <Hairline className="w-24" />
              <h2 className="font-bodoni" style={{ fontSize: 'clamp(2rem, 3.5vw, 3.5rem)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.01em', color: white }}>
                <span>{home.coachesBand.headline}</span>{' '}
                <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>
                  <span>{home.coachesBand.headlineGold}</span>
                </em>
              </h2>
              <p className="font-barlow" style={{ fontSize: '17px', fontWeight: 300, lineHeight: 1.8, color: ice60 }}>
                <span>{home.coachesBand.body}</span>
              </p>
              <ContentListContext field="home.coachesBand.badges">
                <div className="flex flex-wrap gap-2">
                  {home.coachesBand.badges.map((badge) => (
                    <span
                      key={badge.id}
                      className="font-barlow-condensed uppercase"
                      style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.28em', padding: '5px 10px', border: goldBorder35, borderRadius: '3px', color: gold, background: 'hsl(var(--hero-gold) / 0.08)' }}
                    >
                      <Shield size={8} strokeWidth={2.5} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
                      {badge.label}
                    </span>
                  ))}
                </div>
              </ContentListContext>
              <Link
                to="/resources"
                className="font-barlow-condensed uppercase inline-flex items-center gap-2 self-start transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em', paddingTop: '16px', paddingBottom: '16px', paddingLeft: '36px', paddingRight: '36px', borderRadius: '3px', border: goldBorder35, color: ice, outlineColor: gold }}
              >
                <span>{home.coachesBand.cta}</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── VETERANS BAND ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden" aria-label="Veterans">
          <div
            className="absolute inset-0"
            aria-hidden="true"
            style={{
              backgroundImage: 'linear-gradient(hsl(210 30% 80% / 0.06) 1px, transparent 1px), linear-gradient(90deg, hsl(210 30% 80% / 0.06) 1px, transparent 1px), radial-gradient(ellipse 60% 80% at 85% 50%, hsl(36 40% 66% / 0.12), transparent 70%)',
              backgroundSize: '48px 48px, 48px 48px, 100% 100%',
              background: undefined,
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `linear-gradient(to right, hsl(var(--hero-navy-85)) 0%, hsl(var(--hero-navy-72)) 60%, hsl(var(--hero-navy-55)) 100%)` }}
            aria-hidden="true"
          />
          <div className="relative z-10 px-6 md:px-12 lg:px-16 py-24 max-w-7xl mx-auto">
            <div className="max-w-xl flex flex-col gap-6">
              <p className="font-barlow-condensed uppercase" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.36em', color: gold }}>
                <span>{home.veteransBand.eyebrow}</span>
              </p>
              <Hairline className="w-24" />
              <h2 className="font-bodoni" style={{ fontSize: 'clamp(2rem, 3.5vw, 3.5rem)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.01em', color: white }}>
                <span>{home.veteransBand.headline}</span>{' '}
                <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>
                  <span>{home.veteransBand.headlineGold}</span>
                </em>
              </h2>
              <p className="font-barlow" style={{ fontSize: '17px', fontWeight: 300, lineHeight: 1.8, color: ice60 }}>
                <span>{home.veteransBand.body}</span>
              </p>
              <Link
                to="/veterans"
                className="font-barlow-condensed uppercase inline-flex items-center gap-2 self-start transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em', paddingTop: '16px', paddingBottom: '16px', paddingLeft: '36px', paddingRight: '36px', borderRadius: '3px', border: goldBorder35, color: ice, outlineColor: gold }}
              >
                <span>{home.veteransBand.cta}</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── FOR COMPANIES BAND ────────────────────────────────────────── */}
        <section
          className="px-6 md:px-12 lg:px-16 py-14 max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
          aria-label="For companies"
          style={{ borderTop: '1px solid hsl(var(--hero-gold) / 0.20)', borderBottom: '1px solid hsl(var(--hero-gold) / 0.20)' }}
        >
          <div className="flex flex-col gap-2">
            <p className="font-barlow-condensed uppercase" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.32em', color: 'hsl(var(--hero-gold) / 0.60)' }}>
              <span>{home.forCompaniesBand.eyebrow}</span>
            </p>
            <p className="font-bodoni" style={{ fontSize: 'clamp(1.2rem, 2vw, 1.6rem)', fontWeight: 400, lineHeight: 1.2, color: white }}>
              <span>{home.forCompaniesBand.headline}</span>
            </p>
          </div>
          <Link
            to="/for-companies"
            className="font-barlow-condensed uppercase inline-flex items-center gap-2 shrink-0 transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em', paddingTop: '16px', paddingBottom: '16px', paddingLeft: '36px', paddingRight: '36px', borderRadius: '3px', border: goldBorder35, color: ice60, outlineColor: gold }}
          >
            <span>{home.forCompaniesBand.cta}</span>
          </Link>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────────────── */}
        <section className="px-6 md:px-12 lg:px-16 py-24 max-w-7xl mx-auto" aria-label="FAQ">
          <div className="mb-14 flex flex-col gap-4 max-w-2xl">
            <p className="font-barlow-condensed uppercase" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.36em', color: gold }}>
              <span>{home.faq.eyebrow}</span>
            </p>
            <Hairline className="w-24" />
            <h2 className="font-bodoni" style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.01em', color: white }}>
              <span>{home.faq.headline}</span>{' '}
              <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>
                <span>{home.faq.headlineGold}</span>
              </em>
            </h2>
          </div>
          <div className="max-w-2xl" style={{ borderTop: '1px solid hsl(var(--hero-gold) / 0.20)' }}>
            <ContentListContext field="home.faq.items">
              {home.faq.items.map((item) => (
                <div key={item.id} style={{ borderBottom: '1px solid hsl(var(--hero-gold) / 0.20)' }}>
                  <button
                    onClick={() => setFaqOpen(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
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
        <section className="relative overflow-hidden" aria-label="Join free">
          <div
            className="absolute inset-0"
            aria-hidden="true"
            style={{
              backgroundImage: 'linear-gradient(hsl(210 30% 80% / 0.06) 1px, transparent 1px), linear-gradient(90deg, hsl(210 30% 80% / 0.06) 1px, transparent 1px), radial-gradient(ellipse 60% 80% at 85% 50%, hsl(36 40% 66% / 0.12), transparent 70%)',
              backgroundSize: '48px 48px, 48px 48px, 100% 100%',
              background: undefined,
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `linear-gradient(to right, hsl(var(--hero-navy-85)) 0%, hsl(var(--hero-navy-80)) 50%, hsl(var(--hero-navy-72)) 100%)` }}
            aria-hidden="true"
          />
          <div className="relative z-10 px-6 md:px-12 lg:px-16 py-28 max-w-7xl mx-auto">
            <div className="max-w-xl flex flex-col gap-6">
              <Hairline className="w-24" />
              <h2 className="font-bodoni" style={{ fontSize: 'clamp(2.4rem, 5vw, 4.5rem)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.01em', color: white }}>
                <span>{home.closingBand.headline}</span>{' '}
                <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>
                  <span>{home.closingBand.headlineGold}</span>
                </em>
              </h2>
              <Link
                to="/signup"
                className="gold-shimmer-bg font-barlow-condensed uppercase inline-flex items-center self-start gap-2 transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em', paddingTop: '17px', paddingBottom: '17px', paddingLeft: '44px', paddingRight: '44px', borderRadius: '3px', color: navy, outlineColor: gold }}
              >
                <span>{home.closingBand.cta}</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
