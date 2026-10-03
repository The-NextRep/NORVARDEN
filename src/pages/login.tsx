import { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { Link, useSearchParams } from 'react-router';
import { toSafeInternalPath } from '@/lib/auth/safe-redirect';
import { Eye, EyeOff, ChevronRight, Shield, Mail, RotateCcw, X } from 'lucide-react';
import BrandMark from '@/components/BrandMark';

const siteUrl = 'https://www.norvarden.com';

// ─── Design tokens ────────────────────────────────────────────────────────
const navy         = 'hsl(var(--hero-navy))';
const gold         = 'hsl(var(--hero-gold))';
const white        = 'hsl(var(--hero-white))';
const ice60        = 'hsl(var(--hero-ice-60))';
const ice          = 'hsl(var(--hero-ice))';
const goldBorder35 = '1px solid hsl(var(--hero-gold) / 0.35)';
const goldBorder60 = '1px solid hsl(var(--hero-gold) / 0.60)';
const goldGradient = `linear-gradient(to right, transparent, ${gold} 30%, ${gold} 70%, transparent)`;

// ─── Shared primitives ────────────────────────────────────────────────────
function Hairline({ className = '' }: { className?: string }) {
  return <div className={className} style={{ height: '1px', background: goldGradient }} aria-hidden="true" />;
}

function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="font-barlow-condensed uppercase block mb-2"
      style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.30em', color: gold }}
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

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      className="flex items-start gap-3 p-4"
      style={{ border: '1px solid hsl(var(--destructive) / 0.50)', borderRadius: '3px', background: 'hsl(var(--destructive) / 0.08)' }}
      role="alert"
    >
      <p className="font-barlow" style={{ fontSize: '14px', fontWeight: 300, lineHeight: 1.65, color: 'hsl(var(--destructive))' }}>
        {message}
      </p>
    </div>
  );
}

// ─── Lockout countdown ────────────────────────────────────────────────────
function LockoutBox({ lockedUntilMs, onExpired }: { lockedUntilMs: number; onExpired: () => void }) {
  const [secsLeft, setSecsLeft] = useState(() => Math.max(0, Math.ceil((lockedUntilMs - Date.now()) / 1000)));

  useEffect(() => {
    if (secsLeft <= 0) { onExpired(); return; }
    const t = setInterval(() => {
      const s = Math.max(0, Math.ceil((lockedUntilMs - Date.now()) / 1000));
      setSecsLeft(s);
      if (s <= 0) { clearInterval(t); onExpired(); }
    }, 1000);
    return () => clearInterval(t);
  }, [lockedUntilMs, onExpired]);

  const mins = Math.floor(secsLeft / 60);
  const secs = secsLeft % 60;
  const display = mins > 0 ? `${mins}m ${String(secs).padStart(2, '0')}s` : `${secs}s`;

  return (
    <div
      className="flex flex-col items-center gap-3 p-6 text-center"
      style={{ border: '1px solid hsl(var(--hero-gold) / 0.30)', borderRadius: '3px', background: 'hsl(var(--hero-gold) / 0.06)' }}
    >
      <div
        className="font-bodoni"
        style={{ fontSize: '2.8rem', fontWeight: 400, lineHeight: 1, color: gold, letterSpacing: '-0.01em' }}
      >
        {display}
      </div>
      <p className="font-barlow-condensed uppercase" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.30em', color: ice60 }}>
        Account locked
      </p>
      <p className="font-barlow" style={{ fontSize: '14px', fontWeight: 300, lineHeight: 1.7, color: ice60, maxWidth: '300px' }}>
        Too many failed attempts. Your account will unlock automatically when the timer reaches zero.
      </p>
    </div>
  );
}

// ─── OTP digit input ──────────────────────────────────────────────────────
function OtpInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const digits = value.split('').concat(Array(6).fill('')).slice(0, 6);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function handleKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = digits.map((d, idx) => idx === i ? '' : d).join('').slice(0, 6);
      onChange(next);
      if (i > 0) refs.current[i - 1]?.focus();
    }
  }

  function handleChange(i: number, v: string) {
    const char = v.replace(/\D/g, '').slice(-1);
    const next = digits.map((d, idx) => idx === i ? char : d).join('').slice(0, 6);
    onChange(next);
    if (char && i < 5) refs.current[i + 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, 5);
    refs.current[focusIdx]?.focus();
  }

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          disabled={disabled}
          className="font-bodoni text-center"
          style={{
            width: '48px',
            height: '60px',
            fontSize: '1.6rem',
            fontWeight: 400,
            color: white,
            background: 'hsl(var(--hero-navy-80))',
            border: d ? goldBorder60 : goldBorder35,
            borderRadius: '3px',
            outline: 'none',
          }}
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}

// ─── Forgot-password modal ────────────────────────────────────────────────
function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [fpEmail, setFpEmail]   = useState('');
  const [fpState, setFpState]   = useState<'idle' | 'loading' | 'sent'>('idle');
  const [fpError, setFpError]   = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFpError('');
    if (!fpEmail.trim()) return setFpError('Please enter your email address.');
    setFpState('loading');
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fpEmail.trim() }),
        credentials: 'include',
      });
    } catch {
      // Swallow — always show success to avoid enumeration
    }
    setFpState('sent');
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'hsl(var(--hero-navy) / 0.85)', backdropFilter: 'blur(6px)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Reset your password"
    >
      <div
        className="w-full max-w-md p-8 relative"
        style={{ background: 'hsl(var(--hero-card-bg))', border: goldBorder35, borderRadius: '3px' }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center transition-opacity hover:opacity-60"
          style={{ color: ice60 }}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {fpState !== 'sent' ? (
          <>
            <h2
              className="font-bodoni mb-2"
              style={{ fontSize: '1.8rem', fontWeight: 400, lineHeight: 1.05, color: white }}
            >
              Reset your{' '}
              <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>password.</em>
            </h2>
            <p className="font-barlow mb-6" style={{ fontSize: '14px', fontWeight: 300, lineHeight: 1.7, color: ice60 }}>
              Enter the email address on your account and we'll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <div>
                <FieldLabel htmlFor="fp-email">Email address</FieldLabel>
                <TextInput
                  id="fp-email"
                  value={fpEmail}
                  onChange={setFpEmail}
                  placeholder="you@example.com"
                  type="email"
                  autoComplete="email"
                  disabled={fpState === 'loading'}
                />
              </div>
              {fpError && <ErrorBox message={fpError} />}
              <button
                type="submit"
                disabled={fpState === 'loading'}
                className="gold-shimmer-bg font-barlow-condensed uppercase w-full flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em', padding: '16px 0', borderRadius: '3px', color: navy }}
              >
                {fpState === 'loading' ? 'Sending…' : <>Send reset link <ChevronRight size={13} /></>}
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center py-4">
            <div
              className="flex items-center justify-center"
              style={{ width: '52px', height: '52px', borderRadius: '50%', border: goldBorder35, background: 'hsl(var(--hero-gold) / 0.10)' }}
            >
              <Mail size={22} style={{ color: gold }} />
            </div>
            <h2 className="font-bodoni" style={{ fontSize: '1.8rem', fontWeight: 400, lineHeight: 1.05, color: white }}>
              Check your{' '}
              <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>email.</em>
            </h2>
            <p className="font-barlow" style={{ fontSize: '14px', fontWeight: 300, lineHeight: 1.75, color: ice60, maxWidth: '320px' }}>
              If an account exists for <strong style={{ color: ice }}>{fpEmail}</strong>, you'll receive a reset link within a few minutes.
            </p>
            <button
              onClick={onClose}
              className="font-barlow-condensed uppercase transition-opacity hover:opacity-70 mt-2"
              style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em', color: ice60 }}
            >
              Back to login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── View types ───────────────────────────────────────────────────────────
type View = 'credentials' | 'locked' | '2fa';

// ─── Page ─────────────────────────────────────────────────────────────────
export default function LoginPage() {
  // navigate removed — post-login redirects use window.location.href (hard reload) so the
  // auth module-level cache resets and AdminGuard reads the new session cookie correctly.

  // Form state
const [searchParams] = useSearchParams();
  const nextPath = toSafeInternalPath(searchParams.get('next'));
  const resetSuccess = searchParams.get('reset') === 'success';

    const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  // View routing
  const [view, setView]                   = useState<View>('credentials');
  const [lockedUntilMs, setLockedUntilMs] = useState(0);
  const [attemptsLeft, setAttemptsLeft]   = useState<number | null>(null);

  // 2FA state
  const [twoFaUserId, setTwoFaUserId]           = useState('');
  const [twoFaDeliveryEmail, setTwoFaDeliveryEmail] = useState('');
  const [otpCode, setOtpCode]                   = useState('');
  const [otpError, setOtpError]                 = useState('');
  const [otpLoading, setOtpLoading]             = useState(false);
  const [resendCooldown, setResendCooldown]     = useState(0);
  const [resendsRemaining, setResendsRemaining] = useState(3);
  const [resendLoading, setResendLoading]       = useState(false);

  // Forgot password
  const [showForgot, setShowForgot] = useState(false);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleLockExpired = useCallback(() => {
    setView('credentials');
    setError('');
    setAttemptsLeft(null);
  }, []);

  // ── Submit credentials ─────────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setAttemptsLeft(null);

    if (!email.trim()) return setError('Email is required.');
    if (!password)     return setError('Password is required.');

    setLoading(true);
    let data: Record<string, unknown>;
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
        credentials: 'include',
      });
      data = await res.json();
    } catch {
      setLoading(false);
      return setError('Network error. Please check your connection and try again.');
    }
    setLoading(false);

    if (data.error === 'locked') {
      setLockedUntilMs(data.lockedUntilMs as number);
      setView('locked');
      return;
    }

    if (data.error === 'invalid_credentials') {
      const left = data.attemptsRemaining as number;
      setAttemptsLeft(left);
      setError(data.message as string);
      return;
    }

    if (data.error) {
      setError((data.message as string) || 'Something went wrong. Please try again.');
      return;
    }

    if (data.step === '2fa_required') {
      setTwoFaUserId(data.userId as string);
      setTwoFaDeliveryEmail((data.deliveryEmail as string) || email.trim());
      setOtpCode('');
      setOtpError('');
      setResendCooldown(30);
      setResendsRemaining(3);
      setView('2fa');
      return;
    }

    if (data.step === 'done') {
      // Hard redirect so the auth module cache resets and AdminGuard reads the new session cookie.
      window.location.href = nextPath ?? (data.destination as string);
    }
  }

  // ── Submit 2FA code ────────────────────────────────────────────────────
  async function handleVerify2FA(e: React.FormEvent) {
    e.preventDefault();
    setOtpError('');
    if (otpCode.length < 6) return setOtpError('Enter all 6 digits of your verification code.');

    setOtpLoading(true);
    let data: Record<string, unknown>;
    try {
      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: twoFaUserId, code: otpCode }),
        credentials: 'include',
      });
      data = await res.json();
    } catch {
      setOtpLoading(false);
      return setOtpError('Network error. Please try again.');
    }
    setOtpLoading(false);

    if (data.error === 'expired') {
      setOtpError('__expired__');
      return;
    }
    if (data.error) {
      setOtpError((data.message as string) || 'Incorrect code. Please try again.');
      return;
    }
    if (data.step === 'done') {
      // Hard redirect so the auth module cache resets and AdminGuard reads the new session cookie.
      window.location.href = nextPath ?? (data.destination as string);
    }
  }

  // ── Resend OTP ─────────────────────────────────────────────────────────
  async function handleResend() {
    if (resendCooldown > 0 || resendsRemaining <= 0 || resendLoading) return;
    setOtpError('');
    setOtpCode('');
    setResendLoading(true);
    let data: Record<string, unknown>;
    try {
      const res = await fetch('/api/auth/resend-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: twoFaUserId }),
        credentials: 'include',
      });
      data = await res.json();
    } catch {
      setResendLoading(false);
      setOtpError('Could not resend code. Please check your connection and try again.');
      return;
    }
    setResendLoading(false);

    if (data.error === 'resend_limit') {
      setResendsRemaining(0);
      setOtpError(data.message as string);
      return;
    }
    if (data.error === 'no_pending_session') {
      setOtpError('Your session has expired. Please sign in again.');
      setView('credentials');
      return;
    }
    if (data.error) {
      setOtpError((data.message as string) || 'Could not resend code. Please try again.');
      return;
    }
    // Success
    setResendsRemaining(data.resendsRemaining as number);
    setResendCooldown(60);
  }

  const pageUrl = `${siteUrl}/login`;

  return (
    <>
      <Helmet>
        <title>Log in — NORVARDEN</title>
        <meta name="description" content="Sign in to NORVARDEN — the verified job board for people with disabilities." />
        <link rel="canonical" href={pageUrl} />
        <meta name="robots" content="noindex" />
      </Helmet>

      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}

      <main className="min-h-screen flex flex-col" style={{ background: navy }}>
        {/* Background texture */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            backgroundImage: 'url(/images/arena-aerial-gold.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center 30%',
            opacity: 0.06,
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-16 pt-28">
          <div className="w-full max-w-md">

            {/* Logo */}
            <div className="mb-10">
              <Link to="/" aria-label="NORVARDEN home" className="inline-flex transition-opacity hover:opacity-80">
                <BrandMark size={22} />
              </Link>
            </div>

            <Hairline className="mb-10" />

            {/* ── LOCKED VIEW ──────────────────────────────────────────── */}
            {view === 'locked' && (
              <div className="flex flex-col gap-6">
                <div>
                  <h1
                    className="font-bodoni mb-3"
                    style={{ fontSize: 'clamp(2rem, 4.5vw, 2.8rem)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.01em', color: white }}
                  >
                    Account{' '}
                    <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>locked.</em>
                  </h1>
                  <p className="font-barlow" style={{ fontSize: '15px', fontWeight: 300, lineHeight: 1.75, color: ice60 }}>
                    Your account has been temporarily locked after too many failed sign-in attempts.
                  </p>
                </div>
                <LockoutBox lockedUntilMs={lockedUntilMs} onExpired={handleLockExpired} />
                <p className="font-barlow text-center" style={{ fontSize: '13px', fontWeight: 300, color: ice60 }}>
                  Forgot your password?{' '}
                  <button
                    onClick={() => setShowForgot(true)}
                    className="transition-opacity hover:opacity-80"
                    style={{ color: gold }}
                  >
                    Reset it here
                  </button>
                </p>
              </div>
            )}

            {/* ── 2FA VIEW ─────────────────────────────────────────────── */}
            {view === '2fa' && (
              <form onSubmit={handleVerify2FA} noValidate className="flex flex-col gap-6">
                <div>
                  <div
                    className="inline-flex items-center gap-2 mb-4 px-3 py-1.5"
                    style={{ border: goldBorder35, borderRadius: '2px', background: 'hsl(var(--hero-gold) / 0.08)' }}
                  >
                    <Shield size={11} style={{ color: gold }} aria-hidden="true" />
                    <span
                      className="font-barlow-condensed uppercase"
                      style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.30em', color: gold }}
                    >
                      Two-step verification
                    </span>
                  </div>
                  <h1
                    className="font-bodoni mb-3"
                    style={{ fontSize: 'clamp(2rem, 4.5vw, 2.8rem)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.01em', color: white }}
                  >
                    Check your{' '}
                    <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>email.</em>
                  </h1>
                  <p className="font-barlow" style={{ fontSize: '15px', fontWeight: 300, lineHeight: 1.75, color: ice60 }}>
                    We sent a 6-digit code to{' '}
                    <strong style={{ color: ice }}>{twoFaDeliveryEmail || email}</strong>.
                    Enter it below to continue.
                  </p>
                </div>

                <OtpInput value={otpCode} onChange={setOtpCode} disabled={otpLoading} />

                {otpError === '__expired__' ? (
                  <div
                    className="flex flex-col gap-3 p-4"
                    style={{ border: '1px solid hsl(var(--hero-gold) / 0.35)', borderRadius: '3px', background: 'hsl(var(--hero-gold) / 0.06)' }}
                    role="alert"
                  >
                    <p className="font-barlow" style={{ fontSize: '14px', fontWeight: 300, lineHeight: 1.65, color: ice60 }}>
                      Your verification code has expired.
                    </p>
                    <button
                      type="button"
                      onClick={() => { setView('credentials'); setOtpCode(''); setOtpError(''); }}
                      className="font-barlow-condensed uppercase self-start transition-opacity hover:opacity-80"
                      style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.30em', color: gold }}
                    >
                      ← Sign in again to get a new code
                    </button>
                  </div>
                ) : otpError ? (
                  <ErrorBox message={otpError} />
                ) : null}

                <button
                  type="submit"
                  disabled={otpLoading || otpCode.length < 6 || otpError === '__expired__'}
                  className="gold-shimmer-bg font-barlow-condensed uppercase w-full flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em', padding: '17px 0', borderRadius: '3px', color: navy }}
                >
                  {otpLoading ? 'Verifying…' : <>Verify and sign in <ChevronRight size={13} /></>}
                </button>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => { setView('credentials'); setOtpCode(''); setOtpError(''); }}
                    className="font-barlow-condensed uppercase transition-opacity hover:opacity-70"
                    style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em', color: ice60 }}
                  >
                    ← Back to login
                  </button>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || resendsRemaining <= 0 || resendLoading}
                    className="flex items-center gap-1.5 font-barlow-condensed uppercase transition-opacity hover:opacity-70 disabled:opacity-40"
                    style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em', color: resendCooldown > 0 ? ice60 : gold }}
                  >
                    <RotateCcw size={11} className={resendLoading ? 'animate-spin' : ''} />
                    {resendLoading
                      ? 'Sending…'
                      : resendCooldown > 0
                        ? `Resend in ${resendCooldown}s`
                        : resendsRemaining <= 0
                          ? 'No resends remaining'
                          : resendsRemaining < 3
                            ? `Resend code (${resendsRemaining} left)`
                            : 'Resend code'}
                  </button>
                </div>
              </form>
            )}

            {/* ── CREDENTIALS VIEW ─────────────────────────────────────── */}
            {view === 'credentials' && (
              <>
                <h1
                  className="font-bodoni mb-3"
                  style={{ fontSize: 'clamp(2rem, 4.5vw, 2.8rem)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.01em', color: white }}
                >
                  Welcome{' '}
                  <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>back.</em>
                </h1>
                <p className="font-barlow mb-10" style={{ fontSize: '15px', fontWeight: 300, lineHeight: 1.75, color: ice60 }}>
                  Sign in to browse verified opportunities and manage your profile.
                </p>

                <form onSubmit={handleLogin} noValidate className="flex flex-col gap-5">
    {resetSuccess && (
                <div
                  className="flex items-start gap-3 p-4 mb-5"
                  style={{ border: '1px solid hsl(var(--hero-gold) / 0.45)', borderRadius: '3px', background: 'hsl(var(--hero-gold) / 0.07)' }}
                  role="status"
                >
                  <p className="font-barlow" style={{ fontSize: '14px', fontWeight: 300, lineHeight: 1.65, color: 'hsl(var(--hero-white))' }}>
                    Password updated. Please sign in.
                  </p>
                </div>
              )}

              {/* Email */}
                  <div>
                    <FieldLabel htmlFor="login-email">Email address</FieldLabel>
                    <TextInput
                      id="login-email"
                      value={email}
                      onChange={setEmail}
                      placeholder="you@example.com"
                      type="email"
                      autoComplete="email"
                      disabled={loading}
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <FieldLabel htmlFor="login-password">Password</FieldLabel>
                      <button
                        type="button"
                        onClick={() => setShowForgot(true)}
                        className="font-barlow-condensed uppercase transition-opacity hover:opacity-80"
                        style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.28em', color: 'hsl(var(--hero-gold) / 0.65)' }}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <TextInput
                        id="login-password"
                        value={password}
                        onChange={setPassword}
                        placeholder="Your password"
                        type={showPw ? 'text' : 'password'}
                        autoComplete="current-password"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((s) => !s)}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center transition-opacity hover:opacity-70"
                        style={{ color: ice60 }}
                        aria-label={showPw ? 'Hide password' : 'Show password'}
                      >
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Attempt warning */}
                  {attemptsLeft !== null && attemptsLeft <= 2 && !error.includes('locked') && (
                    <div
                      className="flex items-start gap-3 px-4 py-3"
                      style={{ border: '1px solid hsl(var(--hero-gold) / 0.40)', borderRadius: '3px', background: 'hsl(var(--hero-gold) / 0.07)' }}
                    >
                      <p className="font-barlow" style={{ fontSize: '13px', fontWeight: 300, lineHeight: 1.65, color: ice60 }}>
                        <strong style={{ color: gold }}>{attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining</strong> before your account is locked for 15 minutes.
                      </p>
                    </div>
                  )}

                  {/* Error */}
                  {error && <ErrorBox message={error} />}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="gold-shimmer-bg font-barlow-condensed uppercase w-full flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50 mt-1"
                    style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em', padding: '17px 0', borderRadius: '3px', color: navy }}
                  >
                    {loading ? 'Signing in…' : <>Sign in <ChevronRight size={13} /></>}
                  </button>
                </form>

                <Hairline className="my-8" />

                <div className="flex flex-col gap-4">
                  <p className="font-barlow text-center" style={{ fontSize: '14px', fontWeight: 300, color: ice60 }}>
                    New here?{' '}
                    <Link to="/signup" className="transition-opacity hover:opacity-80" style={{ color: gold }}>
                      Join free
                    </Link>
                  </p>
                  <p className="font-barlow text-center" style={{ fontSize: '14px', fontWeight: 300, color: ice60 }}>
                    Hiring?{' '}
                    <Link to="/for-companies" className="transition-opacity hover:opacity-80" style={{ color: gold }}>
                      Get started
                    </Link>
                  </p>
                  <div
                    className="flex items-start gap-3 p-4"
                    style={{ border: goldBorder35, borderRadius: '3px', background: 'hsl(var(--hero-gold) / 0.05)' }}
                  >
                    <Shield size={13} strokeWidth={2} style={{ color: gold, marginTop: '2px', flexShrink: 0 }} aria-hidden="true" />
                    <p className="font-barlow" style={{ fontSize: '13px', fontWeight: 300, lineHeight: 1.65, color: ice60 }}>
                      NORVARDEN never shares your contact details with employers without your explicit permission.
                    </p>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </main>
    </>
  );
}
