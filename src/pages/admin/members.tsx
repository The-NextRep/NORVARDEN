/**
 * /admin/members — every account on NORVARDEN (people with disabilities,
 * employers). Search, filter, suspend / reinstate. Admins may see emails.
 */
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { ShieldBan, ShieldCheck, Users } from 'lucide-react';
import { AdminGuard } from '@/components/auth/RouteGuards';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  AdminButton,
  ConfirmDialog,
  EmptyState,
  ErrorNote,
  Eyebrow,
  FilterTabs,
  Pager,
  Pill,
  SearchInput,
  Spinner,
  type PillTone,
} from '@/components/admin/AdminUi';
import { adminFetch, formatDate, useDebounced } from '@/components/admin/admin-utils';
import { adminTheme as t } from '@/components/admin/theme';
import { useCurrentUser } from '@/lib/auth/use-current-user';

type TypeFilter = 'all' | 'athlete' | 'coach' | 'veteran' | 'employer';
type StatusFilter = 'all' | 'active' | 'suspended';

interface MemberRow {
  id: string;
  name: string | null;
  email: string;
  emailVerified: boolean | null;
  isAdmin: boolean | null;
  suspended: boolean | null;
  suspendedAt: string | null;
  createdAt: string | null;
  memberType: 'athlete' | 'coach' | 'veteran' | 'employer' | null;
  firstName: string | null;
  lastName: string | null;
  headline: string | null;
  city: string | null;
  state: string | null;
  companyName: string | null;
  verificationStatus: string | null;
}

interface ListResponse { members: MemberRow[]; total: number; page: number; pageSize: number }

const TYPE_LABELS: Record<string, string> = { athlete: 'Athlete', coach: 'Coach', veteran: 'Veteran', employer: 'Employer' };
const TYPE_TONES: Record<string, PillTone> = { athlete: 'gold', coach: 'info', veteran: 'success', employer: 'muted' };
const TYPES: TypeFilter[] = ['all', 'athlete', 'coach', 'veteran', 'employer'];

function displayName(m: MemberRow): string {
  const profile = [m.firstName, m.lastName].filter(Boolean).join(' ');
  return profile || m.name || m.email;
}

function MembersInner() {
  const { user: me } = useCurrentUser();
  const [params, setParams] = useSearchParams();
  const initialType = params.get('type') as TypeFilter | null;
  const initialStatus = params.get('status');
  const [type, setType] = useState<TypeFilter>(initialType && TYPES.includes(initialType) ? initialType : 'all');
  const [status, setStatus] = useState<StatusFilter>(initialStatus === 'active' || initialStatus === 'suspended' ? initialStatus : 'all');
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [page, setPage] = useState(1);
  const debounced = useDebounced(query);

  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ member: MemberRow; action: 'suspend' | 'reinstate' } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const qs = new URLSearchParams({ page: String(page) });
    if (type !== 'all') qs.set('type', type);
    if (status !== 'all') qs.set('status', status);
    if (debounced.trim()) qs.set('q', debounced.trim());
    try {
      setData(await adminFetch<ListResponse>(`/api/admin/members?${qs.toString()}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load members.');
    } finally {
      setLoading(false);
    }
  }, [type, status, page, debounced]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const next = new URLSearchParams();
    if (type !== 'all') next.set('type', type);
    if (status !== 'all') next.set('status', status);
    if (debounced.trim()) next.set('q', debounced.trim());
    setParams(next, { replace: true });
  }, [type, status, debounced, setParams]);

  async function runConfirm(reason: string) {
    if (!confirm) return;
    const { member, action } = confirm;
    await adminFetch(`/api/admin/members/${encodeURIComponent(member.id)}/${action}`, {
      method: 'POST',
      body: JSON.stringify(action === 'suspend' ? { reason } : {}),
    });
    await load();
  }

  const members = data?.members ?? [];

  return (
    <AdminLayout
      title="Members"
      subtitle="Every account on NORVARDEN. Suspending an account signs it out everywhere and blocks sign-in until reinstated."
      metaDescription="Admin member directory for NORVARDEN."
    >
      <div className="flex flex-col gap-4 mb-6">
        <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search by name or email" />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <FilterTabs<TypeFilter>
            value={type}
            onChange={(v) => { setType(v); setPage(1); }}
            options={[
              { value: 'all', label: 'All types' },
              { value: 'athlete', label: 'Athletes' },
              { value: 'coach', label: 'Coaches' },
              { value: 'veteran', label: 'Veterans' },
              { value: 'employer', label: 'Employers' },
            ]}
          />
          <FilterTabs<StatusFilter>
            value={status}
            onChange={(v) => { setStatus(v); setPage(1); }}
            options={[
              { value: 'all', label: 'Any status' },
              { value: 'active', label: 'Active' },
              { value: 'suspended', label: 'Suspended' },
            ]}
          />
        </div>
      </div>

      <ErrorNote message={error} />

      {loading && !data ? <Spinner /> : members.length === 0 ? (
        <EmptyState icon={<Users size={32} style={{ color: t.lineStrong }} />} title="No members match." body="Try a different search or filter." />
      ) : (
        <div className="overflow-x-auto" style={{ border: `1px solid ${t.line}`, borderRadius: '3px', opacity: loading ? 0.6 : 1, transition: 'opacity 150ms' }}>
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr style={{ background: t.panel }}>
                {['Member', 'Email', 'Type', 'Joined', 'Status', ''].map((h) => (
                  <th key={h} scope="col" className="text-left px-4 py-3 font-barlow-condensed uppercase" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.26em', color: t.ice60 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const isSelf = me?.id === m.id;
                const location = [m.city, m.state].filter(Boolean).join(', ');
                const sub = m.memberType === 'employer' ? m.companyName : m.headline;
                return (
                  <tr key={m.id} style={{ background: t.navyMid, borderTop: `1px solid ${t.line}` }}>
                    <td className="px-4 py-3 align-top">
                      <div className="font-barlow" style={{ fontSize: '15px', fontWeight: 500, color: t.white }}>{displayName(m)}</div>
                      {(sub || location) && (
                        <div className="font-barlow truncate max-w-[280px]" style={{ fontSize: '12px', fontWeight: 300, color: t.ice60 }}>
                          {[sub, location].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <a href={`mailto:${m.email}`} className="font-barlow hover:underline break-all" style={{ fontSize: '13px', fontWeight: 300, color: t.ice }}>{m.email}</a>
                      {!m.emailVerified && <div><Eyebrow style={{ fontSize: '12px' }}>Unverified email</Eyebrow></div>}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-wrap gap-1.5">
                        {m.memberType ? <Pill tone={TYPE_TONES[m.memberType]}>{TYPE_LABELS[m.memberType]}</Pill> : <Pill>No profile</Pill>}
                        {m.isAdmin && <Pill tone="gold">Admin</Pill>}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top font-barlow whitespace-nowrap" style={{ fontSize: '13px', fontWeight: 300, color: t.ice60 }}>
                      {formatDate(m.createdAt)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {m.suspended
                        ? <Pill tone="danger" title={m.suspendedAt ? `Since ${formatDate(m.suspendedAt, true)}` : undefined}>Suspended</Pill>
                        : <Pill tone="success">Active</Pill>}
                    </td>
                    <td className="px-4 py-3 align-top text-right">
                      {m.isAdmin || isSelf ? (
                        <Eyebrow style={{ fontSize: '12px' }}>{isSelf ? 'You' : 'Protected'}</Eyebrow>
                      ) : m.suspended ? (
                        <AdminButton tone="gold" size="sm" onClick={() => setConfirm({ member: m, action: 'reinstate' })}>
                          <ShieldCheck size={11} /> Reinstate
                        </AdminButton>
                      ) : (
                        <AdminButton tone="danger" size="sm" onClick={() => setConfirm({ member: m, action: 'suspend' })}>
                          <ShieldBan size={11} /> Suspend
                        </AdminButton>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {data && <Pager page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => { if (!o) setConfirm(null); }}
        tone={confirm?.action === 'suspend' ? 'danger' : 'gold'}
        title={confirm ? `${confirm.action === 'suspend' ? 'Suspend' : 'Reinstate'} ${displayName(confirm.member)}?` : ''}
        description={confirm?.action === 'suspend' ? (
          <>
            <strong style={{ color: t.white }}>{confirm.member.email}</strong> will be signed out on every device and can't sign in until reinstated.
            Their profile and messages are kept.
          </>
        ) : (
          <>They'll be able to sign in again.</>
        )}
        confirmLabel={confirm?.action === 'suspend' ? 'Suspend account' : 'Reinstate account'}
        reasonLabel={confirm?.action === 'suspend' ? 'Reason (kept in the activity log)' : undefined}
        onConfirm={runConfirm}
      />
    </AdminLayout>
  );
}

export default function AdminMembersPage() {
  return (
    <AdminGuard>
      <MembersInner />
    </AdminGuard>
  );
}
