/**
 * /company/dashboard — Employer dashboard.
 * Non-employers (athletes/coaches/veterans) are redirected to /dashboard.
 * Unauthenticated users are redirected to /login.
 */
import { useEffect, useState } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { useNavigate, Link } from 'react-router';
import {
  Building2, Briefcase, Users, MessageSquare, CreditCard,
  Settings, ChevronRight, ArrowRight, CheckCircle,
  AlertTriangle, Shield, PlusCircle, ExternalLink, CalendarDays,
} from 'lucide-react';
import { AuthGuard } from '@/components/auth/RouteGuards';
import { useCurrentUser } from '@/lib/auth/use-current-user';

// ── Design tokens ─────────────────────────────────────────────────────────────
const navy    = 'hsl(var(--hero-navy))';
const navyMid = 'hsl(var(--hero-navy-mid))';
const gold    = 'hsl(var(--hero-gold))';
const white   = 'hsl(var(--hero-white))';
const ice60   = 'hsl(var(--hero-ice-60))';

// ── Types ─────────────────────────────────────────────────────────────────────
interface CompanyDashboardSummary {
  company: {
    id: number;
    legalName: string;
    website: string;
    orgType: string | null;
    missionDiscountUnlocked: boolean | null;
    skillbridgePartner: boolean | null;
    postsPaused: boolean | null;
    blocked: boolean | null;
  } | null;
  activeJobPostsCount: number;
  pendingConnectionsCount: number;
}

const ORG_TYPE_LABELS: Record<string, string> = {
  company:            'Company',
  staffing_agency:    'Staffing Agency',
  high_school:        'High School',
  college_university: 'College / University',
  club_academy:       'Club / Academy',
  nonprofit:          'Nonprofit',
  military_affiliated:'Military-Affiliated Org',
};

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
            {value} pending
          </span>
        )}
      </div>
      <p className="font-bodoni mb-1" style={{ fontSize: '32px', fontWeight: 400, color: white, lineHeight: 1 }}>
        {value}
      </p>
      <div className="flex items-center justify-between">
        <p className="font-barlow-condensed uppercase" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em', color: ice60 }}>
          {label}
        </p>
        <ChevronRight size={14} style={{ color: ice60 }} className="group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}

// ── Quick link ────────────────────────────────────────────────────────────────
function QuickLink({
  icon: Icon, label, sublabel, href, highlight,
}: {
  icon: React.ElementType;
  label: string;
  sublabel: string;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link
      to={href}
      className="group flex items-center gap-5 transition-all"
      style={{
        background: highlight ? 'hsl(var(--hero-gold) / 0.08)' : navyMid,
        border: `1px solid ${highlight ? 'hsl(var(--hero-gold) / 0.45)' : 'hsl(var(--hero-gold) / 0.15)'}`,
        borderRadius: '3px',
        padding: '18px 20px',
        textDecoration: 'none',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--hero-gold) / 0.65)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = highlight ? 'hsl(var(--hero-gold) / 0.45)' : 'hsl(var(--hero-gold) / 0.15)'; }}
    >
      <div
        className="shrink-0 flex items-center justify-center"
        style={{ width: '40px', height: '40px', borderRadius: '2px', background: highlight ? 'hsl(var(--hero-gold) / 0.14)' : 'hsl(var(--hero-gold) / 0.06)', border: `1px solid ${highlight ? 'hsl(var(--hero-gold) / 0.45)' : 'hsl(var(--hero-gold) / 0.2)'}` }}
      >
        <Icon size={18} style={{ color: highlight ? gold : ice60 }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-barlow-condensed uppercase" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.28em', color: highlight ? gold : white }}>
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

// ── Company card ──────────────────────────────────────────────────────────────
function CompanyCard({ summary }: { summary: CompanyDashboardSummary }) {
  const { company } = summary;

  if (!company) {
    // Employer account exists but no approved company yet
    return (
      <div
        className="relative overflow-hidden"
        style={{ background: navyMid, border: `1px solid hsl(var(--hero-gold) / 0.3)`, borderRadius: '3px', padding: '28px' }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${gold}, transparent)` }} />
        <div className="flex items-start gap-5">
          <div className="shrink-0 flex items-center justify-center rounded-sm"
            style={{ width: '64px', height: '64px', border: `1px solid hsl(var(--hero-gold) / 0.3)`, background: 'hsl(var(--hero-gold) / 0.06)' }}>
            <Building2 size={28} style={{ color: ice60 }} />
          </div>
          <div>
            <p className="font-bodoni mb-1" style={{ fontSize: '22px', fontWeight: 400, color: white, lineHeight: 1.05 }}>
              Verification <em style={{ color: gold, fontStyle: 'italic' }}>pending.</em>
            </p>
            <p className="font-barlow" style={{ fontSize: '14px', fontWeight: 300, color: ice60, lineHeight: 1.6 }}>
              Your company application is under review. You'll be able to post jobs once approved.
            </p>
            <Link to="/verify-company" className="inline-flex items-center gap-2 mt-4 font-barlow-condensed uppercase transition-opacity hover:opacity-80"
              style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.28em', padding: '9px 16px', borderRadius: '2px', border: `1px solid ${gold}`, color: gold, background: 'transparent', textDecoration: 'none' }}>
              Check application status
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const orgLabel = company.orgType ? (ORG_TYPE_LABELS[company.orgType] ?? company.orgType) : null;
  const isPaused  = company.postsPaused;
  const isBlocked = company.blocked;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: navyMid,
        border: `1px solid ${isBlocked ? 'hsl(0 70% 45% / 0.5)' : isPaused ? 'hsl(38 90% 55% / 0.4)' : gold}`,
        borderRadius: '3px',
        padding: '28px',
      }}
    >
      {/* Top shimmer */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: isBlocked ? 'linear-gradient(90deg, transparent, hsl(0 70% 45%), transparent)' : `linear-gradient(90deg, transparent, ${gold}, transparent)` }} />

      <div className="flex items-start gap-5 flex-wrap sm:flex-nowrap">
        {/* Logo placeholder */}
        <div
          className="shrink-0 flex items-center justify-center rounded-sm font-bodoni"
          style={{ width: '64px', height: '64px', border: `1px solid hsl(var(--hero-gold) / 0.35)`, background: 'hsl(var(--hero-gold) / 0.08)', fontSize: '22px', fontWeight: 400, color: gold }}
        >
          {company.legalName.charAt(0).toUpperCase()}
        </div>

        {/* Identity */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-1">
            {orgLabel && (
              <span className="font-barlow-condensed uppercase" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em', color: ice60 }}>{orgLabel}</span>
            )}
            <span className="inline-flex items-center gap-1 font-barlow-condensed uppercase" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.2em', color: gold }}>
              <CheckCircle size={12} style={{ color: gold }} /> Verified
            </span>
            {company.skillbridgePartner && (
              <span className="inline-flex items-center gap-1 font-barlow-condensed uppercase" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.2em', color: gold }}>
                <Shield size={12} style={{ color: gold }} /> SkillBridge
              </span>
            )}
            {company.missionDiscountUnlocked && (
              <span className="inline-flex items-center gap-1 font-barlow-condensed uppercase" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.2em', color: gold }}>
                Mission discount
              </span>
            )}
          </div>

          <h2 className="font-bodoni mb-1" style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 400, color: white, lineHeight: 1.05 }}>
            {company.legalName}
          </h2>

          {company.website && (
            <a
              href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-barlow transition-opacity hover:opacity-80"
              style={{ fontSize: '13px', fontWeight: 300, color: ice60, textDecoration: 'none' }}
            >
              {company.website.replace('https://', '').replace('http://', '')} <ExternalLink size={11} />
            </a>
          )}
        </div>

        {/* Actions */}
        <div className="shrink-0 flex flex-col gap-2">
          <Link
            to="/company/jobs"
            className="inline-flex items-center gap-2 font-barlow-condensed uppercase transition-opacity hover:opacity-80"
            style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.28em', padding: '9px 16px', borderRadius: '2px', background: gold, color: navy, border: 'none', textDecoration: 'none' }}
          >
            <PlusCircle size={12} /> Post a job
          </Link>
          <Link
            to="/company/account"
            className="inline-flex items-center gap-2 font-barlow-condensed uppercase transition-opacity hover:opacity-80"
            style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.28em', padding: '9px 16px', borderRadius: '2px', border: '1px solid hsl(var(--hero-gold) / 0.3)', color: ice60, background: 'transparent', textDecoration: 'none' }}
          >
            Company settings
          </Link>
        </div>
      </div>

      {/* Status banners */}
      {isPaused && !isBlocked && (
        <div className="mt-5 flex items-center gap-3 px-4 py-3 rounded-sm"
          style={{ background: 'hsl(38 90% 55% / 0.08)', border: '1px solid hsl(38 90% 55% / 0.35)' }}>
          <AlertTriangle size={14} style={{ color: 'hsl(38 90% 60%)', flexShrink: 0 }} />
          <p className="font-barlow" style={{ fontSize: '13px', fontWeight: 300, color: ice60, lineHeight: 1.5 }}>
            Your job posts are currently paused due to reported activity. Contact support to resolve.
          </p>
        </div>
      )}
      {isBlocked && (
        <div className="mt-5 flex items-center gap-3 px-4 py-3 rounded-sm"
          style={{ background: 'hsl(0 70% 45% / 0.08)', border: '1px solid hsl(0 70% 45% / 0.4)' }}>
          <AlertTriangle size={14} style={{ color: 'hsl(0 70% 60%)', flexShrink: 0 }} />
          <p className="font-barlow" style={{ fontSize: '13px', fontWeight: 300, color: ice60, lineHeight: 1.5 }}>
            This account has been blocked. Contact NORVARDEN support for more information.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Inner dashboard ───────────────────────────────────────────────────────────
function CompanyDashboardInner() {
  const { user } = useCurrentUser();
  const navigate  = useNavigate();

  const [summary, setSummary] = useState<CompanyDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Redirect non-employers
  useEffect(() => {
    if (user && user.memberType !== 'employer') {
      void navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/company/dashboard/summary', { credentials: 'include' });
        if (res.ok) setSummary(await res.json() as CompanyDashboardSummary);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: navy }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: 'hsl(var(--hero-gold) / 0.25)', borderTopColor: gold }} />
      </div>
    );
  }

  const companyName = summary?.company?.legalName ?? null;

  return (
    <main className="min-h-screen pb-24" style={{ background: navy }}>
      <Helmet>
        <title>Company Dashboard — NORVARDEN</title>
        <meta name="description" content="Manage your company profile, job postings, candidate connections, and billing on NORVARDEN." />
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div
        className="px-6 md:px-12 lg:px-16 py-10"
        style={{ borderBottom: '1px solid hsl(var(--hero-gold) / 0.15)', background: navyMid }}
      >
        <div className="max-w-5xl mx-auto">
          <p className="font-barlow-condensed uppercase mb-2" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.32em', color: ice60 }}>
            Employer Dashboard
          </p>
          <h1 className="font-bodoni" style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 400, color: white, lineHeight: 1.05 }}>
            {companyName ? (
              <><em style={{ color: gold, fontStyle: 'italic' }}>{companyName}</em> — welcome back.</>
            ) : (
              <>Your company <em style={{ color: gold, fontStyle: 'italic' }}>dashboard.</em></>
            )}
          </h1>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="px-6 md:px-12 lg:px-16 pt-10">
        <div className="max-w-5xl mx-auto space-y-10">

          {/* Company card */}
          {summary && <CompanyCard summary={summary} />}

          {/* Stats */}
          <section>
            <SectionHeading>Activity</SectionHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard
                icon={Briefcase}
                label="Active job posts"
                value={summary?.activeJobPostsCount ?? 0}
                href="/company/jobs"
              />
              <StatCard
                icon={Users}
                label="Pending connections"
                value={summary?.pendingConnectionsCount ?? 0}
                href="/messages"
                badge
              />
            </div>
          </section>

          {/* Quick links */}
          <section>
            <SectionHeading>Quick links</SectionHeading>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <QuickLink
                icon={PlusCircle}
                label="Post a job"
                sublabel="Create a new listing visible to verified members"
                href="/company/jobs"
                highlight
              />
              <QuickLink
                icon={Users}
                label="Browse candidates"
                sublabel="Search athlete, coach, and veteran profiles"
                href="/company/candidates"
              />
              <QuickLink
                icon={CalendarDays}
                label="Host an event"
                sublabel="List hiring events and workshops for members"
                href="/company/events"
              />
              <QuickLink
                icon={MessageSquare}
                label="Messages"
                sublabel="Conversations with connected members"
                href="/messages"
              />
              <QuickLink
                icon={CreditCard}
                label="Billing"
                sublabel="Subscription plan, invoices, and payment details"
                href="/company/account"
              />
              <QuickLink
                icon={Settings}
                label="Settings"
                sublabel="Company profile, notifications, and account preferences"
                href="/company/account"
              />
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}

export default function CompanyDashboardPage() {
  return (
    <AuthGuard>
      <CompanyDashboardInner />
    </AuthGuard>
  );
}
