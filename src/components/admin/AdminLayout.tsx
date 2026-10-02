/**
 * Page chrome for admin screens: nav, editorial header band, content column.
 */
import type { ReactNode } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import AdminNav from './AdminNav';
import { adminTheme as t, eyebrowStyle } from './theme';

interface Props {
  title: string;
  eyebrow?: string;
  subtitle?: ReactNode;
  metaDescription: string;
  actions?: ReactNode;
  children: ReactNode;
}

export default function AdminLayout({ title, eyebrow = 'Admin', subtitle, metaDescription, actions, children }: Props) {
  return (
    <main className="min-h-screen pb-24" style={{ background: t.navy }}>
      <Helmet>
        <title>{`${title} — Admin — NORVARDEN`}</title>
        <meta name="description" content={metaDescription} />
        <meta name="robots" content="noindex" />
      </Helmet>

      <AdminNav />

      <header className="px-4 md:px-12 lg:px-16 pt-10 pb-8" style={{ borderBottom: `1px solid ${t.line}`, background: t.navyMid }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="min-w-0">
            <p className="font-barlow-condensed uppercase mb-2" style={{ ...eyebrowStyle, color: t.gold }}>{eyebrow}</p>
            <h1 className="font-bodoni" style={{ fontSize: 'clamp(28px, 3.4vw, 42px)', fontWeight: 400, color: t.white, lineHeight: 1.05 }}>
              {title}
            </h1>
            {subtitle && (
              <p className="font-barlow mt-2 max-w-2xl" style={{ fontSize: '14px', fontWeight: 300, color: t.ice60, lineHeight: 1.6 }}>
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="shrink-0 flex flex-wrap gap-2">{actions}</div>}
        </div>
      </header>

      <div className="px-4 md:px-12 lg:px-16 pt-8">
        <div className="max-w-6xl mx-auto">{children}</div>
      </div>
    </main>
  );
}
