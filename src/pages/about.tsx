/**
 * /about — NORVARDEN's mission, what it stands for, and its accessibility
 * commitment. Leadership section to be added when the client provides it.
 */
import { Link } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { ShieldCheck, Lock, Accessibility, ChevronRight } from 'lucide-react';
import BrandMark from '@/components/BrandMark';

const siteUrl = 'https://www.norvarden.com';
const navy    = 'hsl(var(--hero-navy))';
const navyMid = 'hsl(var(--hero-navy-mid))';
const gold    = 'hsl(var(--hero-gold))';
const white   = 'hsl(var(--hero-white))';
const ice60   = 'hsl(var(--hero-ice-60))';
const border  = '1px solid hsl(var(--hero-gold) / 0.2)';

const PILLARS = [
  {
    icon: Accessibility,
    title: 'Accessible by design',
    body: 'Built to WCAG 2.2 AA and tested with screen readers, keyboard-only use, voice control and zoom. If anything gets in your way, we fix it.',
  },
  {
    icon: ShieldCheck,
    title: 'Inclusive, verified employers',
    body: 'Every employer is identity-checked and signs our accessible-hiring pledge. Jobs list their accommodations up front.',
  },
  {
    icon: Lock,
    title: 'Private by default',
    body: 'You never have to prove or disclose a disability. Anything you add is optional, and your contact details are shared only when you accept a request.',
  },
];

const eyebrow = { fontSize: '12px', fontWeight: 600, letterSpacing: '0.28em', color: gold } as const;

export default function AboutPage() {
  return (
    <>
      <Helmet>
        <title>About — NORVARDEN</title>
        <meta name="description" content="NORVARDEN connects people with disabilities to verified, inclusive employers, on a platform that is accessible from the ground up." />
        <link rel="canonical" href={`${siteUrl}/about`} />
        <meta property="og:title" content="About — NORVARDEN" />
        <meta property="og:url" content={`${siteUrl}/about`} />
      </Helmet>

      <main className="min-h-screen px-6 md:px-12 lg:px-16 pt-32 pb-24" style={{ background: navy }}>
        <div className="max-w-5xl mx-auto flex flex-col gap-20">
          <section className="flex flex-col gap-6 max-w-3xl">
            <p className="font-barlow-condensed uppercase" style={eyebrow}>About</p>
            <BrandMark size={24} tagline />
            <h1 className="font-bodoni" style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.4rem)', lineHeight: 1.1, color: white }}>
              Talent has <em className="gold-shimmer">no limits.</em>
            </h1>
            <p className="font-barlow" style={{ fontSize: '18px', lineHeight: 1.75, color: ice60 }}>
              People with disabilities bring problem-solving, resilience and perspective that every team needs, yet too
              many hiring processes still shut them out. NORVARDEN is another way forward: a career platform where
              employers come prepared to include, accommodations are listed up front, and you decide what you share.
            </p>
          </section>

          <section className="flex flex-col gap-6" aria-labelledby="stand-for">
            <h2 id="stand-for" className="font-barlow-condensed uppercase" style={eyebrow}>What we stand for</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PILLARS.map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex flex-col gap-3 p-6 rounded-md" style={{ background: navyMid, border }}>
                  <Icon size={24} style={{ color: gold }} aria-hidden="true" />
                  <h3 className="font-bodoni" style={{ fontSize: '20px', color: white, lineHeight: 1.3 }}>{title}</h3>
                  <p className="font-barlow" style={{ fontSize: '16px', lineHeight: 1.7, color: ice60 }}>{body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-10" style={{ borderTop: border }}>
            <p className="font-bodoni" style={{ fontSize: '24px', color: white, lineHeight: 1.3 }}>
              Ready for your next step?
            </p>
            <div className="flex flex-wrap items-center gap-5">
              <Link
                to="/signup"
                className="gold-shimmer-bg font-barlow-condensed uppercase inline-flex items-center gap-2 transition-opacity hover:opacity-90"
                style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.24em', padding: '16px 32px', borderRadius: '6px', color: navy }}
              >
                Join free <ChevronRight size={14} aria-hidden="true" />
              </Link>
              <Link to="/for-companies" className="font-barlow underline-offset-4 hover:underline" style={{ fontSize: '16px', color: ice60 }}>
                Hiring? See plans →
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
