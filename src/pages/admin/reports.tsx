/**
 * /admin/reports — member-submitted company reports (scam / fee requests etc.).
 * Reported conversations are reviewed on /admin/messages.
 */
import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Check, Flag, X } from 'lucide-react';
import { AdminGuard } from '@/components/auth/RouteGuards';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  AdminButton,
  AdminLink,
  EmptyState,
  ErrorNote,
  Eyebrow,
  FilterTabs,
  Pager,
  Panel,
  Pill,
  Spinner,
} from '@/components/admin/AdminUi';
import { adminFetch, formatDate } from '@/components/admin/admin-utils';
import { adminTheme as t } from '@/components/admin/theme';

type StatusFilter = 'all' | 'pending' | 'reviewed' | 'dismissed';

interface ReportRow {
  id: number;
  companyId: number;
  reason: string;
  details: string | null;
  jobPostId: number | null;
  messageId: number | null;
  status: 'pending' | 'reviewed' | 'dismissed' | null;
  reviewedBy: string | null;
  createdAt: string | null;
  companyName: string | null;
  companyBlocked: boolean | null;
  companyPostsPaused: boolean | null;
  reporterMemberId: number;
  reporterMemberType: string | null;
  reporterEmail: string | null;
  reporterDisplayName: string | null;
  jobTitle: string | null;
}

interface ListResponse { reports: ReportRow[]; total: number; pending: number; page: number; pageSize: number }

const REASON_LABELS: Record<string, string> = {
  fee_for_training: 'Asked for a training fee',
  fee_for_equipment: 'Asked for an equipment fee',
  fee_for_background_check: 'Asked for a background-check fee',
  gift_card_request: 'Requested gift cards',
  wire_transfer: 'Requested a wire transfer',
  crypto: 'Requested crypto',
  check_deposit: 'Check-deposit scheme',
  off_platform_chat: 'Pushed chat off-platform',
  other: 'Other',
};

function ReportsInner() {
  const [status, setStatus] = useState<StatusFilter>('pending');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const qs = new URLSearchParams({ page: String(page) });
    if (status !== 'all') qs.set('status', status);
    try {
      setData(await adminFetch<ListResponse>(`/api/admin/company-reports?${qs.toString()}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load reports.');
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => { void load(); }, [load]);

  async function resolve(id: number, next: 'reviewed' | 'dismissed') {
    setWorking(id);
    setError(null);
    try {
      await adminFetch(`/api/admin/company-reports/${id}/resolve`, { method: 'POST', body: JSON.stringify({ status: next }) });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed.');
    } finally {
      setWorking(null);
    }
  }

  const reports = data?.reports ?? [];

  return (
    <AdminLayout
      title="Reports"
      subtitle="Reports members filed against companies. Three distinct reporters automatically pause a company's job posts."
      metaDescription="Admin review of member reports against companies on NORVARDEN."
      actions={
        <AdminLink to="/admin/messages">Reported conversations <ArrowRight size={12} /></AdminLink>
      }
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <FilterTabs<StatusFilter>
          value={status}
          onChange={(v) => { setStatus(v); setPage(1); }}
          options={[
            { value: 'pending', label: 'Pending', count: data?.pending },
            { value: 'reviewed', label: 'Reviewed' },
            { value: 'dismissed', label: 'Dismissed' },
            { value: 'all', label: 'All' },
          ]}
        />
      </div>

      <ErrorNote message={error} />

      {loading && !data ? <Spinner /> : reports.length === 0 ? (
        <EmptyState
          icon={<Check size={32} style={{ color: t.lineStrong }} />}
          title={status === 'pending' ? 'No open reports.' : 'Nothing here.'}
          body={status === 'pending' ? 'Every member report has been handled.' : undefined}
        />
      ) : (
        <div className="flex flex-col gap-3" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 150ms' }}>
          {reports.map((r) => {
            const isPending = (r.status ?? 'pending') === 'pending';
            return (
              <Panel key={r.id} className="p-5" style={isPending ? { borderLeft: `3px solid ${t.gold}` } : undefined}>
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  <Flag size={16} className="shrink-0 mt-1 hidden lg:block" style={{ color: isPending ? t.gold : t.ice60 }} aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-bodoni" style={{ fontSize: '20px', color: t.white }}>{r.companyName ?? `Company #${r.companyId}`}</span>
                      <Pill tone={isPending ? 'danger' : r.status === 'reviewed' ? 'success' : 'muted'}>{r.status ?? 'pending'}</Pill>
                      {r.companyBlocked && <Pill tone="danger">Company suspended</Pill>}
                      {r.companyPostsPaused && <Pill tone="danger">Posts paused</Pill>}
                    </div>
                    <p className="font-barlow mb-1" style={{ fontSize: '15px', fontWeight: 500, color: t.gold }}>
                      {REASON_LABELS[r.reason] ?? r.reason}
                    </p>
                    {r.details && (
                      <p className="font-barlow mb-2" style={{ fontSize: '14px', fontWeight: 300, color: t.white, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        “{r.details}”
                      </p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 font-barlow" style={{ fontSize: '12px', fontWeight: 300, color: t.ice60 }}>
                      <span>
                        Reported by {r.reporterDisplayName ?? `member #${r.reporterMemberId}`}
                        {r.reporterMemberType ? ` (${r.reporterMemberType})` : ''}
                        {r.reporterEmail ? ` · ${r.reporterEmail}` : ''}
                      </span>
                      <span>{formatDate(r.createdAt, true)}</span>
                      {r.jobPostId && <span>Job: {r.jobTitle ?? `#${r.jobPostId}`}</span>}
                      {r.messageId && <span>Message #{r.messageId}</span>}
                      {!isPending && r.reviewedBy && <span>Handled by {r.reviewedBy}</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:flex-col lg:items-stretch shrink-0">
                    {isPending && (
                      <>
                        <AdminButton size="sm" tone="gold" disabled={working === r.id} onClick={() => { void resolve(r.id, 'reviewed'); }}>
                          <Check size={11} /> Mark reviewed
                        </AdminButton>
                        <AdminButton size="sm" tone="ghost" disabled={working === r.id} onClick={() => { void resolve(r.id, 'dismissed'); }}>
                          <X size={11} /> Dismiss
                        </AdminButton>
                      </>
                    )}
                    <AdminLink size="sm" to={`/admin/company-list?q=${encodeURIComponent(r.companyName ?? '')}`}>
                      Company <ArrowRight size={11} />
                    </AdminLink>
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>
      )}

      {data && <Pager page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}

      <p className="font-barlow mt-10" style={{ fontSize: '13px', fontWeight: 300, color: t.ice60 }}>
        <Eyebrow color={t.gold}>Tip</Eyebrow>{' '}
        To act on a company, open it in Companies to suspend it or resume paused posts.
      </p>
    </AdminLayout>
  );
}

export default function AdminReportsPage() {
  return (
    <AdminGuard>
      <ReportsInner />
    </AdminGuard>
  );
}
