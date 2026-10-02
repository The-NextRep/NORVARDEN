/**
 * /admin/events — create, edit, hide and delete events shown on /events.
 */
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { CalendarDays, Check, Mail, Pencil, Plus, Trash2, X } from 'lucide-react';
import { AdminGuard } from '@/components/auth/RouteGuards';
import AdminLayout from '@/components/admin/AdminLayout';
import { AdminButton, ConfirmDialog, EmptyState, ErrorNote, Eyebrow, Panel, Pill, Spinner } from '@/components/admin/AdminUi';
import { adminFetch } from '@/components/admin/admin-utils';
import { adminTheme as t } from '@/components/admin/theme';
import { FORMAT_LABELS, formatEventWhen, type EventFormat } from '@/lib/events';

interface AdminEvent {
  id: number;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  format: EventFormat;
  location: string | null;
  registrationUrl: string | null;
  hostName: string | null;
  published: boolean;
  status: 'pending_payment' | 'pending_review' | 'approved' | 'rejected';
  tier: 'standard' | 'featured';
  coverage: 'admin' | 'included' | 'paid';
  paymentStatus: 'not_required' | 'unpaid' | 'paid' | 'refunded';
  amountCents: number | null;
  reviewNote: string | null;
  featuredEmailSentAt: string | null;
  companyName: string | null;
  submitterEmail: string | null;
}

const money = (cents: number | null) => (cents ? `$${(cents / 100).toLocaleString('en-US')}` : '');

function PaymentPill({ ev }: { ev: AdminEvent }) {
  if (ev.coverage === 'admin') return null;
  if (ev.paymentStatus === 'paid') return <Pill tone="success">Paid {money(ev.amountCents)}</Pill>;
  if (ev.paymentStatus === 'refunded') return <Pill tone="info">Refunded {money(ev.amountCents)}</Pill>;
  if (ev.paymentStatus === 'unpaid') return <Pill tone="danger">Unpaid {money(ev.amountCents)}</Pill>;
  return <Pill tone="muted">Included in plan</Pill>;
}

function FeaturedEmailPanel({ ev, onSent }: { ev: AdminEvent; onSent: () => void }) {
  const [audience, setAudience] = useState('all');
  const [state, setState] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [armed, setArmed] = useState(false);

  async function send() {
    if (!armed) { setArmed(true); return; }
    setBusy(true);
    setMsg(null);
    try {
      const r = await adminFetch<{ recipients: number }>(`/api/admin/events/${ev.id}/send-featured-email`, {
        method: 'POST', body: JSON.stringify({ audience, state: state.trim() || undefined }),
      });
      setMsg(`Sending to ${r.recipients} member${r.recipients === 1 ? '' : 's'}.`);
      onSent();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Could not send.');
      setArmed(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3 pt-3 mt-1" style={{ borderTop: `1px solid ${t.line}` }}>
      <Field label="Featured email to" htmlFor={`aud-${ev.id}`}>
        <select id={`aud-${ev.id}`} style={{ ...inputStyle, width: 'auto' }} value={audience} onChange={(e) => { setAudience(e.target.value); setArmed(false); }}>
          <option value="all">All members</option>
          <option value="athlete">Athletes</option>
          <option value="coach">Coaches</option>
          <option value="veteran">Veterans</option>
        </select>
      </Field>
      <Field label="State (optional)" htmlFor={`st-${ev.id}`}>
        <input id={`st-${ev.id}`} style={{ ...inputStyle, width: '140px' }} value={state} onChange={(e) => { setState(e.target.value); setArmed(false); }} placeholder="TX" />
      </Field>
      <AdminButton size="sm" tone={armed ? 'solid' : 'gold'} onClick={() => void send()} disabled={busy}>
        <Mail size={11} /> {busy ? 'Sending…' : armed ? 'Click again to send' : 'Send featured email'}
      </AdminButton>
      {msg && <span className="font-barlow" style={{ fontSize: '13px', color: t.ice60 }}>{msg}</span>}
    </div>
  );
}

interface FormState {
  title: string;
  description: string;
  startsAt: string; // datetime-local value, viewer's time zone
  endsAt: string;
  format: EventFormat;
  location: string;
  registrationUrl: string;
  hostName: string;
  published: boolean;
}

const EMPTY: FormState = {
  title: '', description: '', startsAt: '', endsAt: '', format: 'in_person',
  location: '', registrationUrl: '', hostName: '', published: true,
};

/** ISO → "YYYY-MM-DDTHH:mm" in local time for <input type="datetime-local">. */
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const inputStyle = {
  background: t.navy,
  border: `1px solid ${t.lineStrong}`,
  borderRadius: '2px',
  color: t.white,
  fontSize: '14px',
  padding: '10px 12px',
  width: '100%',
} as const;

function Field({ label, htmlFor, children, hint }: { label: string; htmlFor: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-2 min-w-0">
      <label htmlFor={htmlFor}><Eyebrow>{label}</Eyebrow></label>
      {children}
      {hint && <span className="font-barlow" style={{ fontSize: '12px', color: t.ice60 }}>{hint}</span>}
    </div>
  );
}

function EventForm({ initial, onCancel, onSaved, editId }: {
  initial: FormState; editId: number | null; onCancel: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.title.trim()) { setError('Add a title.'); return; }
    if (!form.startsAt) { setError('Add a start date and time.'); return; }
    setSaving(true);
    try {
      const body = JSON.stringify({
        ...form,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
      });
      await adminFetch(editId ? `/api/admin/events/${editId}` : '/api/admin/events', { method: editId ? 'PUT' : 'POST', body });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the event.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel className="p-6 mb-8">
      <form onSubmit={submit} className="flex flex-col gap-5">
        <p className="font-bodoni" style={{ fontSize: '22px', color: t.white }}>{editId ? 'Edit event' : 'New event'}</p>
        <ErrorNote message={error} />
        <Field label="Title" htmlFor="ev-title">
          <input id="ev-title" style={inputStyle} value={form.title} maxLength={200} onChange={(e) => set('title', e.target.value)} placeholder="Veterans hiring night — Dallas" />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Starts" htmlFor="ev-start" hint="Your local time. Visitors see it in theirs.">
            <input id="ev-start" type="datetime-local" style={inputStyle} value={form.startsAt} onChange={(e) => set('startsAt', e.target.value)} />
          </Field>
          <Field label="Ends (optional)" htmlFor="ev-end">
            <input id="ev-end" type="datetime-local" style={inputStyle} value={form.endsAt} onChange={(e) => set('endsAt', e.target.value)} />
          </Field>
          <Field label="Format" htmlFor="ev-format">
            <select id="ev-format" style={inputStyle} value={form.format} onChange={(e) => set('format', e.target.value as EventFormat)}>
              {(Object.keys(FORMAT_LABELS) as EventFormat[]).map((f) => <option key={f} value={f}>{FORMAT_LABELS[f]}</option>)}
            </select>
          </Field>
          <Field label="Location (optional)" htmlFor="ev-location">
            <input id="ev-location" style={inputStyle} value={form.location} maxLength={255} onChange={(e) => set('location', e.target.value)} placeholder="Dallas, TX or Zoom" />
          </Field>
          <Field label="Registration link (optional)" htmlFor="ev-url" hint="Eventbrite, Luma, Zoom… Leave blank to hide the Register button.">
            <input id="ev-url" style={inputStyle} value={form.registrationUrl} maxLength={512} onChange={(e) => set('registrationUrl', e.target.value)} placeholder="https://lu.ma/…" />
          </Field>
          <Field label="Hosted by (optional)" htmlFor="ev-host">
            <input id="ev-host" style={inputStyle} value={form.hostName} maxLength={200} onChange={(e) => set('hostName', e.target.value)} placeholder="The NextRep" />
          </Field>
        </div>
        <Field label="Description (optional)" htmlFor="ev-desc">
          <textarea id="ev-desc" rows={5} style={inputStyle} value={form.description} maxLength={5000} onChange={(e) => set('description', e.target.value)} />
        </Field>
        <label className="inline-flex items-center gap-3 font-barlow" style={{ fontSize: '14px', color: t.white }}>
          <input id="ev-published" type="checkbox" checked={form.published} onChange={(e) => set('published', e.target.checked)} />
          Show on the Events page
        </label>
        <div className="flex gap-3">
          <AdminButton type="submit" tone="gold" disabled={saving}>{saving ? 'Saving…' : editId ? 'Save changes' : 'Create event'}</AdminButton>
          <AdminButton tone="ghost" onClick={onCancel} disabled={saving}>Cancel</AdminButton>
        </div>
      </form>
    </Panel>
  );
}

function EventsInner() {
  const [list, setList] = useState<AdminEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: number | null; initial: FormState } | null>(null);
  const [deleting, setDeleting] = useState<AdminEvent | null>(null);
  const [rejecting, setRejecting] = useState<AdminEvent | null>(null);

  async function approve(ev: AdminEvent) {
    setError(null);
    try {
      await adminFetch(`/api/admin/events/${ev.id}/approve`, { method: 'POST' });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not approve the event.');
    }
  }

  const load = useCallback(async () => {
    setError(null);
    try {
      const d = await adminFetch<{ events: AdminEvent[] }>('/api/admin/events');
      setList(d.events);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load events.');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function startEdit(ev: AdminEvent) {
    setEditing({
      id: ev.id,
      initial: {
        title: ev.title, description: ev.description ?? '', startsAt: toLocalInput(ev.startsAt), endsAt: toLocalInput(ev.endsAt),
        format: ev.format, location: ev.location ?? '', registrationUrl: ev.registrationUrl ?? '', hostName: ev.hostName ?? '', published: ev.published,
      },
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const now = Date.now();

  return (
    <AdminLayout
      title="Events"
      subtitle="Review company-submitted events, and add your own. Live events appear on the public Events page."
      metaDescription="Manage REP | IV events."
      actions={!editing && (
        <AdminButton tone="gold" onClick={() => setEditing({ id: null, initial: EMPTY })}>
          <Plus size={12} /> New event
        </AdminButton>
      )}
    >
      {editing && (
        <EventForm
          key={editing.id ?? 'new'}
          initial={editing.initial}
          editId={editing.id}
          onCancel={() => setEditing(null)}
          onSaved={() => { setEditing(null); void load(); }}
        />
      )}

      <ErrorNote message={error} />

      {!list ? <Spinner /> : list.length === 0 ? (
        <EmptyState icon={<CalendarDays size={28} style={{ color: t.gold }} />} title="No events yet" body="Create your first event and it will show on the public Events page." />
      ) : (
        <div className="flex flex-col gap-10">
          {[
            { key: 'review', title: 'Awaiting your review', items: list.filter((e) => e.status === 'pending_review') },
            { key: 'unpaid', title: 'Submitted, not paid yet', items: list.filter((e) => e.status === 'pending_payment') },
            { key: 'all', title: 'All events', items: list.filter((e) => e.status === 'approved' || e.status === 'rejected') },
          ].filter((g) => g.items.length > 0 || g.key === 'review').map((group) => (
            <section key={group.key} className="flex flex-col gap-3" aria-label={group.title}>
              <Eyebrow color={group.key === 'review' ? t.gold : t.ice60}>{group.title} · {group.items.length}</Eyebrow>
              {group.items.length === 0 && (
                <p className="font-barlow" style={{ fontSize: '14px', color: t.ice60 }}>Nothing waiting. Company-submitted events show up here.</p>
              )}
              {group.items.map((ev) => {
                const isPast = new Date(ev.endsAt ?? ev.startsAt).getTime() < now;
                return (
                  <Panel key={ev.id} className="p-5 flex flex-col gap-3">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="min-w-0 flex-1 flex flex-col gap-1">
                        <div className="flex flex-wrap gap-2 mb-1">
                          {ev.status === 'pending_review' ? <Pill tone="gold">Needs review</Pill>
                            : ev.status === 'pending_payment' ? <Pill tone="danger">Awaiting payment</Pill>
                            : ev.status === 'rejected' ? <Pill tone="danger">Rejected</Pill>
                            : !ev.published ? <Pill tone="muted">Hidden</Pill>
                            : isPast ? <Pill tone="info">Past</Pill> : <Pill tone="success">Live</Pill>}
                          {ev.tier === 'featured' && <Pill tone="gold">Featured</Pill>}
                          <Pill tone="muted">{FORMAT_LABELS[ev.format]}</Pill>
                          <PaymentPill ev={ev} />
                          {ev.featuredEmailSentAt && <Pill tone="info">Email sent</Pill>}
                        </div>
                        <p className="font-bodoni" style={{ fontSize: '19px', color: t.white }}>{ev.title}</p>
                        <p className="font-barlow" style={{ fontSize: '13px', color: t.ice60 }}>
                          {formatEventWhen(ev.startsAt, ev.endsAt)}{ev.location ? ` · ${ev.location}` : ''}{ev.hostName ? ` · Hosted by ${ev.hostName}` : ''}
                        </p>
                        {ev.submitterEmail && (
                          <p className="font-barlow" style={{ fontSize: '12px', color: t.ice60 }}>Submitted by {ev.submitterEmail}</p>
                        )}
                        {ev.status === 'rejected' && ev.reviewNote && (
                          <p className="font-barlow" style={{ fontSize: '12px', color: t.ice60 }}>Reason: {ev.reviewNote}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 shrink-0">
                        {ev.status === 'pending_review' && (
                          <>
                            <AdminButton size="sm" tone="gold" onClick={() => void approve(ev)}><Check size={11} /> Approve</AdminButton>
                            <AdminButton size="sm" tone="danger" onClick={() => setRejecting(ev)}><X size={11} /> Reject</AdminButton>
                          </>
                        )}
                        <AdminButton size="sm" tone="ghost" onClick={() => startEdit(ev)}><Pencil size={11} /> Edit</AdminButton>
                        {ev.paymentStatus !== 'paid' && (
                          <AdminButton size="sm" tone="danger" onClick={() => setDeleting(ev)}><Trash2 size={11} /> Delete</AdminButton>
                        )}
                      </div>
                    </div>
                    {ev.status === 'approved' && ev.published && ev.tier === 'featured' && !ev.featuredEmailSentAt && !isPast && (
                      <FeaturedEmailPanel ev={ev} onSent={() => void load()} />
                    )}
                  </Panel>
                );
              })}
            </section>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!rejecting}
        onOpenChange={(o) => { if (!o) setRejecting(null); }}
        tone="danger"
        title={rejecting ? `Reject “${rejecting.title}”?` : ''}
        description={rejecting?.paymentStatus === 'paid'
          ? <>The company is refunded {money(rejecting.amountCents)} automatically and gets an email with your reason.</>
          : <>The company gets an email with your reason.</>}
        reasonLabel="Reason (sent to the company)"
        reasonPlaceholder="e.g. Event details are incomplete — please add a registration link."
        reasonRequired
        confirmLabel={rejecting?.paymentStatus === 'paid' ? 'Reject and refund' : 'Reject event'}
        onConfirm={async (reason) => {
          if (!rejecting) return;
          await adminFetch(`/api/admin/events/${rejecting.id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
          await load();
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => { if (!o) setDeleting(null); }}
        tone="danger"
        title={deleting ? `Delete “${deleting.title}”?` : ''}
        description={<>This removes the event from the site for good. To take it down temporarily, edit it and untick “Show on the Events page”.</>}
        confirmLabel="Delete event"
        onConfirm={async () => {
          if (!deleting) return;
          await adminFetch(`/api/admin/events/${deleting.id}`, { method: 'DELETE' });
          await load();
        }}
      />
    </AdminLayout>
  );
}

export default function AdminEventsPage() {
  return (
    <AdminGuard>
      <EventsInner />
    </AdminGuard>
  );
}
