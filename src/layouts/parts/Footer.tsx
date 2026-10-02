import { Link } from 'react-router';
import BrandMark from '@/components/BrandMark';

export default function Footer() {
  return (
    <footer className="mt-auto" style={{ background: 'hsl(var(--hero-navy))', borderTop: '1px solid hsl(var(--hero-gold) / 0.35)' }}>
      <div className="container mx-auto px-6 md:px-12 lg:px-16 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">

          {/* Brand — Bodoni Moda logo, Barlow Condensed sub */}
          <div className="flex flex-col gap-2">
            <BrandMark size={16} />
            <a
              href="https://www.norvarden.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-barlow-condensed uppercase transition-colors hover:opacity-80"
              style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.24em', color: 'hsl(var(--hero-ice) / 0.82)' }}
            >
              Another Way Forward
            </a>
          </div>

          {/* Links — Barlow Condensed 500 */}
          <nav className="flex flex-wrap gap-x-8 gap-y-3" aria-label="Footer links">
            {[
              { to: '/about',           label: 'About' },
              { to: '/resources',       label: 'Resources' },
              { to: '/events',          label: 'Events' },
              { to: '/privacy',         label: 'Privacy' },
              { to: '/terms',           label: 'Terms' },
              { to: '/community-rules', label: 'Community Rules' },
              { to: '/trust',           label: 'How We Verify' },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="font-barlow-condensed uppercase transition-colors hover:opacity-80"
                style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.24em', color: 'hsl(var(--hero-ice) / 0.82)' }}
              >
                {label}
              </Link>
            ))}
            <a
              href="mailto:info@norvarden.com"
              className="font-barlow-condensed uppercase transition-colors hover:opacity-80"
              style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.24em', color: 'hsl(var(--hero-ice) / 0.82)' }}
            >
              Contact
            </a>
          </nav>
        </div>

        {/* Bottom rule + copyright */}
        <div className="mt-8 pt-6" style={{ borderTop: '1px solid hsl(var(--hero-gold) / 0.2)' }}>
          <p
            className="font-barlow"
            style={{ fontSize: '12px', fontWeight: 400, color: 'hsl(var(--hero-ice) / 0.65)' }}
          >
            © 2026 NORVARDEN. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
