import { Helmet } from '@dr.pogodin/react-helmet';
import { type ReactElement } from 'react';
import { ScrollRestoration } from 'react-router';

import HomepageSameAsJsonLd from '@/components/HomepageSameAsJsonLd';
import Footer from '@/layouts/parts/Footer';
import Header from '@/layouts/parts/Header';
import Website from '@/layouts/Website';
import { IS_DRAFT } from '@/lib/site-meta';

/**
 * Root layout component that wraps all pages with consistent header and footer.
 *
 * To customize the header or footer, directly edit the Header.tsx and Footer.tsx
 * files in the layouts/parts directory.
 *
 * Site-wide <title> and <meta> live in the <Helmet> below. Individual pages can
 * override them by rendering their own <Helmet> — last-mounted wins.
 */
interface RootLayoutProps {
  children: ReactElement;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <Website>
      <Helmet>
        <title>NORVARDEN — Verified Jobs for People with Disabilities</title>
        <meta name="description" content="NORVARDEN is the verified job board connecting companies with people with disabilities." />
        {/* Site-wide share defaults; pages override title/description/url.
            No canonical here: each page sets its own, or the server adds a
            self-referencing one. */}
        <meta property="og:site_name" content="NORVARDEN" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://www.norvarden.com/images/og-norvarden.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="NORVARDEN — Another Way Forward" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://www.norvarden.com/images/og-norvarden.jpg" />
        <meta name="theme-color" content="#0f1a2b" />
        {IS_DRAFT && <meta name="robots" content="noindex, nofollow" />}
      </Helmet>
      <HomepageSameAsJsonLd />
      <ScrollRestoration />
      <Header />
      {children}
      <Footer />
    </Website>
  );
}
