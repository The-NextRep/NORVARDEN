/**
 * /checkout/success?session_id=cs_xxx
 *
 * Shown after Stripe Checkout. Confirms the session with the server
 * (GET /api/stripe/session/:id — only returns the caller's own company's session)
 * before showing success. Access itself is granted by the Stripe webhook.
 */
import { useEffect, useRef, useState } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { Link, useSearchParams } from 'react-router';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { formatPrice } from '@/lib/stripe/format';

const navy    = 'hsl(var(--hero-navy))';
const navyMid = 'hsl(var(--hero-navy-mid))';
const gold    = 'hsl(var(--hero-gold))';
const white   = 'hsl(var(--hero-white))';
const ice60   = 'hsl(var(--hero-ice-60))';

interface SessionSummary {
  plan: string | null;
  cycle: string | null;
  amount_total: number | null;
  currency: string | null;
  status: string | null;
  payment_status: string | null;
}

type State = 'verifying' | 'verified' | 'processing' | 'failed';

const PLAN_NAMES: Record<string, string> = { scout: 'Scout', partner: 'Partner' };
const CYCLE_NAMES: Record<string, string> = { quarterly: '3 months', annual: '12 months' };

const buttonStyle = {
  fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em', padding: '16px 24px',
  borderRadius: '3px', color: navy, outlineColor: gold,
} as const;

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [details, setDetails] = useState<SessionSummary | null>(null);
  const [state, setState] = useState<State>('verifying');
  const [message, setMessage] = useState('');
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    if (!sessionId || !sessionId.startsWith('cs_')) {
      setState('failed');
      setMessage('No checkout session found.');
      return;
    }

    fetch(`/api/stripe/session/${encodeURIComponent(sessionId)}`, { credentials: 'include' })
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as { success?: boolean; session?: SessionSummary; error?: string };
        if (res.status === 401) throw new Error('Please sign in to your company account to see this confirmation.');
        if (!res.ok || !data.success || !data.session) throw new Error(data.error ?? 'Unable to confirm your payment.');
        return data.session;
      })
      .then((session) => {
        setDetails(session);
        const paid = session.payment_status === 'paid' || session.payment_status === 'no_payment_required';
        if (session.status === 'complete' && paid) {
          setState('verified');
        } else if (session.status === 'complete') {
          setState('processing');
          setMessage('Your payment is still processing. Your plan will activate as soon as it clears.');
        } else if (session.status === 'expired') {
          setState('failed');
          setMessage('This checkout session expired. Please try again.');
        } else {
          setState('failed');
          setMessage('Checkout was not completed. Please try again.');
        }
      })
      .catch((err: unknown) => {
        setState('failed');
        setMessage(err instanceof Error ? err.message : 'Unable to confirm your payment.');
      });
  }, [sessionId]);

  const planName = details?.plan ? PLAN_NAMES[details.plan] ?? details.plan : null;
  const cycleName = details?.cycle ? CYCLE_NAMES[details.cycle] ?? details.cycle : null;

  return (
    <>
      <Helmet>
        <title>Checkout — NORVARDEN</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <main className="min-h-screen flex items-center justify-center px-6 py-20" style={{ background: navy }}>
        <div
          className="w-full max-w-md text-center"
          style={{ background: navyMid, border: '1px solid hsl(var(--hero-gold) / 0.3)', borderRadius: '3px', padding: '40px 32px' }}
        >
          {state === 'verifying' && (
            <>
              <div
                className="mx-auto mb-6 animate-spin"
                style={{ width: '40px', height: '40px', borderRadius: '50%', border: `3px solid ${gold}`, borderTopColor: 'transparent' }}
                aria-hidden="true"
              />
              <h1 className="font-bodoni mb-2" style={{ fontSize: '2rem', fontWeight: 400, color: white }}>Confirming your payment</h1>
              <p className="font-barlow" style={{ fontSize: '15px', fontWeight: 300, color: ice60 }}>One moment…</p>
            </>
          )}

          {state === 'verified' && (
            <>
              <CheckCircle size={40} className="mx-auto mb-6" style={{ color: gold }} />
              <p className="font-barlow-condensed uppercase mb-3" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.32em', color: gold }}>
                Welcome to NORVARDEN
              </p>
              <h1 className="font-bodoni mb-4" style={{ fontSize: '2.2rem', fontWeight: 400, lineHeight: 1.1, color: white }}>
                You&rsquo;re all set
              </h1>
              <p className="font-barlow mb-6" style={{ fontSize: '15px', fontWeight: 300, lineHeight: 1.7, color: ice60 }}>
                Your subscription is confirmed. You can now post jobs and connect with verified people with disabilities.
                If your dashboard doesn&rsquo;t show your plan right away, give it a minute and refresh.
              </p>
              {details && (planName || details.amount_total != null) && (
                <div className="mb-8 text-left font-barlow" style={{ borderTop: '1px solid hsl(var(--hero-gold) / 0.15)', borderBottom: '1px solid hsl(var(--hero-gold) / 0.15)', padding: '14px 0', fontSize: '14px', color: white }}>
                  {planName && (
                    <p className="flex justify-between py-1"><span style={{ color: ice60 }}>Plan</span><span>{planName}{cycleName ? ` · ${cycleName}` : ''}</span></p>
                  )}
                  {details.amount_total != null && details.currency && (
                    <p className="flex justify-between py-1"><span style={{ color: ice60 }}>Paid today</span><span>{formatPrice(details.amount_total, details.currency)}</span></p>
                  )}
                </div>
              )}
              <Link to="/company/dashboard" className="gold-shimmer-bg font-barlow-condensed uppercase inline-flex w-full justify-center" style={buttonStyle}>
                Go to your dashboard
              </Link>
            </>
          )}

          {(state === 'processing' || state === 'failed') && (
            <>
              <AlertTriangle size={40} className="mx-auto mb-6" style={{ color: gold }} />
              <h1 className="font-bodoni mb-4" style={{ fontSize: '2rem', fontWeight: 400, lineHeight: 1.1, color: white }}>
                {state === 'processing' ? 'Payment processing' : 'We couldn’t confirm your payment'}
              </h1>
              <p className="font-barlow mb-8" style={{ fontSize: '15px', fontWeight: 300, lineHeight: 1.7, color: ice60 }}>{message}</p>
              <div className="flex flex-col gap-3">
                <Link
                  to={state === 'processing' ? '/company/dashboard' : '/pricing'}
                  className="gold-shimmer-bg font-barlow-condensed uppercase inline-flex w-full justify-center"
                  style={buttonStyle}
                >
                  {state === 'processing' ? 'Go to your dashboard' : 'Back to pricing'}
                </Link>
                <a href="mailto:info@norvarden.com" className="font-barlow" style={{ fontSize: '13px', color: gold }}>
                  Questions? info@norvarden.com
                </a>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
