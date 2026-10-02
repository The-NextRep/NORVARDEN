import { useState, useEffect, useCallback } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { admin_companies } from 'virtual:content';
import { Button } from '@/components/ui/button';
import { ExternalLink, ChevronDown, ChevronUp, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import AdminNav from '@/components/admin/AdminNav';

interface LookupLink { label: string; url: string; }

interface Application {
  id: number;
  contactEmail: string;
  legalName: string | null;
  website: string | null;
  linkedinPage: string | null;
  orgType: string | null;
  contactName: string | null;
  contactTitle: string | null;
  contactPhone: string | null;
  contactLinkedin: string | null;
  addressLine1: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  mainPhone: string | null;
  proofData: Record<string, string> | null;
  staffingClientNames: string | null;
  skillbridgePartnerName: string | null;
  emailDomain: string | null;
  websiteDomain: string | null;
  domainMatch: boolean | null;
  domainMismatchFlag: boolean | null;
  status: string;
  submittedAt: string | null;
  lookupLinks: LookupLink[];
}

const STATUS_FILTER_MAP: Record<string, string> = {
  'All': '',
  'Pending review': 'pending_review',
  'Needs info': 'needs_info',
  'Approved': 'approved',
  'Rejected': 'rejected',
};

const STATUS_COLORS: Record<string, string> = {
  pending_review: 'bg-yellow-100 text-yellow-800',
  needs_info: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  draft: 'bg-muted text-muted-foreground',
};

// Auth is handled server-side via BetterAuth session cookies — no client key needed.

export default function AdminCompaniesPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [actionState, setActionState] = useState<Record<number, { mode: 'approve' | 'reject' | 'ask' | null; rejectReason: string; askMessage: string; adminNote: string; missionDiscount: boolean; skillbridge: boolean; working: boolean; result: string | null }>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const statusParam = STATUS_FILTER_MAP[filter];
    const url = '/api/admin/company-applications' + (statusParam ? '?status=' + statusParam : '');
    const res = await fetch(url, { credentials: 'include' });
    const data = await res.json() as { applications: Application[] };
    setApps(data.applications ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { void load(); }, [load]);

  function getAction(id: number) {
    return actionState[id] ?? { mode: null, rejectReason: '', askMessage: '', adminNote: '', missionDiscount: false, skillbridge: false, working: false, result: null };
  }

  function setAction(id: number, patch: Partial<typeof actionState[number]>) {
    setActionState((s) => ({ ...s, [id]: { ...getAction(id), ...patch } }));
  }

  async function doApprove(app: Application) {
    const a = getAction(app.id);
    setAction(app.id, { working: true });
    const res = await fetch('/api/admin/company-applications/' + app.id + '/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include' as const,
      body: JSON.stringify({ missionDiscountConfirmed: a.missionDiscount, skillbridgeConfirmed: a.skillbridge }),
    });
    const data = await res.json() as { approved?: boolean; emailSent?: boolean; error?: string };
    setAction(app.id, { working: false, result: data.approved ? (data.emailSent ? 'Approved — email sent' : 'Approved — email failed to send') : (data.error ?? 'Error') });
    if (data.approved) void load();
  }

  async function doReject(app: Application) {
    const a = getAction(app.id);
    if (!a.rejectReason.trim()) { setAction(app.id, { result: 'Enter a rejection reason.' }); return; }
    setAction(app.id, { working: true });
    const res = await fetch('/api/admin/company-applications/' + app.id + '/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include' as const,
      body: JSON.stringify({ reason: a.rejectReason, blockDomain: false }),
    });
    const data = await res.json() as { rejected?: boolean; emailSent?: boolean; error?: string };
    setAction(app.id, { working: false, result: data.rejected ? (data.emailSent ? 'Rejected — email sent' : 'Rejected — email failed to send') : (data.error ?? 'Error') });
    if (data.rejected) void load();
  }

  async function doAskInfo(app: Application) {
    const a = getAction(app.id);
    if (!a.askMessage.trim()) { setAction(app.id, { result: 'Enter a message.' }); return; }
    setAction(app.id, { working: true });
    const res = await fetch('/api/admin/company-applications/' + app.id + '/ask-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include' as const,
      body: JSON.stringify({ message: a.askMessage, adminNote: a.adminNote }),
    });
    const data = await res.json() as { sent?: boolean; emailSent?: boolean; error?: string };
    setAction(app.id, { working: false, result: data.sent ? (data.emailSent ? 'Message sent' : 'Saved — email failed to send') : (data.error ?? 'Error') });
    if (data.sent) void load();
  }

  return (
    <>
      <Helmet>
        <title>Company Review — Admin</title>
        <meta name="description" content="Admin review queue for company verification applications." />
        <meta name="robots" content="noindex" />
      </Helmet>
      <main>
        <AdminNav />
        <section className="py-xxl bg-background">
          <div className="container mx-auto px-4 max-w-content">
            <h1 className="text-2xl font-bold text-foreground mb-6">
              <span>{admin_companies.heading}</span>
            </h1>

            {/* Filter tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {admin_companies.filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                >
                  <span>{f}</span>
                </button>
              ))}
            </div>

            {loading && <p className="text-muted-foreground text-sm">Loading…</p>}

            {!loading && apps.length === 0 && (
              <p className="text-muted-foreground text-sm">
                <span>{admin_companies.emptyMessage}</span>
              </p>
            )}

            <div className="flex flex-col gap-4">
              {apps.map((app) => {
                const a = getAction(app.id);
                const isExpanded = expanded === app.id;

                return (
                  <div key={app.id} className="rounded-xl border border-border bg-background overflow-hidden">
                    {/* Header row */}
                    <button
                      onClick={() => setExpanded(isExpanded ? null : app.id)}
                      className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{app.legalName ?? '(unnamed)'}</p>
                          <p className="text-sm text-muted-foreground truncate">{app.contactEmail}</p>
                        </div>
                        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[app.status] ?? 'bg-muted text-muted-foreground'}`}>
                          {app.status.replace('_', ' ')}
                        </span>
                        {app.domainMismatchFlag && (
                          <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 font-medium">
                            <span>{admin_companies.domainMismatch.split(' —')[0]}</span>
                          </span>
                        )}
                      </div>
                      {isExpanded ? <ChevronUp size={16} className="text-muted-foreground shrink-0" /> : <ChevronDown size={16} className="text-muted-foreground shrink-0" />}
                    </button>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="border-t border-border p-5 flex flex-col gap-5">
                        {/* Domain check */}
                        <div className={`flex items-center gap-2 text-sm p-3 rounded-md ${app.domainMatch ? 'bg-green-50 text-green-800' : 'bg-orange-50 text-orange-800'}`}>
                          {app.domainMatch
                            ? <><CheckCircle size={14} /><span>{admin_companies.domainMatch}: {app.emailDomain} ↔ {app.websiteDomain}</span></>
                            : <><XCircle size={14} /><span>{admin_companies.domainMismatch}: {app.emailDomain} ↔ {app.websiteDomain}</span></>
                          }
                        </div>

                        {/* Details grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                          <Detail label="Org type" value={app.orgType} />
                          <Detail label="Contact" value={app.contactName + (app.contactTitle ? ', ' + app.contactTitle : '')} />
                          <Detail label="Phone" value={app.mainPhone} />
                          <Detail label="Contact phone" value={app.contactPhone} />
                          <Detail label="Address" value={[app.addressLine1, app.city, app.state, app.postalCode].filter(Boolean).join(', ')} />
                          {app.staffingClientNames && <Detail label="Staffing clients" value={app.staffingClientNames} />}
                          {app.skillbridgePartnerName && <Detail label="SkillBridge name" value={app.skillbridgePartnerName} />}
                          {app.proofData && Object.entries(app.proofData).map(([k, v]) => (
                            <Detail key={k} label={k} value={v} />
                          ))}
                        </div>

                        {/* Lookup links */}
                        {app.lookupLinks.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {app.lookupLinks.map((link) => (
                              <a
                                key={link.url}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-colors"
                              >
                                <ExternalLink size={11} />
                                {link.label}
                              </a>
                            ))}
                          </div>
                        )}

                        {/* Action result */}
                        {a.result && (
                          <p className="text-sm font-medium text-foreground">{a.result}</p>
                        )}

                        {/* Action buttons */}
                        {app.status !== 'approved' && app.status !== 'rejected' && (
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="default" onClick={() => setAction(app.id, { mode: a.mode === 'approve' ? null : 'approve' })}>
                              <CheckCircle size={13} className="mr-1.5" />
                              <span>{admin_companies.approveLabel}</span>
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => setAction(app.id, { mode: a.mode === 'reject' ? null : 'reject' })}>
                              <XCircle size={13} className="mr-1.5" />
                              <span>{admin_companies.rejectLabel}</span>
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setAction(app.id, { mode: a.mode === 'ask' ? null : 'ask' })}>
                              <MessageSquare size={13} className="mr-1.5" />
                              <span>{admin_companies.askInfoLabel}</span>
                            </Button>
                          </div>
                        )}

                        {/* Approve panel */}
                        {a.mode === 'approve' && (
                          <div className="flex flex-col gap-3 p-4 bg-muted/40 rounded-lg border border-border">
                            {(app.orgType === 'nonprofit' || app.orgType === 'military_affiliated') && (
                              <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input type="checkbox" checked={a.missionDiscount} onChange={(e) => setAction(app.id, { missionDiscount: e.target.checked })} className="accent-primary" />
                                <span>{admin_companies.missionDiscountLabel}</span>
                              </label>
                            )}
                            {app.skillbridgePartnerName && (
                              <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input type="checkbox" checked={a.skillbridge} onChange={(e) => setAction(app.id, { skillbridge: e.target.checked })} className="accent-primary" />
                                <span>{admin_companies.skillbridgeLabel}: {app.skillbridgePartnerName}</span>
                              </label>
                            )}
                            <Button size="sm" onClick={() => doApprove(app)} disabled={a.working}>
                              {a.working ? 'Approving…' : 'Confirm approval'}
                            </Button>
                          </div>
                        )}

                        {/* Reject panel */}
                        {a.mode === 'reject' && (
                          <div className="flex flex-col gap-3 p-4 bg-muted/40 rounded-lg border border-border">
                            <textarea
                              value={a.rejectReason}
                              onChange={(e) => setAction(app.id, { rejectReason: e.target.value })}
                              rows={2}
                              placeholder={admin_companies.rejectReasonPlaceholder}
                              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                            />
                            <Button size="sm" variant="destructive" onClick={() => doReject(app)} disabled={a.working}>
                              {a.working ? 'Rejecting…' : 'Confirm rejection'}
                            </Button>
                          </div>
                        )}

                        {/* Ask info panel */}
                        {a.mode === 'ask' && (
                          <div className="flex flex-col gap-3 p-4 bg-muted/40 rounded-lg border border-border">
                            <textarea
                              value={a.askMessage}
                              onChange={(e) => setAction(app.id, { askMessage: e.target.value })}
                              rows={2}
                              placeholder={admin_companies.askInfoPlaceholder}
                              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                            />
                            <textarea
                              value={a.adminNote}
                              onChange={(e) => setAction(app.id, { adminNote: e.target.value })}
                              rows={2}
                              placeholder={admin_companies.adminNotePlaceholder}
                              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                            />
                            <Button size="sm" onClick={() => doAskInfo(app)} disabled={a.working}>
                              {a.working ? 'Sending…' : 'Send message'}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Delete all test data ─────────────────────────────────────────── */}
        <DeleteTestDataSection />
      </main>
    </>
  );
}

// ── Delete all test data ─────────────────────────────────────────────────────
function DeleteTestDataSection() {
  const [confirm, setConfirm]   = useState(false);
  const [working, setWorking]   = useState(false);
  const [result, setResult]     = useState<{ deleted: Record<string, number> } | null>(null);
  const [error, setError]       = useState<string | null>(null);

  const navyMid = 'hsl(var(--hero-navy-mid, 218 52% 13%))';
  const gold    = 'hsl(var(--hero-gold))';
  const white   = 'hsl(var(--hero-white))';
  const ice60   = 'hsl(var(--hero-ice-60))';

  async function handleDelete() {
    setWorking(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/delete-test-data', { method: 'POST', credentials: 'include' });
      const data = await res.json() as { ok?: boolean; deleted?: Record<string, number>; error?: string };
      if (!res.ok || !data.ok) { setError(data.error ?? 'Unknown error'); return; }
      setResult({ deleted: data.deleted ?? {} });
      setConfirm(false);
    } catch (e) {
      setError(String(e));
    } finally {
      setWorking(false);
    }
  }

  return (
    <section className="px-6 md:px-10 py-8 mt-8" style={{ borderTop: '1px solid hsl(var(--hero-gold) / 0.15)' }}>
      <div className="max-w-xl">
        <h2
          className="font-barlow-condensed uppercase mb-1"
          style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em', color: ice60 }}
        >
          Test data
        </h2>
        <p className="font-barlow mb-4" style={{ fontSize: '13px', fontWeight: 300, color: ice60, lineHeight: 1.6 }}>
          Removes every account whose email ends in{' '}
          <code style={{ fontFamily: 'monospace', fontSize: '12px', color: gold }}>@theboard.test</code>{' '}
          (with its profile, connections, conversations and messages) and every test company application
          on that domain. This is irreversible.
        </p>

        {result ? (
          <div
            className="p-4 mb-4"
            style={{ background: 'hsl(var(--hero-gold) / 0.08)', border: '1px solid hsl(var(--hero-gold) / 0.3)', borderRadius: '3px' }}
          >
            <p className="font-barlow-condensed uppercase mb-2" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em', color: gold }}>
              Deleted
            </p>
            <ul className="font-barlow" style={{ fontSize: '13px', fontWeight: 300, color: white, lineHeight: 1.8 }}>
              {Object.entries(result.deleted).map(([k, v]) => (
                <li key={k}>{k}: <strong style={{ color: gold }}>{v}</strong></li>
              ))}
            </ul>
            <button
              onClick={() => setResult(null)}
              className="mt-3 font-barlow-condensed uppercase transition-opacity hover:opacity-70"
              style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.28em', color: ice60, background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              Dismiss
            </button>
          </div>
        ) : null}

        {error && (
          <p className="font-barlow mb-3" style={{ fontSize: '13px', fontWeight: 300, color: 'hsl(var(--destructive))' }}>
            Error: {error}
          </p>
        )}

        {!confirm ? (
          <button
            onClick={() => setConfirm(true)}
            className="font-barlow-condensed uppercase transition-opacity hover:opacity-80"
            style={{
              fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em',
              padding: '10px 20px', borderRadius: '2px',
              background: 'transparent',
              border: '1px solid hsl(var(--destructive) / 0.5)',
              color: 'hsl(var(--destructive))',
              cursor: 'pointer',
            }}
          >
            Delete all test data
          </button>
        ) : (
          <div
            className="p-4"
            style={{ background: navyMid, border: '1px solid hsl(var(--destructive) / 0.4)', borderRadius: '3px' }}
          >
            <p className="font-barlow mb-4" style={{ fontSize: '14px', fontWeight: 300, color: white, lineHeight: 1.6 }}>
              This will permanently delete all @theboard.test accounts, companies, connections, conversations, and messages. Are you sure?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { void handleDelete(); }}
                disabled={working}
                className="font-barlow-condensed uppercase transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{
                  fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em',
                  padding: '10px 20px', borderRadius: '2px',
                  background: 'hsl(var(--destructive))',
                  color: white, border: 'none', cursor: 'pointer',
                }}
              >
                {working ? 'Deleting…' : 'Yes, delete everything'}
              </button>
              <button
                onClick={() => setConfirm(false)}
                disabled={working}
                className="font-barlow-condensed uppercase transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{
                  fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em',
                  padding: '10px 20px', borderRadius: '2px',
                  background: 'transparent',
                  border: '1px solid hsl(var(--hero-gold) / 0.3)',
                  color: ice60, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-muted-foreground">{label}: </span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
