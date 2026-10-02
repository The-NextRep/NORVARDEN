/**
 * /dashboard — Member dashboard for people with disabilities.
 * Employers are redirected to /company/dashboard.
 * Unauthenticated users are redirected to /login.
 */
import { useEffect, useState, useCallback } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { useNavigate, Link } from 'react-router';
import { User, Briefcase, Users, MessageSquare, Settings, CheckCircle, ChevronRight, Shield, ArrowRight, Building2, Check, X, FileText, GraduationCap, Bookmark } from 'lucide-react';
import { AuthGuard } from '@/components/auth/RouteGuards';
import { useCurrentUser } from '@/lib/auth/use-current-user';
import { dashboard } from 'virtual:content';

// ── Design tokens ─────────────────────────────────────────────────────────────
const navy    = 'hsl(var(--hero-navy))';
const navyMid = 'hsl(var(--hero-navy-mid))';
const gold    = 'hsl(var(--hero-gold))';
const white   = 'hsl(var(--hero-white))';
const ice60   = 'hsl(var(--hero-ice-60))';

// ── Types ─────────────────────────────────────────────────────────────────────
interface DashboardSummary {
  profile: {
    firstName: string | null;
    lastName: string | null;
    headline: string | null;
    photoUrl: string | null;
    memberType: string | null;
    verificationStatus: string | null;
    city: string | null;
    state: string | null;
  } | null;
  savedJobsCount: number;
  pendingConnectionsCount: number;
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface ConnectionRequest {
  id: number;
  requesterId: string;
  companyName: string | null;
  companyWebsite: string | null;
  skillbridgePartner: boolean | null;
  note: string | null;
  requestedAt: string;
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon, label, value, href, badge,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  href: string;
  badge?: boolean;
}) {
  return (
    <Link
      to={href}
      className="group block transition-all"
      style={{
        background: navyMid,
        border: '1px solid hsl(var(--hero-gold) / 0.18)',
        borderRadius: '3px',
        padding: '24px',
        textDecoration: 'none',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--hero-gold) / 0.5)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--hero-gold) / 0.18)'; }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="flex items-center justify-center"
          style={{ width: '40px', height: '40px', borderRadius: '2px', background: 'hsl(var(--hero-gold) / 0.1)', border: '1px solid hsl(var(--hero-gold) / 0.25)' }}
        >
          <Icon size={18} style={{ color: gold }} />
        </div>
        {badge && typeof value === 'number' && value > 0 && (
          <span
            className="font-barlow-condensed uppercase"
            style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.22em', padding: '3px 8px', borderRadius: '2px', background: gold, color: navy }}
          >
            {value} new
          </span>
        )}
      </div>
      <p
        className="font-bodoni mb-1"
        style={{ fontSize: '32px', fontWeight: 400, color: white, lineHeight: 1 }}
      >
        {value}
      </p>
      <div className="flex items-center justify-between">
        <p className="font-barlow-condensed uppercase" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em', color: ice60 }}>
          {label}
        </p>
        <ChevronRight size={14} style={{ color: ice60, transition: 'transform 0.15s', transform: 'translateX(0)' }} className="group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

// ── Quick link row ────────────────────────────────────────────────────────────
function QuickLink({
  icon: Icon, label, sublabel, href, gold: isGold,
}: {
  icon: React.ElementType;
  label: string;
  sublabel: string;
  href: string;
  gold?: boolean;
}) {
  return (
    <Link
      to={href}
      className="group flex items-center gap-5 transition-all"
      style={{
        background: navyMid,
        border: `1px solid ${isGold ? 'hsl(var(--hero-gold) / 0.4)' : 'hsl(var(--hero-gold) / 0.15)'}`,
        borderRadius: '3px',
        padding: '18px 20px',
        textDecoration: 'none',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--hero-gold) / 0.6)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = isGold ? 'hsl(var(--hero-gold) / 0.4)' : 'hsl(var(--hero-gold) / 0.15)'; }}
    >
      <div
        className="shrink-0 flex items-center justify-center"
        style={{ width: '40px', height: '40px', borderRadius: '2px', background: isGold ? 'hsl(var(--hero-gold) / 0.12)' : 'hsl(var(--hero-gold) / 0.06)', border: `1px solid ${isGold ? 'hsl(var(--hero-gold) / 0.4)' : 'hsl(var(--hero-gold) / 0.2)'}` }}
      >
        <Icon size={18} style={{ color: isGold ? gold : ice60 }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-barlow-condensed uppercase" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.28em', color: isGold ? gold : white }}>
          {label}
        </p>
        <p className="font-barlow mt-0.5" style={{ fontSize: '13px', fontWeight: 300, color: ice60, lineHeight: 1.4 }}>
          {sublabel}
        </p>
      </div>
      <ArrowRight size={16} style={{ color: ice60, flexShrink: 0 }} className="group-hover:translate-x-1 transition-transform" />
    </Link>
  );
}

// ── Section heading ───────────────────────────────────────────────────────────
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 mb-5">
      <h2 className="font-barlow-condensed uppercase shrink-0"
        style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.32em', color: ice60 }}>
        {children}
      </h2>
      <div style={{ flex: 1, height: '1px', background: 'hsl(var(--hero-gold) / 0.15)' }} />
    </div>
  );
}

// ── Profile card ──────────────────────────────────────────────────────────────
function ProfileCard({
  summary, userId,
}: {
  summary: DashboardSummary;
  userId: string;
}) {
  const { profile } = summary;
  const displayName = profile?.firstName && profile?.lastName
    ? `${profile.firstName} ${profile.lastName}`
    : profile?.firstName ?? 'Member';
  const initial = displayName.charAt(0).toUpperCase();
  const memberType = profile?.memberType ?? 'member';
  const pathLabel = memberType === 'athlete' ? 'ATHLETE' : memberType === 'coach' ? 'COACH' : memberType === 'veteran' ? 'VETERAN' : 'MEMBER';
  const isVerified = profile?.verificationStatus === 'verified';
  const location = [profile?.city, profile?.state].filter(Boolean).join(', ');
  const profileComplete = !!(profile?.headline && profile?.city);

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: navyMid,
        border: `1px solid ${gold}`,
        borderRadius: '3px',
        padding: '28px',
      }}
    >
      {/* Gold shimmer top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${gold}, transparent)` }} />

      <div className="flex items-start gap-5 flex-wrap sm:flex-nowrap">
        {/* Avatar */}
        <div className="shrink-0">
          <div
            className="rounded-full overflow-hidden flex items-center justify-center font-bodoni"
            style={{ width: '72px', height: '72px', border: `2px solid ${gold}`, background: 'hsl(var(--hero-gold) / 0.1)', fontSize: '28px', fontWeight: 400, color: gold }}
          >
            {profile?.photoUrl
              ? <img src={profile.photoUrl} alt={displayName} className="w-full h-full object-cover" />
              : initial
            }
          </div>
        </div>

        {/* Identity */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <span className="font-barlow-condensed uppercase" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em', color: ice60 }}>{pathLabel}</span>
            {isVerified && (
              <span className="inline-flex items-center gap-1 font-barlow-condensed uppercase" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.2em', color: gold }}>
                <CheckCircle size={12} style={{ color: gold }} /> Verified
              </span>
            )}
            {memberType === 'veteran' && (
              <span className="inline-flex items-center gap-1 font-barlow-condensed uppercase" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.2em', color: gold }}>
                <Shield size={12} style={{ color: gold }} /> Veteran
              </span>
            )}
          </div>

          <h2 className="font-bodoni mb-1" style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 400, color: white, lineHeight: 1.05 }}>
            {displayName}
          </h2>

          {profile?.headline ? (
            <p className="font-barlow mb-1" style={{ fontSize: '14px', fontWeight: 300, color: ice60, lineHeight: 1.5 }}>
              {profile.headline}
            </p>
          ) : (
            <p className="font-barlow mb-1" style={{ fontSize: '13px', fontWeight: 300, color: 'hsl(var(--hero-gold) / 0.5)', fontStyle: 'italic' }}>
              Add a headline to your profile
            </p>
          )}

          {location && (
            <p className="font-barlow" style={{ fontSize: '12px', fontWeight: 300, color: ice60 }}>{location}</p>
          )}
        </div>

        {/* Edit button */}
        <div className="shrink-0 flex flex-col gap-2">
          <Link
            to="/profile/edit"
            className="inline-flex items-center gap-2 font-barlow-condensed uppercase transition-opacity hover:opacity-80"
            style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.28em', padding: '9px 16px', borderRadius: '2px', border: `1px solid ${gold}`, color: gold, background: 'transparent', textDecoration: 'none' }}
          >
            Edit profile
          </Link>
          <Link
            to={`/profile/${userId}`}
            className="inline-flex items-center gap-2 font-barlow-condensed uppercase transition-opacity hover:opacity-80"
            style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.28em', padding: '9px 16px', borderRadius: '2px', border: '1px solid hsl(var(--hero-gold) / 0.3)', color: ice60, background: 'transparent', textDecoration: 'none' }}
          >
            View profile
          </Link>
        </div>
      </div>

      {/* Profile completeness nudge */}
      {!profileComplete && (
        <div
          className="mt-5 flex items-center gap-3 px-4 py-3 rounded-sm"
          style={{ background: 'hsl(var(--hero-gold) / 0.07)', border: '1px solid hsl(var(--hero-gold) / 0.2)' }}
        >
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: gold, flexShrink: 0 }} />
          <p className="font-barlow" style={{ fontSize: '13px', fontWeight: 300, color: ice60, lineHeight: 1.5 }}>
            Complete your profile to appear in employer searches.{' '}
            <Link to="/profile/edit" style={{ color: gold, textDecoration: 'none' }}>Finish now →</Link>
          </p>
        </div>
      )}
    </div>
  );
}

// ── Inner dashboard (after auth) ──────────────────────────────────────────────
function DashboardInner() {
  const { user } = useCurrentUser();
  const navigate  = useNavigate();

  const [summary, setSummary]         = useState<DashboardSummary | null>(null);
  const [loading, setLoading]         = useState(true);
  const [connRequests, setConnRequests] = useState<ConnectionRequest[]>([]);
  const [connLoading, setConnLoading]   = useState(true);
  // Track per-card state: 'idle' | 'accepting' | 'declining' | 'accepted' | 'declined'
  const [cardState, setCardState] = useState<Record<number, string>>({});

  // Redirect employers to their own dashboard
  useEffect(() => {
    if (user?.memberType === 'employer') {
      void navigate('/company/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Fetch dashboard summary
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/dashboard/summary', { credentials: 'include' });
        if (res.ok) setSummary(await res.json() as DashboardSummary);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Fetch pending connection requests
  const fetchConnections = useCallback(() => {
    setConnLoading(true);
    void fetch('/api/connections/pending', { credentials: 'include' })
      .then((r) => r.json())
      .then((d: { requests?: ConnectionRequest[] }) => {
        setConnRequests(d.requests ?? []);
      })
      .catch(() => {})
      .finally(() => setConnLoading(false));
  }, []);

  useEffect(() => { fetchConnections(); }, [fetchConnections]);

  const handleAccept = useCallback(async (id: number) => {
    setCardState((s) => ({ ...s, [id]: 'accepting' }));
    try {
      const res = await fetch(`/api/connections/${id}/accept`, { method: 'POST', credentials: 'include' });
      if (res.ok) {
        setCardState((s) => ({ ...s, [id]: 'accepted' }));
        // Remove from list after brief confirmation
        setTimeout(() => {
          setConnRequests((prev) => prev.filter((r) => r.id !== id));
          setCardState((s) => { const n = { ...s }; delete n[id]; return n; });
          setSummary((prev) => prev ? { ...prev, pendingConnectionsCount: Math.max(0, prev.pendingConnectionsCount - 1) } : prev);
        }, 1400);
      } else {
        setCardState((s) => ({ ...s, [id]: 'idle' }));
      }
    } catch {
      setCardState((s) => ({ ...s, [id]: 'idle' }));
    }
  }, []);

  const handleDecline = useCallback(async (id: number) => {
    setCardState((s) => ({ ...s, [id]: 'declining' }));
    try {
      const res = await fetch(`/api/connections/${id}/decline`, { method: 'POST', credentials: 'include' });
      if (res.ok) {
        setConnRequests((prev) => prev.filter((r) => r.id !== id));
        setCardState((s) => { const n = { ...s }; delete n[id]; return n; });
        setSummary((prev) => prev ? { ...prev, pendingConnectionsCount: Math.max(0, prev.pendingConnectionsCount - 1) } : prev);
      } else {
        setCardState((s) => ({ ...s, [id]: 'idle' }));
      }
    } catch {
      setCardState((s) => ({ ...s, [id]: 'idle' }));
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: navy }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: 'hsl(var(--hero-gold) / 0.25)', borderTopColor: gold }} />
      </div>
    );
  }

  const memberType = user?.memberType ?? summary?.profile?.memberType ?? 'member';
  const pathLabel  = memberType === 'athlete' ? 'Athlete' : memberType === 'coach' ? 'Coach' : memberType === 'veteran' ? 'Veteran' : 'Member';
  const firstName  = summary?.profile?.firstName ?? user?.name?.split(' ')[0] ?? null;

  return (
    <main className="min-h-screen pb-24" style={{ background: navy }}>
      <Helmet>
        <title>Dashboard — NORVARDEN</title>
        <meta name="description" content="Your member dashboard on NORVARDEN — view your profile, saved jobs, connection requests, and quick links to browse verified opportunities." />
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div
        className="px-6 md:px-12 lg:px-16 py-10"
        style={{ borderBottom: '1px solid hsl(var(--hero-gold) / 0.15)', background: navyMid }}
      >
        <div className="max-w-5xl mx-auto">
          <p className="font-barlow-condensed uppercase mb-2" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.32em', color: ice60 }}>
            {pathLabel} Dashboard
          </p>
          <h1 className="font-bodoni" style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 400, color: white, lineHeight: 1.05 }}>
            {firstName ? (
              <>Welcome back, <em style={{ color: gold, fontStyle: 'italic' }}>{firstName}.</em></>
            ) : (
              <>Your <em style={{ color: gold, fontStyle: 'italic' }}>dashboard.</em></>
            )}
          </h1>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="px-6 md:px-12 lg:px-16 pt-10">
        <div className="max-w-5xl mx-auto space-y-10">

          {/* Profile card */}
          {summary && user && (
            <ProfileCard summary={summary} userId={user.id} />
          )}

          {/* Stats row */}
          <section>
            <SectionHeading>Activity</SectionHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard
                icon={Briefcase}
                label="Saved jobs"
                value={summary?.savedJobsCount ?? 0}
                href="/saved-jobs"
              />
              <StatCard
                icon={Users}
                label="Connection requests"
                value={summary?.pendingConnectionsCount ?? 0}
                href="#connection-requests"
                badge
              />
            </div>
          </section>

          {/* Connection Requests */}
          <section id="connection-requests">
            <div className="flex items-center gap-3 mb-5">
              <h2 className="font-barlow-condensed uppercase shrink-0" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.32em', color: ice60 }}>
                {dashboard.connectionRequests.sectionLabel}
              </h2>
              {!connLoading && connRequests.length > 0 && (
                <span
                  className="font-barlow-condensed uppercase"
                  style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.22em', padding: '2px 7px', borderRadius: '2px', background: gold, color: navy }}
                >
                  {connRequests.length}
                </span>
              )}
              <div style={{ flex: 1, height: '1px', background: 'hsl(var(--hero-gold) / 0.15)' }} />
            </div>

            {connLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-6 h-6 rounded-full border-2 animate-spin"
                  style={{ borderColor: 'hsl(var(--hero-gold) / 0.2)', borderTopColor: gold }} />
              </div>
            ) : connRequests.length === 0 ? (
              <div
                className="flex flex-col items-center text-center py-10 gap-3"
                style={{ border: '1px solid hsl(var(--hero-gold) / 0.12)', borderRadius: '3px', background: navyMid }}
              >
                <Users size={28} style={{ color: 'hsl(var(--hero-gold) / 0.3)' }} />
                <p className="font-bodoni" style={{ fontSize: '20px', fontWeight: 400, color: white }}>
                  {dashboard.connectionRequests.emptyHeading}
                </p>
                <p className="font-barlow max-w-xs" style={{ fontSize: '14px', fontWeight: 300, color: ice60, lineHeight: 1.65 }}>
                  {dashboard.connectionRequests.emptyBody}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {connRequests.map((req) => {
                  const state = cardState[req.id] ?? 'idle';
                  const isAccepted = state === 'accepted';
                  const isBusy = state === 'accepting' || state === 'declining';
                  return (
                    <div
                      key={req.id}
                      className="relative overflow-hidden"
                      style={{
                        background: isAccepted ? 'hsl(var(--hero-gold) / 0.08)' : navyMid,
                        border: isAccepted ? `1px solid ${gold}` : '1px solid hsl(var(--hero-gold) / 0.2)',
                        borderRadius: '3px',
                        padding: '20px 24px',
                        transition: 'border-color 0.2s, background 0.2s',
                      }}
                    >
                      {/* Accepted shimmer bar */}
                      {isAccepted && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${gold}, transparent)` }} />
                      )}

                      <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
                        {/* Company icon */}
                        <div
                          className="shrink-0 flex items-center justify-center"
                          style={{ width: '44px', height: '44px', borderRadius: '2px', background: 'hsl(var(--hero-gold) / 0.08)', border: '1px solid hsl(var(--hero-gold) / 0.25)' }}
                        >
                          <Building2 size={20} style={{ color: gold }} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-bodoni" style={{ fontSize: '18px', fontWeight: 400, color: white, lineHeight: 1.1 }}>
                              {req.companyName ?? 'Verified Company'}
                            </span>
                            {req.skillbridgePartner && (
                              <span className="font-barlow-condensed uppercase" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.22em', color: 'hsl(var(--hero-sky, 200 80% 65%))', padding: '2px 6px', border: '1px solid hsl(var(--hero-sky, 200 80% 65%) / 0.4)', borderRadius: '2px' }}>
                                {dashboard.connectionRequests.skillbridgeLabel}
                              </span>
                            )}
                          </div>

                          {req.note && (
                            <div className="mt-2 mb-3">
                              <span className="font-barlow-condensed uppercase block mb-1" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.28em', color: gold }}>
                                {dashboard.connectionRequests.noteLabel}
                              </span>
                              <p className="font-barlow" style={{ fontSize: '14px', fontWeight: 300, color: ice60, lineHeight: 1.65, fontStyle: 'italic' }}>
                                "{req.note}"
                              </p>
                            </div>
                          )}

                          <p className="font-barlow" style={{ fontSize: '12px', fontWeight: 300, color: 'hsl(var(--hero-ice) / 0.6)' }}>
                            {new Date(req.requestedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="shrink-0 flex items-center gap-2 self-center">
                          {isAccepted ? (
                            <span className="inline-flex items-center gap-1.5 font-barlow-condensed uppercase" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em', color: gold }}>
                              <Check size={13} />
                              {dashboard.connectionRequests.acceptedLabel}
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => { void handleAccept(req.id); }}
                                disabled={isBusy}
                                className="inline-flex items-center gap-1.5 font-barlow-condensed uppercase transition-opacity hover:opacity-80 disabled:opacity-40"
                                style={{
                                  fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em',
                                  padding: '10px 18px', borderRadius: '2px',
                                  background: gold, color: navy, border: 'none', cursor: isBusy ? 'default' : 'pointer',
                                }}
                                aria-label={`Accept connection from ${req.companyName ?? 'company'}`}
                              >
                                <Check size={12} />
                                {dashboard.connectionRequests.acceptLabel}
                              </button>
                              <button
                                onClick={() => { void handleDecline(req.id); }}
                                disabled={isBusy}
                                className="inline-flex items-center gap-1.5 font-barlow-condensed uppercase transition-opacity hover:opacity-80 disabled:opacity-40"
                                style={{
                                  fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em',
                                  padding: '10px 18px', borderRadius: '2px',
                                  background: 'transparent', color: ice60,
                                  border: '1px solid hsl(var(--hero-gold) / 0.25)',
                                  cursor: isBusy ? 'default' : 'pointer',
                                }}
                                aria-label={`Decline connection from ${req.companyName ?? 'company'}`}
                              >
                                <X size={12} />
                                {dashboard.connectionRequests.declineLabel}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Quick links */}
          <section>
            <SectionHeading>Quick links</SectionHeading>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <QuickLink
                icon={User}
                label="View profile"
                sublabel="See your public profile as employers see it"
                href={`/profile/${user?.id ?? ''}`}
                gold
              />
              <QuickLink
                icon={Briefcase}
                label="Browse jobs"
                sublabel="Search verified job postings from vetted companies"
                href="/jobs"
              />
              <QuickLink
                icon={FileText}
                label="Résumé builder"
                sublabel="Turn your experience into a résumé companies understand"
                href="/resume-builder"
                gold
              />
              <QuickLink
                icon={GraduationCap}
                label="Interview tips"
                sublabel="Prep for the questions you'll get, and how to answer"
                href="/interview-tips"
              />
              <QuickLink
                icon={Bookmark}
                label="Saved jobs"
                sublabel="Roles you've bookmarked"
                href="/saved-jobs"
              />
              <QuickLink
                icon={MessageSquare}
                label="Messages"
                sublabel="Conversations with connected employers"
                href="/messages"
              />
              <QuickLink
                icon={Settings}
                label="Settings"
                sublabel="Account, notifications, and privacy preferences"
                href="/settings"
              />
            </div>
          </section>

          {/* Veteran resources nudge */}
          {memberType === 'veteran' && (
            <section>
              <SectionHeading>Veteran resources</SectionHeading>
              <Link
                to="/veterans"
                className="group flex items-center gap-5 transition-all"
                style={{
                  background: 'hsl(var(--hero-gold) / 0.06)',
                  border: `1px solid ${gold}`,
                  borderRadius: '3px',
                  padding: '20px 24px',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--hero-gold) / 0.1)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--hero-gold) / 0.06)'; }}
              >
                <Shield size={24} style={{ color: gold, flexShrink: 0 }} />
                <div className="flex-1">
                  <p className="font-barlow-condensed uppercase mb-1" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.28em', color: gold }}>
                    Veteran resources
                  </p>
                  <p className="font-barlow" style={{ fontSize: '14px', fontWeight: 300, color: ice60, lineHeight: 1.5 }}>
                    SkillBridge programs, transition guides, and employer partnerships built for veterans.
                  </p>
                </div>
                <ArrowRight size={18} style={{ color: gold, flexShrink: 0 }} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </section>
          )}

        </div>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardInner />
    </AuthGuard>
  );
}
