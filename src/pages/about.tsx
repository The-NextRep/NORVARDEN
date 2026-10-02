/**
 * /about — Mission, how REP | IV works, and leadership (Founder & CEO).
 */
import { Link } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { ShieldCheck, Lock, BadgeCheck, ChevronRight, ExternalLink } from 'lucide-react';
import BrandMark from '@/components/BrandMark';

const siteUrl = 'https://jobs.the-nextrep.com';
const navy    = 'hsl(var(--hero-navy))';
const navyMid = 'hsl(var(--hero-navy-mid))';
const gold    = 'hsl(var(--hero-gold))';
const white   = 'hsl(var(--hero-white))';
const ice60   = 'hsl(var(--hero-ice-60))';
const border  = '1px solid hsl(var(--hero-gold) / 0.16)';

const LINKEDIN = 'https://www.linkedin.com/in/carrie-yun-arredondo-435399b0';

const PILLARS = [
  {
    icon: BadgeCheck,
    title: 'Built for proven people',
    body: 'REP | IV is for current and former pro athletes, coaches and military veterans. It is free for every member, always.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified companies only',
    body: 'Every employer is reviewed before it can post a job or reach out. Companies pay; members never do.',
  },
  {
    icon: Lock,
    title: 'You control your contact info',
    body: 'Your email, phone and résumé are shared only after you accept a company’s request to connect.',
  },
];

const eyebrow = { fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em', color: gold } as const;

export default function AboutPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    url: `${siteUrl}/about`,
    name: 'About REP | IV',
    mainEntity: {
      '@type': 'Person',
      name: 'Carrie Yun Arredondo',
      jobTitle: 'Founder & CEO',
      worksFor: [
        { '@type': 'Organization', name: 'C2A Defense Strategies' },
        { '@type': 'Organization', name: 'The NextRep', url: siteUrl },
        { '@type': 'Organization', name: 'Ava’s Place Nonprofit' },
      ],
      sameAs: [LINKEDIN],
      image: `${siteUrl}/images/carrie-arredondo.jpg`,
    },
  };

  return (
    <>
      <Helmet>
        <title>About — REP | IV</title>
        <meta name="description" content="REP | IV connects pro athletes, coaches and military veterans with verified companies. Meet founder and CEO Carrie Yun Arredondo." />
        <link rel="canonical" href={`${siteUrl}/about`} />
        <meta property="og:title" content="About — REP | IV" />
        <meta property="og:url" content={`${siteUrl}/about`} />
        <script type="application/ld+json">{JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>
      </Helmet>

      <main className="min-h-screen px-6 md:px-12 lg:px-16 pt-32 pb-24" style={{ background: navy }}>
        <div className="max-w-5xl mx-auto flex flex-col gap-20">

          {/* Mission */}
          <section className="flex flex-col gap-6 max-w-3xl">
            <p className="font-barlow-condensed uppercase" style={eyebrow}>About</p>
            <BrandMark size={34} />
            <h1 className="font-bodoni" style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.6rem)', fontWeight: 400, lineHeight: 1.08, color: white }}>
              Built For The <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>NextRep.</em>
            </h1>
            <p className="font-barlow" style={{ fontSize: '17px', fontWeight: 300, lineHeight: 1.8, color: ice60 }}>
              Athletes, coaches and veterans have spent years performing under pressure, leading teams and getting results.
              REP | IV exists so that experience is recognized for what it is, and so the people who earned it can choose
              their next chapter with companies that have been checked first.
            </p>
          </section>

          {/* How it works */}
          <section className="flex flex-col gap-6">
            <p className="font-barlow-condensed uppercase" style={eyebrow}>What we stand for</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PILLARS.map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex flex-col gap-3 p-6 rounded-sm" style={{ background: navyMid, border }}>
                  <Icon size={22} style={{ color: gold }} aria-hidden="true" />
                  <h2 className="font-bodoni" style={{ fontSize: '22px', fontWeight: 400, color: white, lineHeight: 1.25 }}>{title}</h2>
                  <p className="font-barlow" style={{ fontSize: '15px', fontWeight: 300, lineHeight: 1.7, color: ice60 }}>{body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Leadership */}
          <section className="flex flex-col gap-6" aria-labelledby="leadership">
            <p id="leadership" className="font-barlow-condensed uppercase" style={eyebrow}>Leadership</p>
            <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8 p-6 md:p-10 rounded-sm" style={{ background: navyMid, border }}>
              <div className="flex flex-col items-start gap-4">
                <img
                  src="/images/carrie-arredondo-sm.jpg"
                  srcSet="/images/carrie-arredondo-sm.jpg 480w, /images/carrie-arredondo.jpg 956w"
                  sizes="(min-width: 768px) 240px, 100vw"
                  alt="Carrie Yun Arredondo, Founder and CEO"
                  width={480}
                  height={600}
                  loading="lazy"
                  className="w-full max-w-[240px] h-auto rounded-sm"
                  style={{ aspectRatio: '4 / 5', objectFit: 'cover', border: `1px solid ${gold}` }}
                />
                <div>
                  <p className="font-bodoni" style={{ fontSize: '24px', color: white, lineHeight: 1.2 }}>Carrie Yun Arredondo</p>
                  <p className="font-barlow-condensed uppercase mt-1" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.28em', color: gold }}>
                    Founder &amp; CEO
                  </p>
                  <p className="font-barlow mt-2" style={{ fontSize: '13px', fontWeight: 300, lineHeight: 1.6, color: ice60 }}>
                    C2A Defense Strategies · The NextRep · Ava’s Place Nonprofit
                  </p>
                </div>
                <a
                  href={LINKEDIN}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-barlow-condensed uppercase transition-opacity hover:opacity-80"
                  style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.28em', color: ice60 }}
                >
                  LinkedIn <ExternalLink size={11} />
                </a>
              </div>

              <div className="flex flex-col gap-5 min-w-0">
                <p className="font-barlow" style={{ fontSize: '16px', fontWeight: 300, lineHeight: 1.85, color: 'hsl(var(--hero-ice) / 0.85)' }}>
                  Carrie Yun Arredondo is the Founder and CEO of C2A Defense Strategies, The NextRep (home of REP | IV) and
                  Ava’s Place Nonprofit: a strategist and entrepreneur whose work is shaped by her own story. Adopted from South Korea, she lived through childhood abuse, foster care, homelessness and
                  profound loss, and turned survival into purpose. Today she builds pathways that make sure athletes, veterans
                  and other high performers are recognized not only for what they’ve done, but for everything they’re capable
                  of becoming.
                </p>
                <blockquote
                  className="font-bodoni pl-5"
                  style={{ borderLeft: `2px solid ${gold}`, fontSize: 'clamp(1.2rem, 2.4vw, 1.5rem)', fontStyle: 'italic', lineHeight: 1.5, color: white }}
                >
                  Turn lived experience into opportunity, identity into strength, and the next chapter into one built by choice.
                </blockquote>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-10" style={{ borderTop: '1px solid hsl(var(--hero-gold) / 0.2)' }}>
            <p className="font-bodoni" style={{ fontSize: '26px', color: white, lineHeight: 1.3 }}>
              Ready for your next rep?
            </p>
            <div className="flex flex-wrap items-center gap-5">
              <Link
                to="/signup"
                className="gold-shimmer-bg font-barlow-condensed uppercase inline-flex items-center gap-2 transition-opacity hover:opacity-90"
                style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em', padding: '16px 36px', borderRadius: '3px', color: navy }}
              >
                Join free <ChevronRight size={13} />
              </Link>
              <Link to="/for-companies" className="font-barlow" style={{ fontSize: '15px', fontWeight: 300, color: ice60 }}>
                Hiring? See plans →
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
