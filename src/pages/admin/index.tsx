/**
 * /admin — Overview: the owner's at-a-glance view of REP | IV.
 */
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { AdminGuard } from '@/components/auth/RouteGuards';
import AdminLayout from '@/components/admin/AdminLayout';
import ActivityList, { type ActivityEntry } from '@/components/admin/ActivityList';
import {
  AdminButton,
  EmptyState,
  ErrorNote,
  Eyebrow,
  Panel,
  Spinner,
} from '@/components/admin/AdminUi';
import { adminFetch } from '@/components/admin/admin-utils';
import { adminTheme as t } from '@/components/admin/theme';

interface Overview {
  members: {
    athlete: number;
    coach: number;
    veteran: number;
    employer: number;
    totalMembers: number;
    employerAccounts: number;
    totalUsers: number;
    suspendedUsers: number;
  };
  applications: { pendingReview: number; needsInfo: number };
  companies: { verified: number; suspended: number; postsPaused: number; activePaid: number; activeManual: number };
  reports: { companyReports: number; conversations: number; total: number };
  recentActivity: ActivityEntry[];
}

const fmt = (n: number) => n.toLocaleString('en-US');

function Stat({ label, value, note, to, alert = false }: { label: string; value: number; note?: ReactNode; to?: string; alert?: boolean }) {
  const body = (
    <div className="h-full p-5 flex flex-col gap-2 transition-colors" style={{ background: t.navyMid }}>
      <Eyebrow>{label}</Eyebrow>
      <span
        className="font-bodoni"
        style={{ fontSize: '40px', fontWeight: 400, lineHeight: 1, color: alert && value > 0 ? t.gold : t.white, fontVariantNumeric: 'tabular-nums' }}
      >
        {fmt(value)}
      </span>
      {note && <span className="font-barlow" style={{ fontSize: '12px', fontWeight: 300, color: t.ice60 }}>{note}</span>}
      {to && (
        <span className="mt-auto pt-2 inline-flex items-center gap-1 font-barlow-condensed uppercase" style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.24em', color: t.gold }}>
          Open <ArrowRight size={11} />
        </span>
      )}
    </div>
  );
  return to ? (
    <Link to={to} className="block hover:brightness-110" style={{ textDecoration: 'none' }}>{body}</Link>
  ) : body;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="font-barlow-condensed uppercase mb-3" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em', color: t.gold }}>
        {title}
      </h2>
      {/* 1px gaps over a gold-tinted background read as hairline rules between tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: t.line, border: `1px solid ${t.line}` }}>
        {children}
      </div>
    </section>
  );
}

function OverviewInner() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await adminFetch<Overview>('/api/admin/overview'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load overview.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <AdminLayout
      title="Overview"
      eyebrow="REP | IV · Admin"
      subtitle="Members, verified companies, the review queue and anything that needs your attention."
      metaDescription="Admin overview for REP | IV."
      actions={
        <AdminButton tone="ghost" onClick={() => { void load(); }} disabled={loading}>
          <RefreshCw size={12} /> Refresh
        </AdminButton>
      }
    >
      <ErrorNote message={error} />
      {loading && !data ? <Spinner /> : data && (
        <>
          <Section title="Needs attention">
            <Stat label="Pending review" value={data.applications.pendingReview} to="/admin/companies" alert note="Company applications waiting on you" />
            <Stat label="Needs info" value={data.applications.needsInfo} to="/admin/companies" note="Waiting on the applicant" />
            <Stat label="Company reports" value={data.reports.companyReports} to="/admin/reports" alert note="Pending member reports" />
            <Stat label="Reported conversations" value={data.reports.conversations} to="/admin/messages" alert note="Pending review" />
          </Section>

          <Section title="Members">
            <Stat label="Athletes" value={data.members.athlete} to="/admin/members?type=athlete" />
            <Stat label="Coaches" value={data.members.coach} to="/admin/members?type=coach" />
            <Stat label="Veterans" value={data.members.veteran} to="/admin/members?type=veteran" />
            <Stat
              label="Employer accounts"
              value={data.members.employerAccounts}
              to="/admin/members?type=employer"
              note={`${fmt(data.members.totalUsers)} accounts total · ${fmt(data.members.suspendedUsers)} suspended`}
            />
          </Section>

          <Section title="Companies">
            <Stat label="Verified" value={data.companies.verified} to="/admin/company-list" />
            <Stat
              label="Active paid"
              value={data.companies.activePaid}
              to="/admin/company-list"
              note={data.companies.activeManual ? `${fmt(data.companies.activeManual)} with admin-granted access` : 'Stripe or admin-granted'}
            />
            <Stat label="Suspended" value={data.companies.suspended} to="/admin/company-list?filter=suspended" />
            <Stat label="Posts paused" value={data.companies.postsPaused} to="/admin/company-list" note="Auto-paused by reports or by an admin" />
          </Section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-barlow-condensed uppercase" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em', color: t.gold }}>
                Recent activity
              </h2>
              <Link to="/admin/activity" className="inline-flex items-center gap-1 font-barlow-condensed uppercase hover:opacity-80" style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.24em', color: t.ice60, textDecoration: 'none' }}>
                Full log <ArrowRight size={11} />
              </Link>
            </div>
            <Panel className="px-5">
              {data.recentActivity.length === 0
                ? <EmptyState title="No admin activity yet." body="Approvals, suspensions and other admin actions will appear here." />
                : <ActivityList entries={data.recentActivity} compact />}
            </Panel>
          </section>
        </>
      )}
    </AdminLayout>
  );
}

export default function AdminOverviewPage() {
  return (
    <AdminGuard>
      <OverviewInner />
    </AdminGuard>
  );
}
