/**
 * /admin/company-list — every verified company with plan/access status.
 * Suspend / reinstate, grant access outside Stripe (Founding partners on
 * invoice), toggle the 30% mission discount, resume paused job posts.
 */
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Building2, ExternalLink, KeyRound, ShieldBan, ShieldCheck } from 'lucide-react';
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
  Panel,
  Pill,
  SearchInput,
  Spinner,
} from '@/components/admin/AdminUi';
import { adminFetch, formatDate, useDebounced } from '@/components/admin/admin-utils';
import { adminTheme as t } from '@/components/admin/theme';

type Filter = 'all' | 'active' | 'suspended';

interface Access {
  active: boolean;
  source: 'stripe' | 'manual' | null;
  plan: string | null;
  billingCycle: string | null;
  status: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

interface CompanyRow {
  id: number;
  legalName: string;
  website: string;
  emailDomain: string;
  orgType: string;
  missionDiscountUnlocked: boolean | null;
  skillbridgePartner: boolean | null;
  reportCount: number | null;
  postsPaused: boolean | null;
  postsPausedReason: string | null;
  blocked: boolean | null;
  blockedAt: string | null;
  manualAccessUntil: string | null;
  createdAt: string | null;
  contactName: string | null;
  contactEmail: string | null;
  access: Access | null;
  activeJobs: number;
  pendingReports: number;
}

interface ListResponse { companies: CompanyRow[]; total: number; page: number; pageSize: number }

const PLAN_LABELS: Record<string, string> = { scout: 'Scout', partner: 'Partner', founding: 'Founding', unknown: 'Plan' };
const ORG_LABELS: Record<string, string> = {
  company: 'Company',
  staffing_agency: 'Staffing agency',
  high_school: 'High school',
  college_university: 'College / university',
  club_academy: 'Club / academy',
  nonprofit: 'Nonprofit',
  military_affiliated: 'Military-affiliated',
};

function toDateInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

function AccessPill({ access }: { access: Access | null }) {
  if (!access) return <Pill>No plan</Pill>;
  const plan = access.plan ? (PLAN_LABELS[access.plan] ?? access.plan) : 'Plan';
  if (access.active) {
    const until = access.currentPeriodEnd ? ` · ${access.cancelAtPeriodEnd ? 'ends' : 'renews'} ${formatDate(access.currentPeriodEnd)}` : '';
    return (
      <Pill tone={access.source === 'manual' ? 'gold' : 'success'} title={access.source === 'manual' ? 'Granted by an admin (billed outside Stripe)' : `Stripe · ${access.status ?? ''}`}>
        {plan}{access.billingCycle ? ` · ${access.billingCycle}` : ''}{access.source === 'manual' ? ' · manual' : ''}{until}
      </Pill>
    );
  }
  return <Pill tone="muted" title={access.status ?? undefined}>{access.status ? `${plan} · ${access.status.replace(/_/g, ' ')}` : 'No plan'}</Pill>;
}

function AccessEditor({ company, onSaved }: { company: CompanyRow; onSaved: () => void }) {
  const [until, setUntil] = useState(toDateInput(company.manualAccessUntil));
  const [mission, setMission] = useState(!!company.missionDiscountUnlocked);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  const original = toDateInput(company.manualAccessUntil);
  const dirty = until !== original || mission !== !!company.missionDiscountUnlocked;

  async function save(body: Record<string, unknown>, okText: string) {
    setSaving(true);
    setMsg(null);
    try {
      await adminFetch(`/api/admin/companies/${company.id}/access`, { method: 'POST', body: JSON.stringify(body) });
      setMsg({ tone: 'ok', text: okText });
      onSaved();
    } catch (e) {
      setMsg({ tone: 'err', text: e instanceof Error ? e.message : 'Save failed.' });
    } finally {
      setSaving(false);
    }
  }

  function quickSet(months: number) {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    setUntil(d.toISOString().slice(0, 10));
  }

  const inputStyle = { fontSize: '14px', fontWeight: 300, color: t.white, background: t.panel, border: `1px solid ${t.lineStrong}`, borderRadius: '2px', colorScheme: 'dark' } as const;

  return (
    <div className="grid gap-6 md:grid-cols-2 p-5" style={{ borderTop: `1px solid ${t.line}`, background: 'hsl(218 69% 9% / 0.4)' }}>
      <div className="flex flex-col gap-3">
        <Eyebrow color={t.gold}>Manual access (billed outside Stripe)</Eyebrow>
        <p className="font-barlow" style={{ fontSize: '13px', fontWeight: 300, color: t.ice60, lineHeight: 1.6 }}>
          For Founding partners on invoice. The company has full paid access through this date. Leave empty for none.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={until}
            onChange={(e) => setUntil(e.target.value)}
            className="font-barlow px-3 py-2 focus:outline-none"
            style={inputStyle}
            aria-label="Manual access until"
          />
          <AdminButton tone="ghost" size="sm" onClick={() => quickSet(3)}>+3 mo</AdminButton>
          <AdminButton tone="ghost" size="sm" onClick={() => quickSet(12)}>+12 mo</AdminButton>
          {until && <AdminButton tone="ghost" size="sm" onClick={() => setUntil('')}>Clear</AdminButton>}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Eyebrow color={t.gold}>Mission discount</Eyebrow>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={mission} onChange={(e) => setMission(e.target.checked)} className="mt-1" style={{ accentColor: 'hsl(var(--hero-gold))' }} />
          <span className="font-barlow" style={{ fontSize: '13px', fontWeight: 300, color: t.white, lineHeight: 1.6 }}>
            Unlock the 30% mission discount (nonprofits, military-affiliated organizations).
          </span>
        </label>

        {company.postsPaused && (
          <div className="flex flex-col gap-2 mt-2 p-3" style={{ border: `1px solid ${t.lineStrong}`, borderRadius: '2px' }}>
            <Eyebrow color={t.danger}>Job posts paused</Eyebrow>
            <span className="font-barlow" style={{ fontSize: '13px', fontWeight: 300, color: t.ice60 }}>
              {company.postsPausedReason ?? 'Paused'} — their jobs are hidden from members.
            </span>
            <div>
              <AdminButton size="sm" disabled={saving} onClick={() => { void save({ postsPaused: false }, 'Job posts resumed.'); }}>
                Resume job posts
              </AdminButton>
            </div>
          </div>
        )}
      </div>

      <div className="md:col-span-2 flex flex-wrap items-center gap-3">
        <AdminButton
          tone="solid"
          disabled={!dirty || saving}
          onClick={() => { void save({ manualAccessUntil: until || null, missionDiscountUnlocked: mission }, 'Access saved.'); }}
        >
          {saving ? 'Saving…' : 'Save access'}
        </AdminButton>
        {msg && (
          <span role="status" className="font-barlow" style={{ fontSize: '13px', color: msg.tone === 'ok' ? t.success : t.danger }}>
            {msg.text}
          </span>
        )}
      </div>
    </div>
  );
}

function CompanyListInner() {
  const [params, setParams] = useSearchParams();
  const initialFilter = params.get('filter');
  const [filter, setFilter] = useState<Filter>(initialFilter === 'active' || initialFilter === 'suspended' ? initialFilter : 'all');
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [page, setPage] = useState(1);
  const debounced = useDebounced(query);

  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<{ company: CompanyRow; action: 'suspend' | 'reinstate' } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const qs = new URLSearchParams({ filter, page: String(page) });
    if (debounced.trim()) qs.set('q', debounced.trim());
    try {
      setData(await adminFetch<ListResponse>(`/api/admin/companies?${qs.toString()}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load companies.');
    } finally {
      setLoading(false);
    }
  }, [filter, page, debounced]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const next = new URLSearchParams();
    if (filter !== 'all') next.set('filter', filter);
    if (debounced.trim()) next.set('q', debounced.trim());
    setParams(next, { replace: true });
  }, [filter, debounced, setParams]);

  async function runConfirm(reason: string) {
    if (!confirm) return;
    const { company, action } = confirm;
    await adminFetch(`/api/admin/companies/${company.id}/${action}`, {
      method: 'POST',
      body: JSON.stringify(action === 'suspend' ? { reason } : {}),
    });
    await load();
  }

  const companies = data?.companies ?? [];

  return (
    <AdminLayout
      title="Companies"
      subtitle="Verified companies, their plan and access, and suspension controls. New applications live in the verification queue."
      metaDescription="Admin list of verified companies on NORVARDEN."
    >
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search by company name or domain" />
        <FilterTabs<Filter>
          value={filter}
          onChange={(f) => { setFilter(f); setPage(1); }}
          options={[
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'suspended', label: 'Suspended' },
          ]}
        />
      </div>

      <ErrorNote message={error} />

      {loading && !data ? <Spinner /> : companies.length === 0 ? (
        <EmptyState
          icon={<Building2 size={32} style={{ color: t.lineStrong }} />}
          title={debounced ? 'No companies match that search.' : 'No companies here yet.'}
          body={filter === 'suspended' ? 'No company is currently suspended.' : 'Approved applications from the verification queue show up here.'}
        />
      ) : (
        <div className="flex flex-col gap-3" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 150ms' }}>
          {companies.map((c) => {
            const isOpen = expanded === c.id;
            return (
              <Panel key={c.id} style={c.blocked ? { borderColor: 'hsl(var(--destructive) / 0.35)' } : undefined}>
                <div className="p-5 flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="font-bodoni truncate" style={{ fontSize: '20px', color: t.white }}>{c.legalName || '(unnamed)'}</span>
                      {c.blocked && <Pill tone="danger" title={c.blockedAt ? `Since ${formatDate(c.blockedAt)}` : undefined}>Suspended</Pill>}
                      {c.postsPaused && <Pill tone="danger">Posts paused</Pill>}
                      {c.missionDiscountUnlocked && <Pill tone="gold">Mission −30%</Pill>}
                      {c.skillbridgePartner && <Pill tone="info">SkillBridge</Pill>}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-barlow" style={{ fontSize: '13px', fontWeight: 300, color: t.ice60 }}>
                      {c.website ? (
                        <a href={/^https?:\/\//i.test(c.website) ? c.website : `https://${c.website}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline" style={{ color: t.ice60 }}>
                          {c.emailDomain || c.website} <ExternalLink size={11} />
                        </a>
                      ) : <span>{c.emailDomain}</span>}
                      <span>{ORG_LABELS[c.orgType] ?? c.orgType}</span>
                      {c.contactEmail && <span>{c.contactName ? `${c.contactName} · ` : ''}{c.contactEmail}</span>}
                      <span>Verified {formatDate(c.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 lg:justify-end">
                    <AccessPill access={c.access} />
                    <Eyebrow>{c.activeJobs} live job{c.activeJobs === 1 ? '' : 's'}</Eyebrow>
                    {c.pendingReports > 0 && <Eyebrow color={t.danger}>{c.pendingReports} open report{c.pendingReports === 1 ? '' : 's'}</Eyebrow>}
                    <div className="flex gap-2">
                      <AdminButton tone="ghost" size="sm" onClick={() => setExpanded(isOpen ? null : c.id)} aria-expanded={isOpen}>
                        <KeyRound size={11} /> Access
                      </AdminButton>
                      {c.blocked ? (
                        <AdminButton tone="gold" size="sm" onClick={() => setConfirm({ company: c, action: 'reinstate' })}>
                          <ShieldCheck size={11} /> Reinstate
                        </AdminButton>
                      ) : (
                        <AdminButton tone="danger" size="sm" onClick={() => setConfirm({ company: c, action: 'suspend' })}>
                          <ShieldBan size={11} /> Suspend
                        </AdminButton>
                      )}
                    </div>
                  </div>
                </div>
                {isOpen && <AccessEditor key={`${c.id}-${c.manualAccessUntil ?? ''}-${c.missionDiscountUnlocked ? 1 : 0}`} company={c} onSaved={() => { void load(); }} />}
              </Panel>
            );
          })}
        </div>
      )}

      {data && <Pager page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => { if (!o) setConfirm(null); }}
        tone={confirm?.action === 'suspend' ? 'danger' : 'gold'}
        title={confirm?.action === 'suspend' ? `Suspend ${confirm.company.legalName}?` : `Reinstate ${confirm?.company.legalName ?? ''}?`}
        description={confirm?.action === 'suspend' ? (
          <>
            Their job posts disappear from NORVARDEN immediately, and they can no longer message members or send connection requests.
            Their subscription is <strong style={{ color: t.white }}>not</strong> cancelled in Stripe. You can reinstate them at any time.
          </>
        ) : (
          <>Their job posts become visible again and they can message and connect with members.</>
        )}
        confirmLabel={confirm?.action === 'suspend' ? 'Suspend company' : 'Reinstate company'}
        reasonLabel={confirm?.action === 'suspend' ? 'Reason (kept in the activity log)' : undefined}
        reasonPlaceholder="e.g. Asked members to pay for training"
        onConfirm={runConfirm}
      />
    </AdminLayout>
  );
}

export default function AdminCompanyListPage() {
  return (
    <AdminGuard>
      <CompanyListInner />
    </AdminGuard>
  );
}
