import { Helmet } from '@dr.pogodin/react-helmet';
import { trust } from 'virtual:content';
import { Mail, Building2, UserCheck, Shield, AlertTriangle, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ICON_MAP: Record<string, React.ElementType> = {
  mail: Mail,
  building: Building2,
  'user-check': UserCheck,
  shield: Shield,
};

export default function TrustPage() {
  return (
    <>
      <Helmet>
        <title>{trust.meta.title}</title>
        <meta name="description" content={trust.meta.description} />
        <link rel="canonical" href="https://jobs.the-nextrep.com/trust" />
        <meta property="og:title" content={trust.meta.title} />
        <meta property="og:description" content={trust.meta.description} />
        <meta property="og:url" content="https://jobs.the-nextrep.com/trust" />
        <meta property="og:type" content="website" />
      </Helmet>
      <main>
        {/* Hero */}
        <section className="py-xxl bg-background border-b border-border">
          <div className="container mx-auto px-4 max-w-content">
            <div className="max-w-2xl">
              <span className="inline-block font-barlow-condensed uppercase mb-4" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em', color: 'hsl(var(--hero-gold))' }}>
                <span>{trust.hero.label}</span>
              </span>
              <h1 className="font-bodoni text-foreground mb-4" style={{ fontSize: 'clamp(2.2rem, 4vw, 3.5rem)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.01em' }}>
                <span>{trust.hero.headline}</span>
              </h1>
              <p className="font-barlow text-muted-foreground" style={{ fontSize: '17px', fontWeight: 300, lineHeight: 1.75 }}>
                <span>{trust.hero.subheadline}</span>
              </p>
            </div>
          </div>
        </section>

        {/* Four checks */}
        <section className="py-xxl bg-background">
          <div className="container mx-auto px-4 max-w-content">
            <div className="max-w-2xl flex flex-col gap-10">
              {trust.checks.map((check, idx) => {
                const Icon = ICON_MAP[check.icon] ?? Shield;
                return (
                  <div key={check.id} className="flex gap-5">
                    <div className="shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 mt-0.5">
                      <Icon size={22} className="text-primary" />
                    </div>
                    <div>
                      <h2 className="font-bodoni text-foreground mb-2" style={{ fontSize: '1.5rem', fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.01em' }}>
                        <span>{check.title}</span>
                      </h2>
                      <p className="font-barlow text-muted-foreground" style={{ fontSize: '16px', fontWeight: 300, lineHeight: 1.75 }}>
                        <span>{check.body}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* What you should never be asked for */}
        <section className="py-xxl bg-muted/40 border-y border-border">
          <div className="container mx-auto px-4 max-w-content">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-6">
                <AlertTriangle size={22} className="text-amber-500 shrink-0" />
                <h2 className="text-xl font-bold text-foreground">
                  <span>{trust.neverSection.heading}</span>
                </h2>
              </div>
              <p className="text-muted-foreground text-sm mb-6">
                <span>{trust.neverSection.intro}</span>
              </p>
              <ul className="flex flex-col gap-3">
                {trust.neverSection.items.map((item) => (
                  <li key={item.id} className="flex items-start gap-3">
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-sm text-foreground"><span>{item.text}</span></span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Report section */}
        <section className="py-xxl bg-background">
          <div className="container mx-auto px-4 max-w-content">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <Flag size={20} className="text-primary shrink-0" />
                <h2 className="text-xl font-bold text-foreground">
                  <span>{trust.reportSection.heading}</span>
                </h2>
              </div>
              <p className="text-muted-foreground text-sm mb-6">
                <span>{trust.reportSection.body}</span>
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Button variant="default">
                  <Flag size={14} className="mr-2" />
                  <span>{trust.reportSection.reportCta}</span>
                </Button>
                <p className="text-sm text-muted-foreground">
                  <span>{trust.reportSection.emailLabel}</span>
                  {' '}
                  <a href="mailto:info@the-nextrep.com" className="text-primary hover:underline">
                    info@the-nextrep.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="py-lg bg-muted/40 border-t border-border">
          <div className="container mx-auto px-4 max-w-content">
            <p className="text-xs text-muted-foreground max-w-2xl">
              <span>{trust.disclaimer}</span>
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
