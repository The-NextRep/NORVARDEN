import { Helmet } from '@dr.pogodin/react-helmet';
import { community_rules } from 'virtual:content';
import { ContentListContext } from '@airo/content';

const siteUrl    = 'https://jobs.the-nextrep.com';
const navy       = 'hsl(var(--hero-navy))';
const gold       = 'hsl(var(--hero-gold))';
const white      = 'hsl(var(--hero-white))';
const ice        = 'hsl(var(--hero-ice))';
const ice60      = 'hsl(var(--hero-ice-60))';
const goldGrad   = `linear-gradient(to right, transparent, ${gold} 30%, ${gold} 70%, transparent)`;

export default function CommunityRulesPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${siteUrl}/community-rules#webpage`,
    url: `${siteUrl}/community-rules`,
    name: community_rules.meta.title,
    isPartOf: { '@id': `${siteUrl}/#website` },
  };

  return (
    <>
      <Helmet>
        <title>{community_rules.meta.title}</title>
        <meta name="description" content={community_rules.meta.description} />
        <link rel="canonical" href={`${siteUrl}/community-rules`} />
        <meta property="og:title" content={community_rules.meta.title} />
        <meta property="og:description" content={community_rules.meta.description} />
        <meta property="og:url" content={`${siteUrl}/community-rules`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <script type="application/ld+json">{JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>
      </Helmet>

      <main style={{ background: navy, minHeight: '100vh' }}>
        <div className="mx-auto px-6 py-20 md:py-28" style={{ maxWidth: '720px' }}>

          {/* Last updated */}
          <p
            className="font-barlow-condensed uppercase mb-8"
            style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.32em', color: 'hsl(var(--hero-gold) / 0.60)' }}
          >
            Last updated: <span>{community_rules.lastUpdated}</span>
          </p>

          {/* Headline */}
          <h1
            className="font-bodoni mb-6"
            style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.01em', color: white }}
          >
            <span>{community_rules.headline}</span>{' '}
            <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>
              <span>{community_rules.headlineGold}</span>
            </em>
          </h1>

          {/* Hairline */}
          <div className="mb-8" style={{ height: '1px', background: goldGrad }} aria-hidden="true" />

          {/* Intro */}
          <p
            className="font-barlow mb-14"
            style={{ fontSize: '17px', fontWeight: 300, lineHeight: 1.8, color: ice60 }}
          >
            <span>{community_rules.intro}</span>
          </p>

          {/* Sections */}
          <ContentListContext field="community_rules.sections">
            <div className="flex flex-col gap-12">
              {community_rules.sections.map((section) => (
                <section key={section.id} aria-labelledby={`heading-${section.id}`}>
                  <h2
                    id={`heading-${section.id}`}
                    className="font-bodoni mb-4"
                    style={{ fontSize: '22px', fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.01em', color: white }}
                  >
                    {section.heading}
                  </h2>
                  <div
                    className="mb-6"
                    style={{ height: '1px', background: 'hsl(var(--hero-gold) / 0.20)' }}
                    aria-hidden="true"
                  />
                  <ContentListContext field={`community_rules.sections[${community_rules.sections.indexOf(section)}].body`}>
                    <div className="flex flex-col gap-4">
                      {section.body.map((para) => (
                        <p
                          key={para.id}
                          className="font-barlow"
                          style={{ fontSize: '17px', fontWeight: 300, lineHeight: 1.8, color: ice }}
                        >
                          {para.text}
                        </p>
                      ))}
                    </div>
                  </ContentListContext>
                </section>
              ))}
            </div>
          </ContentListContext>

          {/* Bottom rule */}
          <div className="mt-16" style={{ borderTop: '1px solid hsl(var(--hero-gold) / 0.20)', paddingTop: '24px' }}>
            <p
              className="font-barlow"
              style={{ fontSize: '13px', fontWeight: 300, color: 'hsl(var(--hero-ice-50))', lineHeight: 1.7 }}
            >
              Questions? Email{' '}
              <a
                href="mailto:info@the-nextrep.com"
                className="transition-opacity hover:opacity-80"
                style={{ color: gold, textDecoration: 'none' }}
              >
                info@the-nextrep.com
              </a>
            </p>
          </div>

        </div>
      </main>
    </>
  );
}
