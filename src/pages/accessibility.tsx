/**
 * /accessibility — NORVARDEN's accessibility statement: the standard we build
 * to, what we test with, known limits, and how to report a barrier.
 */
import { Link } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { CheckCircle2, Mail } from 'lucide-react';

const siteUrl = 'https://www.norvarden.com';
const navy    = 'hsl(var(--hero-navy))';
const navyMid = 'hsl(var(--hero-navy-mid))';
const gold    = 'hsl(var(--hero-gold))';
const white   = 'hsl(var(--hero-white))';
const ice60   = 'hsl(var(--hero-ice-60))';
const border  = '1px solid hsl(var(--hero-gold) / 0.2)';
const eyebrow = { fontSize: '12px', fontWeight: 600, letterSpacing: '0.28em', color: gold } as const;
const body    = { fontSize: '17px', lineHeight: 1.75, color: ice60 } as const;

const FEATURES = [
  'Works with a keyboard alone, with a visible focus outline on every control',
  'Built and tested with screen readers (VoiceOver, NVDA) and voice control',
  'Readable at 200% zoom and on small screens without sideways scrolling',
  'High-contrast text and the Atkinson Hyperlegible typeface, designed for low vision',
  'Moving content can be paused, and stops entirely if your device asks for reduced motion',
  'Form fields have visible labels and clear error messages',
  'Images have text alternatives; decorative images are hidden from screen readers',
];

export default function AccessibilityPage() {
  return (
    <>
      <Helmet>
        <title>Accessibility Statement — NORVARDEN</title>
        <meta name="description" content="NORVARDEN's accessibility commitment: built to WCAG 2.2 AA, tested with assistive technology, and how to report a barrier." />
        <link rel="canonical" href={`${siteUrl}/accessibility`} />
        <meta property="og:title" content="Accessibility Statement — NORVARDEN" />
        <meta property="og:url" content={`${siteUrl}/accessibility`} />
      </Helmet>

      <main className="min-h-screen px-6 md:px-12 lg:px-16 pt-32 pb-24" style={{ background: navy }}>
        <div className="max-w-3xl mx-auto flex flex-col gap-14">
          <header className="flex flex-col gap-5">
            <p className="font-barlow-condensed uppercase" style={eyebrow}>Accessibility statement</p>
            <h1 className="font-bodoni" style={{ fontSize: 'clamp(2.1rem, 4.5vw, 3.2rem)', lineHeight: 1.1, color: white }}>
              Built for everyone, <em className="gold-shimmer">from the ground up.</em>
            </h1>
            <p className="font-barlow" style={body}>
              NORVARDEN exists to connect people with disabilities to inclusive employers, so the platform itself has to work for
              every person who uses it. Accessibility is part of how we design, build and test every page, not an afterthought.
            </p>
          </header>

          <section className="flex flex-col gap-4" aria-labelledby="standard">
            <h2 id="standard" className="font-barlow-condensed uppercase" style={eyebrow}>Our standard</h2>
            <p className="font-barlow" style={body}>
              We aim to meet the <strong style={{ color: white }}>Web Content Accessibility Guidelines (WCAG) 2.2, Level AA</strong>.
              We check pages with automated tools and with manual testing using assistive technology before changes go live.
            </p>
          </section>

          <section className="flex flex-col gap-5" aria-labelledby="features">
            <h2 id="features" className="font-barlow-condensed uppercase" style={eyebrow}>What we support</h2>
            <ul className="flex flex-col gap-3">
              {FEATURES.map((f) => (
                <li key={f} className="flex gap-3 p-4 rounded-md font-barlow" style={{ background: navyMid, border, fontSize: '16px', lineHeight: 1.6, color: white }}>
                  <CheckCircle2 size={18} className="shrink-0" style={{ color: gold, marginTop: '3px' }} aria-hidden="true" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="flex flex-col gap-4" aria-labelledby="limits">
            <h2 id="limits" className="font-barlow-condensed uppercase" style={eyebrow}>Known limits</h2>
            <p className="font-barlow" style={body}>
              Some content comes from employers, such as job descriptions and uploaded documents. We ask employers to follow
              accessible practices, but we can’t guarantee every file they provide. If something you need isn’t accessible,
              tell us and we’ll work with the employer to get you an accessible version.
            </p>
          </section>

          <section className="flex flex-col gap-5 p-6 md:p-8 rounded-md" style={{ background: navyMid, border: `1px solid ${gold}` }} aria-labelledby="feedback">
            <h2 id="feedback" className="font-bodoni" style={{ fontSize: '24px', color: white }}>Found a barrier? Tell us.</h2>
            <p className="font-barlow" style={body}>
              If any part of NORVARDEN is hard to use with your setup, email us with the page and what happened. We reply
              within two business days and can help you complete any task another way in the meantime.
            </p>
            <a
              href="mailto:accessibility@norvarden.com?subject=Accessibility%20feedback"
              className="gold-shimmer-bg font-barlow-condensed uppercase inline-flex items-center gap-2 self-start"
              style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.24em', padding: '14px 28px', borderRadius: '6px', color: navy }}
            >
              <Mail size={14} aria-hidden="true" /> accessibility@norvarden.com
            </a>
          </section>

          <p className="font-barlow" style={{ fontSize: '14px', color: ice60 }}>
            This statement was last reviewed in October 2026. See also our <Link to="/privacy" className="underline" style={{ color: gold }}>privacy policy</Link>.
          </p>
        </div>
      </main>
    </>
  );
}
