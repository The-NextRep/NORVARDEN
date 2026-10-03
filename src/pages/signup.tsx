import { useEffect, useState } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { Link, useNavigate } from 'react-router';
import { authClient } from '@/lib/auth/auth-client';
import { refreshCurrentUser, useCurrentUser } from '@/lib/auth/use-current-user';
import { ChevronRight, Eye, EyeOff, Check, Shield } from 'lucide-react';
import BrandMark from '@/components/BrandMark';

const siteUrl = 'https://www.norvarden.com';

// ─── Design tokens ────────────────────────────────────────────────────────
const navy         = 'hsl(var(--hero-navy))';
const gold         = 'hsl(var(--hero-gold))';
const white        = 'hsl(var(--hero-white))';
const ice60        = 'hsl(var(--hero-ice-60))';
const ice          = 'hsl(var(--hero-ice))';
const cardBg       = 'hsl(var(--hero-card-bg))';
const goldBorder35 = '1px solid hsl(var(--hero-gold) / 0.35)';
const goldBorder60 = '1px solid hsl(var(--hero-gold) / 0.60)';
const goldGradient = `linear-gradient(to right, transparent, ${gold} 30%, ${gold} 70%, transparent)`;

// ─── Types ────────────────────────────────────────────────────────────────
type MemberType = 'athlete' | 'coach' | 'veteran' | 'employer';

interface FormState {
  // Step 1 — member type
  memberType: MemberType | '';
  // Step 2 — account
  email: string;
  password: string;
  confirmPassword: string;
  // Step 3 — profile (shared)
  firstName: string;
  lastName: string;
  city: string;
  state: string;
  linkedinUrl: string;
  bio: string;
  // Athlete
  sport: string;
  league: string;
  yearsActive: string;
  // Coach
  coachingLevel: string;
  coachingSport: string;
  yearsCoaching: string;
  // Veteran
  branch: string;
  mos: string;
  yearsServed: string;
  isSkillbridgeEligible: boolean;
  // Employer
  companyName: string;
  companyRole: string;
}

const INITIAL: FormState = {
  memberType: '', email: '', password: '', confirmPassword: '',
  firstName: '', lastName: '', city: '', state: '', linkedinUrl: '', bio: '',
  sport: '', league: '', yearsActive: '',
  coachingLevel: '', coachingSport: '', yearsCoaching: '',
  branch: '', mos: '', yearsServed: '', isSkillbridgeEligible: false,
  companyName: '', companyRole: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────
function Hairline({ className = '' }: { className?: string }) {
  return <div className={className} style={{ height: '1px', background: goldGradient }} aria-hidden="true" />;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="font-barlow-condensed uppercase block mb-2"
      style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.30em', color: gold }}
    >
      {children}
    </label>
  );
}

function TextInput({
  value, onChange, placeholder, type = 'text', autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      className="w-full font-barlow"
      style={{
        background: 'hsl(var(--hero-navy-80))',
        border: goldBorder35,
        borderRadius: '3px',
        padding: '12px 14px',
        fontSize: '15px',
        fontWeight: 300,
        color: white,
        outline: 'none',
      }}
      onFocus={(e) => { e.currentTarget.style.border = goldBorder60; }}
      onBlur={(e) => { e.currentTarget.style.border = goldBorder35; }}
    />
  );
}

function SelectInput({
  value, onChange, children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full font-barlow"
      style={{
        background: 'hsl(var(--hero-navy-80))',
        border: goldBorder35,
        borderRadius: '3px',
        padding: '12px 14px',
        fontSize: '15px',
        fontWeight: 300,
        color: value ? white : ice60,
        outline: 'none',
      }}
    >
      {children}
    </select>
  );
}

function TextareaInput({
  value, onChange, placeholder, rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full font-barlow resize-none"
      style={{
        background: 'hsl(var(--hero-navy-80))',
        border: goldBorder35,
        borderRadius: '3px',
        padding: '12px 14px',
        fontSize: '15px',
        fontWeight: 300,
        color: white,
        outline: 'none',
      }}
      onFocus={(e) => { e.currentTarget.style.border = goldBorder60; }}
      onBlur={(e) => { e.currentTarget.style.border = goldBorder35; }}
    />
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────
function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === step - 1 ? '24px' : '6px',
            height: '3px',
            borderRadius: '2px',
            background: i < step ? gold : 'hsl(var(--hero-gold) / 0.25)',
            transition: 'all 0.3s ease',
          }}
        />
      ))}
      <span
        className="font-barlow-condensed uppercase ml-2"
        style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em', color: ice60 }}
      >
        Step {step} of {total}
      </span>
    </div>
  );
}

// ─── Member type cards ────────────────────────────────────────────────────
const MEMBER_TYPES: { type: MemberType; label: string; description: string; href: string }[] = [
  // Job seekers are stored as 'athlete' until the member types are renamed in the database.
  { type: 'athlete',  label: 'Job seeker', description: 'Looking for work, an internship or your next role', href: '/jobs' },
  { type: 'employer', label: 'Employer', description: 'Hiring manager or recruiter at a verified company', href: '/for-companies' },
];

// ─── Page ─────────────────────────────────────────────────────────────────
export default function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Signed in already: finished accounts go to their home page; accounts that
  // stopped before the profile step resume there (step 2 would fail with
  // "already exists").
  const { user } = useCurrentUser();
  const hasAccount = !!user;
  useEffect(() => {
    if (!user || step !== 1) return;
    if (user.isAdmin) navigate('/admin', { replace: true });
    else if (user.memberType === 'employer') navigate('/company/dashboard', { replace: true });
    else if (user.memberType) navigate('/dashboard', { replace: true });
  }, [user, step, navigate]);

  const set = (field: keyof FormState, value: string | boolean) =>
    setForm((f) => ({ ...f, [field]: value }));

  // ── Step 2: create BetterAuth account ────────────────────────────────
  async function handleCreateAccount() {
    setError('');
    if (!form.email.trim()) return setError('Email is required.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError('Enter a valid email address.');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');

    setLoading(true);
    const { error: authErr } = await authClient.signUp.email({
      email: form.email.trim(),
      password: form.password,
      name: '',
    });
    setLoading(false);

    if (authErr) {
      if (authErr.message?.toLowerCase().includes('already')) {
        return setError('An account with this email already exists. Try logging in.');
      }
      return setError(authErr.message || 'Could not create account. Please try again.');
    }
    void refreshCurrentUser();
    setStep(3);
  }

  // ── Step 3: save profile ──────────────────────────────────────────────
  async function handleSaveProfile() {
    setError('');
    if (!form.firstName.trim() || !form.lastName.trim()) {
      return setError('First and last name are required.');
    }

    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        memberType: form.memberType,
        firstName: form.firstName,
        lastName: form.lastName,
        city: form.city,
        state: form.state,
        linkedinUrl: form.linkedinUrl,
        bio: form.bio,
      };
      if (form.memberType === 'athlete') {
        body.sport = form.sport;
        body.league = form.league;
        body.yearsActive = form.yearsActive;
      } else if (form.memberType === 'coach') {
        body.coachingLevel = form.coachingLevel;
        body.coachingSport = form.coachingSport;
        body.yearsCoaching = form.yearsCoaching;
      } else if (form.memberType === 'veteran') {
        body.branch = form.branch;
        body.mos = form.mos;
        body.yearsServed = form.yearsServed;
        body.isSkillbridgeEligible = form.isSkillbridgeEligible;
      } else if (form.memberType === 'employer') {
        body.companyName = form.companyName;
        body.companyRole = form.companyRole;
      }

      const res = await fetch('/api/auth/signup-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save profile.');
      }
    } catch (err: unknown) {
      setLoading(false);
      return setError(err instanceof Error ? err.message : 'Failed to save profile.');
    }
    await refreshCurrentUser();
    setLoading(false);
    setStep(4);
  }

  const pageUrl = `${siteUrl}/signup`;

  return (
    <>
      <Helmet>
        <title>Join free — NORVARDEN</title>
        <meta name="description" content="Create your free account on NORVARDEN. Free for job seekers with disabilities; verified, inclusive employers. Private by design." />
        <link rel="canonical" href={pageUrl} />
        <meta name="robots" content="noindex" />
      </Helmet>

      <main
        className="min-h-screen flex flex-col"
        style={{ background: navy }}
      >
        {/* Background texture */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            backgroundImage: 'url(/images/city-skyline-sunset.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.07,
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-16 pt-28">
          <div className="w-full max-w-lg">

            {/* Logo / back link */}
            <div className="mb-10 flex items-center justify-between">
              <Link to="/" aria-label="NORVARDEN home" className="inline-flex transition-opacity hover:opacity-80">
                <BrandMark size={22} />
              </Link>
              {step > 1 && step < 4 && (
                <button
                  onClick={() => { setError(''); setStep(step === 3 && hasAccount ? 1 : step - 1); }}
                  className="font-barlow-condensed uppercase transition-opacity hover:opacity-70"
                  style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em', color: ice60 }}
                >
                  ← Back
                </button>
              )}
            </div>

            <Hairline className="mb-10" />

            {/* ── STEP 1: Choose member type ──────────────────────────── */}
            {step === 1 && (
              <div>
                <StepDots step={1} total={3} />
                <h1
                  className="font-bodoni mb-3"
                  style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.01em', color: white }}
                >
                  I am a{' '}
                  <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>
                    {form.memberType || 'member.'}
                  </em>
                </h1>
                <p
                  className="font-barlow mb-8"
                  style={{ fontSize: '15px', fontWeight: 300, lineHeight: 1.75, color: ice60 }}
                >
                  Choose the option that best describes you. This shapes your profile and the jobs you see.
                </p>

                <div className="grid grid-cols-1 gap-3 mb-8">
                  {MEMBER_TYPES.map(({ type, label, description }) => {
                    const selected = form.memberType === type;
                    return (
                      <button
                        key={type}
                        onClick={() => set('memberType', type)}
                        className="text-left flex items-start gap-4 p-5 transition-all"
                        style={{
                          background: selected ? 'hsl(var(--hero-gold) / 0.10)' : cardBg,
                          border: selected ? goldBorder60 : goldBorder35,
                          borderRadius: '3px',
                        }}
                      >
                        <div
                          className="mt-0.5 shrink-0 flex items-center justify-center"
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: selected ? `2px solid ${gold}` : '2px solid hsl(var(--hero-gold) / 0.35)',
                            background: selected ? gold : 'transparent',
                            transition: 'all 0.2s',
                          }}
                        >
                          {selected && <Check size={10} strokeWidth={3} style={{ color: navy }} />}
                        </div>
                        <div>
                          <p
                            className="font-barlow-condensed uppercase mb-1"
                            style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em', color: selected ? gold : white }}
                          >
                            {label}
                          </p>
                          <p
                            className="font-barlow"
                            style={{ fontSize: '14px', fontWeight: 300, lineHeight: 1.6, color: ice60 }}
                          >
                            {description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {error && (
                  <p className="font-barlow mb-4" style={{ fontSize: '14px', fontWeight: 300, color: 'hsl(var(--destructive))' }}>
                    {error}
                  </p>
                )}

                <button
                  onClick={() => {
                    if (!form.memberType) return setError('Please choose a member type to continue.');
                    setError('');
                    setStep(hasAccount ? 3 : 2);
                  }}
                  className="gold-shimmer-bg font-barlow-condensed uppercase w-full flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                  style={{
                    fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em',
                    padding: '17px 0', borderRadius: '3px', color: navy,
                  }}
                >
                  Continue <ChevronRight size={13} />
                </button>

                <p
                  className="font-barlow text-center mt-6"
                  style={{ fontSize: '14px', fontWeight: 300, color: ice60 }}
                >
                  Already have an account?{' '}
                  <Link to="/login" className="transition-opacity hover:opacity-80" style={{ color: gold }}>
                    Log in
                  </Link>
                </p>
              </div>
            )}

            {/* ── STEP 2: Email + password ────────────────────────────── */}
            {step === 2 && (
              <div>
                <StepDots step={2} total={3} />
                <h1
                  className="font-bodoni mb-3"
                  style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.01em', color: white }}
                >
                  Create your{' '}
                  <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>account.</em>
                </h1>
                <p
                  className="font-barlow mb-8"
                  style={{ fontSize: '15px', fontWeight: 300, lineHeight: 1.75, color: ice60 }}
                >
                  Your email is never shared with employers until you say yes.
                </p>

                <div className="flex flex-col gap-5 mb-6">
                  <div>
                    <FieldLabel>Email address</FieldLabel>
                    <TextInput
                      value={form.email}
                      onChange={(v) => set('email', v)}
                      placeholder="you@example.com"
                      type="email"
                      autoComplete="email"
                    />
                  </div>

                  <div>
                    <FieldLabel>Password</FieldLabel>
                    <div className="relative">
                      <TextInput
                        value={form.password}
                        onChange={(v) => set('password', v)}
                        placeholder="At least 8 characters"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                        style={{ color: ice60 }}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <FieldLabel>Confirm password</FieldLabel>
                    <div className="relative">
                      <TextInput
                        value={form.confirmPassword}
                        onChange={(v) => set('confirmPassword', v)}
                        placeholder="Repeat your password"
                        type={showConfirm ? 'text' : 'password'}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                        style={{ color: ice60 }}
                        aria-label={showConfirm ? 'Hide password' : 'Show password'}
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {error && (
                  <p className="font-barlow mb-4" style={{ fontSize: '14px', fontWeight: 300, color: 'hsl(var(--destructive))' }}>
                    {error}
                  </p>
                )}

                <button
                  onClick={handleCreateAccount}
                  disabled={loading}
                  className="gold-shimmer-bg font-barlow-condensed uppercase w-full flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{
                    fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em',
                    padding: '17px 0', borderRadius: '3px', color: navy,
                  }}
                >
                  {loading ? 'Creating account…' : <>Continue <ChevronRight size={13} /></>}
                </button>

                <div className="flex items-start gap-3 mt-6 p-4" style={{ border: goldBorder35, borderRadius: '3px', background: 'hsl(var(--hero-gold) / 0.05)' }}>
                  <Shield size={13} strokeWidth={2} style={{ color: gold, marginTop: '2px', flexShrink: 0 }} aria-hidden="true" />
                  <p className="font-barlow" style={{ fontSize: '13px', fontWeight: 300, lineHeight: 1.65, color: ice60 }}>
                    Your contact details are never shared with employers without your permission.
                  </p>
                </div>
              </div>
            )}

            {/* ── STEP 3: Profile fields ──────────────────────────────── */}
            {step === 3 && (
              <div>
                <StepDots step={3} total={3} />
                <h1
                  className="font-bodoni mb-3"
                  style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.01em', color: white }}
                >
                  Build your{' '}
                  <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>profile.</em>
                </h1>
                <p
                  className="font-barlow mb-8"
                  style={{ fontSize: '15px', fontWeight: 300, lineHeight: 1.75, color: ice60 }}
                >
                  This is what verified employers see. You can update everything later.
                </p>

                <div className="flex flex-col gap-5 mb-6">
                  {/* Shared fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>First name *</FieldLabel>
                      <TextInput value={form.firstName} onChange={(v) => set('firstName', v)} placeholder="First" autoComplete="given-name" />
                    </div>
                    <div>
                      <FieldLabel>Last name *</FieldLabel>
                      <TextInput value={form.lastName} onChange={(v) => set('lastName', v)} placeholder="Last" autoComplete="family-name" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>City</FieldLabel>
                      <TextInput value={form.city} onChange={(v) => set('city', v)} placeholder="City" autoComplete="address-level2" />
                    </div>
                    <div>
                      <FieldLabel>State</FieldLabel>
                      <TextInput value={form.state} onChange={(v) => set('state', v)} placeholder="State" autoComplete="address-level1" />
                    </div>
                  </div>

                  <div>
                    <FieldLabel>LinkedIn URL</FieldLabel>
                    <TextInput value={form.linkedinUrl} onChange={(v) => set('linkedinUrl', v)} placeholder="linkedin.com/in/yourname" />
                  </div>

                  <div>
                    <FieldLabel>Short bio</FieldLabel>
                    <TextareaInput value={form.bio} onChange={(v) => set('bio', v)} placeholder="A sentence or two about your background…" rows={3} />
                  </div>

                  {/* ── Coach fields ── */}
                  {form.memberType === 'coach' && (
                    <>
                      <Hairline />
                      <p className="font-barlow-condensed uppercase" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.30em', color: gold }}>
                        Coaching background
                      </p>
                      <div>
                        <FieldLabel>Coaching level</FieldLabel>
                        <SelectInput value={form.coachingLevel} onChange={(v) => set('coachingLevel', v)}>
                          <option value="" disabled>Select level…</option>
                          <option value="youth">Youth</option>
                          <option value="high_school">High school</option>
                          <option value="college">College</option>
                          <option value="professional">Professional</option>
                          <option value="club">Club / academy</option>
                        </SelectInput>
                      </div>
                      <div>
                        <FieldLabel>Sport</FieldLabel>
                        <TextInput value={form.coachingSport} onChange={(v) => set('coachingSport', v)} placeholder="e.g. Basketball, Track, Swimming" />
                      </div>
                      <div>
                        <FieldLabel>Years coaching</FieldLabel>
                        <TextInput value={form.yearsCoaching} onChange={(v) => set('yearsCoaching', v)} placeholder="e.g. 8 years" />
                      </div>
                    </>
                  )}

                  {/* ── Veteran fields ── */}
                  {form.memberType === 'veteran' && (
                    <>
                      <Hairline />
                      <p className="font-barlow-condensed uppercase" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.30em', color: gold }}>
                        Military background
                      </p>
                      <div>
                        <FieldLabel>Branch</FieldLabel>
                        <SelectInput value={form.branch} onChange={(v) => set('branch', v)}>
                          <option value="" disabled>Select branch…</option>
                          <option value="army">Army</option>
                          <option value="navy">Navy</option>
                          <option value="air_force">Air Force</option>
                          <option value="marines">Marines</option>
                          <option value="coast_guard">Coast Guard</option>
                          <option value="space_force">Space Force</option>
                        </SelectInput>
                      </div>
                      <div>
                        <FieldLabel>MOS / Rate / AFSC</FieldLabel>
                        <TextInput value={form.mos} onChange={(v) => set('mos', v)} placeholder="e.g. 11B, IT, 3D0X2" />
                      </div>
                      <div>
                        <FieldLabel>Years served</FieldLabel>
                        <TextInput value={form.yearsServed} onChange={(v) => set('yearsServed', v)} placeholder="e.g. 6 years" />
                      </div>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <div
                          onClick={() => set('isSkillbridgeEligible', !form.isSkillbridgeEligible)}
                          className="mt-0.5 shrink-0 flex items-center justify-center transition-all"
                          style={{
                            width: '18px', height: '18px', borderRadius: '3px',
                            border: form.isSkillbridgeEligible ? `2px solid ${gold}` : '2px solid hsl(var(--hero-gold) / 0.35)',
                            background: form.isSkillbridgeEligible ? gold : 'transparent',
                          }}
                          role="checkbox"
                          aria-checked={form.isSkillbridgeEligible}
                          tabIndex={0}
                          onKeyDown={(e) => e.key === ' ' && set('isSkillbridgeEligible', !form.isSkillbridgeEligible)}
                        >
                          {form.isSkillbridgeEligible && <Check size={11} strokeWidth={3} style={{ color: navy }} />}
                        </div>
                        <span className="font-barlow" style={{ fontSize: '14px', fontWeight: 300, lineHeight: 1.65, color: ice60 }}>
                          I am currently eligible for SkillBridge
                        </span>
                      </label>
                    </>
                  )}

                  {/* ── Employer fields ── */}
                  {form.memberType === 'employer' && (
                    <>
                      <Hairline />
                      <p className="font-barlow-condensed uppercase" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.30em', color: gold }}>
                        Company details
                      </p>
                      <div>
                        <FieldLabel>Company name</FieldLabel>
                        <TextInput value={form.companyName} onChange={(v) => set('companyName', v)} placeholder="Your company's name" autoComplete="organization" />
                      </div>
                      <div>
                        <FieldLabel>Your role</FieldLabel>
                        <TextInput value={form.companyRole} onChange={(v) => set('companyRole', v)} placeholder="e.g. Head of Talent, Recruiter" autoComplete="organization-title" />
                      </div>
                      <div
                        className="flex items-start gap-3 p-4"
                        style={{ border: goldBorder35, borderRadius: '3px', background: 'hsl(var(--hero-gold) / 0.05)' }}
                      >
                        <Shield size={13} strokeWidth={2} style={{ color: gold, marginTop: '2px', flexShrink: 0 }} aria-hidden="true" />
                        <p className="font-barlow" style={{ fontSize: '13px', fontWeight: 300, lineHeight: 1.65, color: ice60 }}>
                          Employers must complete company verification before posting jobs. You'll be guided through that after signup.
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {error && (
                  <p className="font-barlow mb-4" style={{ fontSize: '14px', fontWeight: 300, color: 'hsl(var(--destructive))' }}>
                    {error}
                  </p>
                )}

                <button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="gold-shimmer-bg font-barlow-condensed uppercase w-full flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{
                    fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em',
                    padding: '17px 0', borderRadius: '3px', color: navy,
                  }}
                >
                  {loading ? 'Saving…' : <>Complete signup <ChevronRight size={13} /></>}
                </button>
              </div>
            )}

            {/* ── STEP 4: Done ────────────────────────────────────────── */}
            {step === 4 && (
              <div className="text-center flex flex-col items-center gap-6">
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: '64px', height: '64px', borderRadius: '50%',
                    border: `2px solid ${gold}`,
                    background: 'hsl(var(--hero-gold) / 0.10)',
                  }}
                >
                  <Check size={28} strokeWidth={2} style={{ color: gold }} />
                </div>

                <div>
                  <h1
                    className="font-bodoni mb-3"
                    style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.01em', color: white }}
                  >
                    You're{' '}
                    <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>in.</em>
                  </h1>
                  <p
                    className="font-barlow"
                    style={{ fontSize: '16px', fontWeight: 300, lineHeight: 1.8, color: ice60, maxWidth: '380px' }}
                  >
                    Your profile is saved and pending verification. In the meantime, browse open jobs.
                  </p>
                </div>

                <Hairline className="w-full" />

                <div className="flex flex-col gap-3 w-full">
                  <button
                    onClick={() => navigate('/jobs')}
                    className="gold-shimmer-bg font-barlow-condensed uppercase w-full flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                    style={{
                      fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em',
                      padding: '17px 0', borderRadius: '3px', color: navy,
                    }}
                  >
                    Browse jobs <ChevronRight size={13} />
                  </button>
                  {form.memberType === 'employer' && (
                    <button
                      onClick={() => navigate('/verify-company')}
                      className="font-barlow-condensed uppercase w-full flex items-center justify-center gap-2 transition-opacity hover:opacity-80"
                      style={{
                        fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em',
                        padding: '16px 0', borderRadius: '3px',
                        border: goldBorder35, color: ice,
                      }}
                    >
                      Verify my company <ChevronRight size={13} />
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </>
  );
}
