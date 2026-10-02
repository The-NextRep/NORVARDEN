import { useState, useEffect } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Eye, EyeOff, ChevronRight, CheckCircle, AlertTriangle } from 'lucide-react';
import BrandMark from '@/components/BrandMark';


// ─── Design tokens ────────────────────────────────────────────────────────
const navy         = 'hsl(var(--hero-navy))';
const gold         = 'hsl(var(--hero-gold))';
const white        = 'hsl(var(--hero-white))';
const ice60        = 'hsl(var(--hero-ice-60))';
const goldBorder35 = '1px solid hsl(var(--hero-gold) / 0.35)';
const goldBorder60 = '1px solid hsl(var(--hero-gold) / 0.60)';
const goldGradient = `linear-gradient(to right, transparent, ${gold} 30%, ${gold} 70%, transparent)`;

function Hairline({ className = '' }: { className?: string }) {
  return <div className={className} style={{ height: '1px', background: goldGradient }} aria-hidden="true" />;
}

function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="font-barlow-condensed uppercase block mb-2"
      style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.30em', color: gold }}
    >
      {children}
    </label>
  );
}

function PasswordInput({
  id, value, onChange, placeholder, autoComplete, disabled,
}: {
  id?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; autoComplete?: string; disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [show, setShow]       = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        className="w-full font-barlow pr-11"
        style={{
          background: disabled ? 'hsl(var(--hero-navy) / 0.4)' : 'hsl(var(--hero-navy-80))',
          border: focused ? goldBorder60 : goldBorder35,
          borderRadius: '3px',
          padding: '12px 14px',
          fontSize: '15px',
          fontWeight: 300,
          color: white,
          outline: 'none',
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? 'not-allowed' : 'text',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        disabled={disabled}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
        style={{ color: ice60, background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

type PageState = 'idle' | 'loading' | 'success' | 'invalid_token' | 'expired_token' | 'no_token';

export default function ResetPasswordPage() {
  const [searchParams]        = useSearchParams();
  const navigate              = useNavigate();
  const token                 = searchParams.get('token') ?? '';

  const [password, setPassword]   = useState('');
  const [confirm,  setConfirm]    = useState('');
  const [state,    setState]      = useState<PageState>(token ? 'idle' : 'no_token');
  const [error,    setError]      = useState('');

  // Redirect to /login with success message after a short delay
  useEffect(() => {
    if (state !== 'success') return;
    const t = setTimeout(() => navigate('/login?reset=success'), 2200);
    return () => clearTimeout(t);
  }, [state, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 10) {
      setError('Password must be at least 10 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setState('loading');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
        credentials: 'include',
      });
      const data = await res.json() as { ok?: boolean; error?: string };

      if (res.ok && data.ok) {
        setState('success');
        return;
      }
      if (data.error === 'expired_token') { setState('expired_token'); return; }
      if (data.error === 'invalid_token') { setState('invalid_token'); return; }
      setError(data.error ?? 'Something went wrong. Please try again.');
      setState('idle');
    } catch {
      setError('Network error. Please check your connection and try again.');
      setState('idle');
    }
  }

  // ── Token-error states ───────────────────────────────────────────────────
  if (state === 'no_token' || state === 'invalid_token' || state === 'expired_token') {
    const isExpired = state === 'expired_token';
    return (
      <>
        <Helmet>
          <title>Reset Password — REP | IV</title>
          <meta name="description" content="Reset your Board account password using your emailed link." />
          <meta name="robots" content="noindex" />
        </Helmet>
        <main
          className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
          style={{ background: navy }}
        >
          <Link to="/" aria-label="REP | IV home" className="mb-10 block">
            <BrandMark size={22} />
          </Link>

          <div
            className="w-full max-w-md p-8 text-center"
            style={{ background: 'hsl(var(--hero-card-bg))', border: goldBorder35, borderRadius: '3px' }}
          >
            <div
              className="inline-flex items-center justify-center mb-5"
              style={{
                width: '52px', height: '52px', borderRadius: '50%',
                background: 'hsl(var(--destructive) / 0.10)',
                border: '1px solid hsl(var(--destructive) / 0.40)',
              }}
            >
              <AlertTriangle size={22} style={{ color: 'hsl(var(--destructive))' }} />
            </div>

            <h1
              className="font-bodoni mb-3"
              style={{ fontSize: '1.55rem', fontWeight: 400, letterSpacing: '0.04em', color: white, lineHeight: 1.1 }}
            >
              {isExpired ? 'Link expired' : 'Invalid link'}
            </h1>
            <p className="font-barlow mb-7" style={{ fontSize: '14px', fontWeight: 300, lineHeight: 1.75, color: ice60 }}>
              {isExpired
                ? 'This reset link has expired. Reset links are valid for 1 hour.'
                : 'This reset link is invalid or has already been used.'}
            </p>

            <Link
              to="/forgot-password"
              className="font-barlow-condensed uppercase inline-flex items-center justify-center gap-2 w-full transition-opacity hover:opacity-90"
              style={{
                fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em',
                padding: '17px 0', borderRadius: '3px',
                background: gold, color: navy, textDecoration: 'none',
              }}
            >
              Request a new link <ChevronRight size={13} />
            </Link>

            <Hairline className="my-6" />

            <p className="font-barlow" style={{ fontSize: '14px', fontWeight: 300, color: ice60 }}>
              <Link to="/login" className="transition-opacity hover:opacity-80" style={{ color: gold }}>
                Back to sign in
              </Link>
            </p>
          </div>
        </main>
      </>
    );
  }

  // ── Success state ────────────────────────────────────────────────────────
  if (state === 'success') {
    return (
      <>
        <Helmet>
          <title>Password Updated — REP | IV</title>
          <meta name="description" content="Your Board account password has been updated successfully." />
          <meta name="robots" content="noindex" />
        </Helmet>
        <main
          className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
          style={{ background: navy }}
        >
          <Link to="/" aria-label="REP | IV home" className="mb-10 block">
            <BrandMark size={22} />
          </Link>

          <div
            className="w-full max-w-md p-8 text-center"
            style={{ background: 'hsl(var(--hero-card-bg))', border: goldBorder35, borderRadius: '3px' }}
          >
            <div
              className="inline-flex items-center justify-center mb-5"
              style={{
                width: '52px', height: '52px', borderRadius: '50%',
                background: 'hsl(var(--hero-gold) / 0.10)',
                border: '1px solid hsl(var(--hero-gold) / 0.35)',
              }}
            >
              <CheckCircle size={22} style={{ color: gold }} />
            </div>

            <h1
              className="font-bodoni mb-3"
              style={{ fontSize: '1.55rem', fontWeight: 400, letterSpacing: '0.04em', color: white, lineHeight: 1.1 }}
            >
              Password updated
            </h1>
            <p className="font-barlow" style={{ fontSize: '14px', fontWeight: 300, lineHeight: 1.75, color: ice60 }}>
              Redirecting you to sign in…
            </p>
          </div>
        </main>
      </>
    );
  }

  // ── Main form ────────────────────────────────────────────────────────────
  return (
    <>
      <Helmet>
        <title>Reset Password — REP | IV</title>
        <meta name="description" content="Choose a new password for your Board account." />
        <meta name="robots" content="noindex" />
      </Helmet>

      <main
        className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
        style={{ background: navy }}
      >
        <Link to="/" aria-label="REP | IV home" className="mb-10 block">
          <BrandMark size={22} />
        </Link>

        <div
          className="w-full max-w-md p-8"
          style={{ background: 'hsl(var(--hero-card-bg))', border: goldBorder35, borderRadius: '3px' }}
        >
          <div className="mb-7">
            <h1
              className="font-bodoni mb-2"
              style={{ fontSize: '1.55rem', fontWeight: 400, letterSpacing: '0.04em', color: white, lineHeight: 1.1 }}
            >
              Choose a new password
            </h1>
            <p className="font-barlow" style={{ fontSize: '14px', fontWeight: 300, lineHeight: 1.75, color: ice60 }}>
              Must be at least 10 characters.
            </p>
          </div>

          {error && (
            <div
              className="flex items-start gap-3 p-4 mb-5"
              style={{ border: '1px solid hsl(var(--destructive) / 0.50)', borderRadius: '3px', background: 'hsl(var(--destructive) / 0.08)' }}
              role="alert"
            >
              <p className="font-barlow" style={{ fontSize: '14px', fontWeight: 300, lineHeight: 1.65, color: 'hsl(var(--destructive))' }}>
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-5">
              <FieldLabel htmlFor="rp-password">New password</FieldLabel>
              <PasswordInput
                id="rp-password"
                value={password}
                onChange={setPassword}
                placeholder="At least 10 characters"
                autoComplete="new-password"
                disabled={state === 'loading'}
              />
            </div>

            <div className="mb-7">
              <FieldLabel htmlFor="rp-confirm">Confirm new password</FieldLabel>
              <PasswordInput
                id="rp-confirm"
                value={confirm}
                onChange={setConfirm}
                placeholder="Repeat your new password"
                autoComplete="new-password"
                disabled={state === 'loading'}
              />
            </div>

            <button
              type="submit"
              disabled={state === 'loading'}
              className="font-barlow-condensed uppercase w-full flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{
                fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em',
                padding: '17px 0', borderRadius: '3px',
                background: gold, color: navy,
              }}
            >
              {state === 'loading' ? 'Updating…' : <>Update password <ChevronRight size={13} /></>}
            </button>
          </form>

          <Hairline className="my-7" />

          <p className="font-barlow text-center" style={{ fontSize: '14px', fontWeight: 300, color: ice60 }}>
            <Link to="/login" className="transition-opacity hover:opacity-80" style={{ color: gold }}>
              Back to sign in
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
