import { useState } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { Link } from 'react-router';
import { ChevronRight, Mail } from 'lucide-react';
import BrandMark from '@/components/BrandMark';

const siteUrl = 'https://jobs.the-nextrep.com';

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

function TextInput({
  id, value, onChange, placeholder, type = 'text', autoComplete, disabled,
}: {
  id?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; autoComplete?: string; disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      disabled={disabled}
      className="w-full font-barlow"
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
  );
}

export default function ForgotPasswordPage() {
  const [email, setEmail]   = useState('');
  const [state, setState]   = useState<'idle' | 'loading' | 'sent'>('idle');
  const [error, setError]   = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setState('loading');
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
        credentials: 'include',
      });
    } catch {
      // Always show success — anti-enumeration
    }
    setState('sent');
  }

  return (
    <>
      <Helmet>
        <title>Reset Password — REP | IV</title>
        <meta name="description" content="Request a password reset link for your Board account." />
        <link rel="canonical" href={`${siteUrl}/forgot-password`} />
        <meta name="robots" content="noindex" />
      </Helmet>

      <main
        className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
        style={{ background: navy }}
      >
        {/* Wordmark */}
        <Link to="/" aria-label="REP | IV home" className="mb-10 block">
          <BrandMark size={22} />
        </Link>

        <div
          className="w-full max-w-md p-8"
          style={{ background: 'hsl(var(--hero-card-bg))', border: goldBorder35, borderRadius: '3px' }}
        >
          {state === 'sent' ? (
            <>
              {/* Success state */}
              <div className="text-center mb-6">
                <div
                  className="inline-flex items-center justify-center mb-5"
                  style={{
                    width: '52px', height: '52px', borderRadius: '50%',
                    background: 'hsl(var(--hero-gold) / 0.10)',
                    border: '1px solid hsl(var(--hero-gold) / 0.35)',
                  }}
                >
                  <Mail size={22} style={{ color: gold }} />
                </div>
                <h1
                  className="font-bodoni mb-3"
                  style={{ fontSize: '1.55rem', fontWeight: 400, letterSpacing: '0.04em', color: white, lineHeight: 1.1 }}
                >
                  Check your email
                </h1>
                <p className="font-barlow" style={{ fontSize: '14px', fontWeight: 300, lineHeight: 1.75, color: ice60 }}>
                  If an account exists for <span style={{ color: white }}>{email}</span>, we've sent a reset link. It expires in 1 hour.
                </p>
              </div>

              <Hairline className="my-6" />

              <p className="font-barlow text-center" style={{ fontSize: '13px', fontWeight: 300, color: ice60 }}>
                Didn't receive it?{' '}
                <button
                  onClick={() => { setState('idle'); setError(''); }}
                  className="transition-opacity hover:opacity-80"
                  style={{ color: gold, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Try again
                </button>
              </p>
            </>
          ) : (
            <>
              <div className="mb-7">
                <h1
                  className="font-bodoni mb-2"
                  style={{ fontSize: '1.55rem', fontWeight: 400, letterSpacing: '0.04em', color: white, lineHeight: 1.1 }}
                >
                  Reset your password
                </h1>
                <p className="font-barlow" style={{ fontSize: '14px', fontWeight: 300, lineHeight: 1.75, color: ice60 }}>
                  Enter your account email and we'll send a reset link.
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
                <div className="mb-6">
                  <FieldLabel htmlFor="fp-email">Email address</FieldLabel>
                  <TextInput
                    id="fp-email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="you@example.com"
                    autoComplete="email"
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
                  {state === 'loading' ? 'Sending…' : <>Send reset link <ChevronRight size={13} /></>}
                </button>
              </form>

              <Hairline className="my-7" />

              <p className="font-barlow text-center" style={{ fontSize: '14px', fontWeight: 300, color: ice60 }}>
                Remember it?{' '}
                <Link to="/login" className="transition-opacity hover:opacity-80" style={{ color: gold }}>
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </main>
    </>
  );
}
