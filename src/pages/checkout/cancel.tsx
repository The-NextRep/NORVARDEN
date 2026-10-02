/**
 * /checkout/cancel — shown if a user leaves Stripe Checkout without paying.
 * (Checkout's cancel_url now points at /pricing; this page remains for old links.)
 */
import { Helmet } from '@dr.pogodin/react-helmet';
import { Link } from 'react-router';

const navy    = 'hsl(var(--hero-navy))';
const navyMid = 'hsl(var(--hero-navy-mid))';
const gold    = 'hsl(var(--hero-gold))';
const white   = 'hsl(var(--hero-white))';
const ice60   = 'hsl(var(--hero-ice-60))';

export default function CheckoutCancel() {
  return (
    <>
      <Helmet>
        <title>Checkout cancelled — REP | IV</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <main className="min-h-screen flex items-center justify-center px-6 py-20" style={{ background: navy }}>
        <div
          className="w-full max-w-md text-center"
          style={{ background: navyMid, border: '1px solid hsl(var(--hero-gold) / 0.3)', borderRadius: '3px', padding: '40px 32px' }}
        >
          <h1 className="font-bodoni mb-4" style={{ fontSize: '2rem', fontWeight: 400, lineHeight: 1.1, color: white }}>
            Checkout cancelled
          </h1>
          <p className="font-barlow mb-8" style={{ fontSize: '15px', fontWeight: 300, lineHeight: 1.7, color: ice60 }}>
            No payment was taken. You can pick a plan whenever you&rsquo;re ready.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              to="/pricing"
              className="gold-shimmer-bg font-barlow-condensed uppercase inline-flex w-full justify-center"
              style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em', padding: '16px 24px', borderRadius: '3px', color: navy }}
            >
              Back to pricing
            </Link>
            <a href="mailto:info@the-nextrep.com" className="font-barlow" style={{ fontSize: '13px', color: gold }}>
              Questions? info@the-nextrep.com
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
