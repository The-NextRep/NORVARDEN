/**
 * /company/events — "My events" for verified companies.
 * Submit an event (pay by card if a fee applies), then track and edit it until
 * the NORVARDEN team reviews it. Companies without a plan can use this page.
 */
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { CalendarDays, Check, CreditCard, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { AuthGuard } from '@/components/auth/RouteGuards';
import { useCurrentUser } from '@/lib/auth/use-current-user';
import { FORMAT_LABELS, formatEventWhen, type EventFormat } from '@/lib/events';

const navy    = 'hsl(var(--hero-navy))';
const navyMid = 'hsl(var(--hero-navy-mid))';
const gold    = 'hsl(var(--hero-gold))';
const white   = 'hsl(var(--hero-white))';
const ice60   = 'hsl(var(--hero-ice-60))';
const danger  = 'hsl(var(--destructive))';
const border  = '1px solid hsl(var(--hero-gold) / 0.16)';
const eyebrow = { fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em' } as const;

type Tier = 'standard' | 'featured';
type Status = 'pending_payment' | 'pending_review' | 'approved' | 'rejected';

interface TierQuote { amountCents: number; included: boolean; note: string }
interface Quote { plan: 'none' | 'scout' | 'partner'; missionDiscount: boolean; standard: TierQuote; featured: TierQuote }

interface MyEvent {
  id: number;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  format: EventFormat;
  location: string | null;
  registrationUrl: string | null;
  tier: Tier;
  status: Status;
  paymentStatus: 'not_required' | 'unpaid' | 'paid' | 'refunded';
  amountCents: number | null;
  reviewNote: string | null;
}

interface FormState {
  title: string; description: string; startsAt: string; endsAt: string;
  format: EventFormat; location: string; registrationUrl: string; tier: Tier;
}

const EMPTY: FormState = { title: '', description: '', startsAt: '', endsAt: '', format: 'in_person', location: '', registrationUrl: '', tier: 'standard' };

const money = (cents: number) => `$${(cents / 100).toLocaleString('en-US')}`;

function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const STATUS_TEXT: Record<Status, { label: string; color: string; help: string }> = {
  pending_payment: { label: 'Awaiting payment', color: danger, help: 'Pay to send this event for review.' },
  pending_review: { label: 'In review', color: gold, help: 'We review events within 1 business day. You can still edit it.' },
  approved: { label: 'Live', color: 'hsl(152 55% 58%)', help: 'Showing on the Events page.' },
  rejected: { label: 'Not approved', color: danger, help: '' },
};

const inputStyle = {
  background: navy, border: '1px solid hsl(var(--hero-gold) / 0.3)', borderRadius: '2px',
  color: white, fontSize: '15px', padding: '11px 12px', width: '100%',
} as const;

function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 min-w-0">
      <label htmlFor={htmlFor} className="font-barlow-condensed uppercase" style={{ ...eyebrow, color: ice60 }}>{label}</label>
      {children}
      {hint && <span className="font-barlow" style={{ fontSize: '12px', color: ice60 }}>{hint}</span>}
    </div>
  );
}

function priceText(q: TierQuote): string {
  return q.amountCents === 0 ? 'Included' : money(q.amountCents);
}

function TierCard({ tier, quote, selected, onSelect }: { tier: Tier; quote: TierQuote; selected: boolean; onSelect: () => void }) {
  const features = tier === 'standard'
    ? ['Listed on the Events page', '“Hosted by” your company, verified', 'Register button to your sign-up page']
    : ['Everything in Standard', 'Featured on the home page', 'One email to matching members'];
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className="text-left flex flex-col gap-3 p-5 rounded-sm transition-colors"
      style={{ background: selected ? 'hsl(var(--hero-gold) / 0.08)' : navy, border: selected ? `1.5px solid ${gold}` : border }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-barlow-condensed uppercase inline-flex items-center gap-2" style={{ ...eyebrow, color: gold }}>
          {tier === 'featured' && <Star size={11} />} {tier === 'featured' ? 'Featured' : 'Standard'}
        </span>
        {selected && <Check size={14} style={{ color: gold }} />}
      </div>
      <p className="font-bodoni" style={{ fontSize: '28px', color: white, lineHeight: 1 }}>{priceText(quote)}</p>
      <p className="font-barlow" style={{ fontSize: '12px', color: ice60 }}>{quote.note}</p>
      <ul className="flex flex-col gap-1.5">
        {features.map((f) => (
          <li key={f} className="font-barlow inline-flex gap-2" style={{ fontSize: '14px', fontWeight: 300, color: 'hsl(var(--hero-ice) / 0.85)' }}>
            <Check size={13} style={{ color: gold, flexShrink: 0, marginTop: 4 }} /> {f}
          </li>
        ))}
      </ul>
    </button>
  );
}

function EventForm({ quote, initial, editId, onDone, onCancel }: {
  quote: Quote; initial: FormState; editId: number | null; onDone: () => void; onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));
  const price = quote[form.tier];

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.title.trim()) return setError('Add a title.');
    if (!form.startsAt) return setError('Add a start date and time.');
    setSaving(true);
    try {
      const res = await fetch(editId ? `/api/company/events/${editId}` : '/api/company/events', {
        method: editId ? 'PUT' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          startsAt: new Date(form.startsAt).toISOString(),
          endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
        }),
      });
      const data = await res.json().catch(() => ({})) as { error?: string; checkoutUrl?: string | null };
      if (!res.ok) { setError(data.error ?? 'Could not save the event.'); return; }
      if (data.checkoutUrl) { window.location.href = data.checkoutUrl; return; }
      if (data.error) setError(data.error);
      onDone();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const cta = editId ? 'Save changes' : price.amountCents > 0 ? `Continue to payment · ${money(price.amountCents)}` : 'Submit for review';

  return (
    <form onSubmit={submit} className="flex flex-col gap-6 p-6 md:p-8 rounded-sm" style={{ background: navyMid, border }}>
      <p className="font-bodoni" style={{ fontSize: '24px', color: white }}>{editId ? 'Edit event' : 'List an event'}</p>

      {!editId && (
        <div className="flex flex-col gap-3">
          <span className="font-barlow-condensed uppercase" style={{ ...eyebrow, color: ice60 }}>Listing type</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <TierCard tier="standard" quote={quote.standard} selected={form.tier === 'standard'} onSelect={() => set('tier', 'standard')} />
            <TierCard tier="featured" quote={quote.featured} selected={form.tier === 'featured'} onSelect={() => set('tier', 'featured')} />
          </div>
          {quote.missionDiscount && (
            <p className="font-barlow" style={{ fontSize: '13px', color: gold }}>Your 30% mission discount is already applied.</p>
          )}
        </div>
      )}

      <Field label="Event title" htmlFor="ce-title">
        <input id="ce-title" style={inputStyle} value={form.title} maxLength={200} onChange={(e) => set('title', e.target.value)} placeholder="Inclusive hiring night — Dallas" />
      </Field>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Starts" htmlFor="ce-start" hint="Your local time.">
          <input id="ce-start" type="datetime-local" style={inputStyle} value={form.startsAt} onChange={(e) => set('startsAt', e.target.value)} />
        </Field>
        <Field label="Ends (optional)" htmlFor="ce-end">
          <input id="ce-end" type="datetime-local" style={inputStyle} value={form.endsAt} onChange={(e) => set('endsAt', e.target.value)} />
        </Field>
        <Field label="Format" htmlFor="ce-format">
          <select id="ce-format" style={inputStyle} value={form.format} onChange={(e) => set('format', e.target.value as EventFormat)}>
            {(Object.keys(FORMAT_LABELS) as EventFormat[]).map((f) => <option key={f} value={f}>{FORMAT_LABELS[f]}</option>)}
          </select>
        </Field>
        <Field label="Location" htmlFor="ce-location">
          <input id="ce-location" style={inputStyle} value={form.location} maxLength={255} onChange={(e) => set('location', e.target.value)} placeholder="Dallas, TX or Zoom" />
        </Field>
      </div>
      <Field label="Registration link" htmlFor="ce-url" hint="Where members sign up: Eventbrite, Luma, Zoom or your own site.">
        <input id="ce-url" style={inputStyle} value={form.registrationUrl} maxLength={512} onChange={(e) => set('registrationUrl', e.target.value)} placeholder="https://" />
      </Field>
      <Field label="Description" htmlFor="ce-desc" hint="Who it’s for, what to expect, what to bring.">
        <textarea id="ce-desc" rows={5} style={inputStyle} value={form.description} maxLength={5000} onChange={(e) => set('description', e.target.value)} />
      </Field>

      {error && <p role="alert" className="font-barlow" style={{ fontSize: '14px', color: danger }}>{error}</p>}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="gold-shimmer-bg font-barlow-condensed uppercase inline-flex items-center gap-2 disabled:opacity-50"
          style={{ ...eyebrow, fontWeight: 600, padding: '15px 28px', borderRadius: '2px', color: navy }}
        >
          {price.amountCents > 0 && !editId && <CreditCard size={13} />} {saving ? 'Saving…' : cta}
        </button>
        <button type="button" onClick={onCancel} className="font-barlow" style={{ fontSize: '14px', color: ice60, background: 'none', border: 'none', cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
      {!editId && (
        <p className="font-barlow" style={{ fontSize: '12px', color: ice60, lineHeight: 1.6 }}>
          Every event is reviewed before it goes live, usually within 1 business day. If we can’t approve it, you get a full refund.
        </p>
      )}
    </form>
  );
}

function CompanyEventsInner() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<{ quote: Quote; events: MyEvent[] } | null>(null);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [editing, setEditing] = useState<{ id: number | null; initial: FormState } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    if (user && user.memberType !== 'employer' && !user.isAdmin) navigate('/events', { replace: true });
  }, [user, navigate]);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/company/events', { credentials: 'include' });
      const d = await res.json().catch(() => ({})) as { quote?: Quote; events?: MyEvent[]; error?: string; code?: string };
      if (!res.ok || !d.quote) { setError({ message: d.error ?? 'Could not load your events.', code: d.code }); return; }
      setData({ quote: d.quote, events: d.events ?? [] });
    } catch {
      setError({ message: 'Network error. Please refresh.' });
    }
  }, []);

  // Back from Stripe: confirm the payment, then refresh.
  useEffect(() => {
    const paid = params.get('paid');
    const sessionId = params.get('session_id');
    const canceled = params.get('canceled');
    if (paid && sessionId) {
      void fetch(`/api/company/events/${paid}/confirm`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      }).finally(() => {
        setNotice('Payment received. Your event is in review — we’ll email you when it’s live.');
        setParams({}, { replace: true });
        void load();
      });
    } else {
      if (canceled) {
        setNotice('Payment was cancelled. Your event is saved — use “Pay now” when you’re ready.');
        setParams({}, { replace: true });
      }
      void load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function payNow(ev: MyEvent) {
    setBusyId(ev.id);
    try {
      const res = await fetch(`/api/company/events/${ev.id}/pay`, { method: 'POST', credentials: 'include' });
      const d = await res.json().catch(() => ({})) as { checkoutUrl?: string; error?: string };
      if (d.checkoutUrl) { window.location.href = d.checkoutUrl; return; }
      setNotice(d.error ?? 'Could not start payment.');
    } finally {
      setBusyId(null);
    }
  }

  async function withdraw(ev: MyEvent) {
    if (busyId !== ev.id) { setBusyId(ev.id); return; } // first click arms, second confirms
    const res = await fetch(`/api/company/events/${ev.id}`, { method: 'DELETE', credentials: 'include' });
    const d = await res.json().catch(() => ({})) as { error?: string };
    setBusyId(null);
    if (!res.ok) { setNotice(d.error ?? 'Could not delete the event.'); return; }
    void load();
  }

  function edit(ev: MyEvent) {
    setEditing({
      id: ev.id,
      initial: {
        title: ev.title, description: ev.description ?? '', startsAt: toLocalInput(ev.startsAt), endsAt: toLocalInput(ev.endsAt),
        format: ev.format, location: ev.location ?? '', registrationUrl: ev.registrationUrl ?? '', tier: ev.tier,
      },
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <main className="min-h-screen px-6 md:px-12 lg:px-16 pt-32 pb-24" style={{ background: navy }}>
      <Helmet>
        <title>My events — NORVARDEN</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="max-w-4xl mx-auto flex flex-col gap-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="font-barlow-condensed uppercase mb-3" style={{ ...eyebrow, color: gold }}>Company</p>
            <h1 className="font-bodoni" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 400, color: white, lineHeight: 1.1 }}>
              My <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>events.</em>
            </h1>
            <p className="font-barlow mt-3 max-w-xl" style={{ fontSize: '15px', fontWeight: 300, color: ice60, lineHeight: 1.7 }}>
              Host hiring events, info sessions and workshops for people with disabilities.
            </p>
          </div>
          {data && !editing && (
            <button
              type="button"
              onClick={() => setEditing({ id: null, initial: EMPTY })}
              className="gold-shimmer-bg font-barlow-condensed uppercase inline-flex items-center gap-2 self-start md:self-auto"
              style={{ ...eyebrow, fontWeight: 600, padding: '14px 24px', borderRadius: '2px', color: navy }}
            >
              <Plus size={13} /> List an event
            </button>
          )}
        </header>

        {notice && (
          <p role="status" className="font-barlow p-4 rounded-sm" style={{ fontSize: '14px', color: white, background: 'hsl(var(--hero-gold) / 0.1)', border }}>
            {notice}
          </p>
        )}

        {error ? (
          <div className="p-6 rounded-sm" style={{ background: navyMid, border }}>
            <p className="font-barlow mb-3" style={{ fontSize: '15px', color: white }}>{error.message}</p>
            {error.code === 'not_approved' && (
              <Link to="/verify-company" className="font-barlow-condensed uppercase" style={{ ...eyebrow, color: gold }}>Verify your company →</Link>
            )}
          </div>
        ) : !data ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'hsl(var(--hero-gold) / 0.25)', borderTopColor: gold }} />
          </div>
        ) : (
          <>
            {editing && (
              <EventForm
                key={editing.id ?? 'new'}
                quote={data.quote}
                initial={editing.initial}
                editId={editing.id}
                onCancel={() => setEditing(null)}
                onDone={() => { setEditing(null); setNotice(editing.id ? 'Changes saved.' : 'Submitted. We’ll email you when it’s live.'); void load(); }}
              />
            )}

            {data.events.length === 0 && !editing ? (
              <div className="p-8 rounded-sm flex flex-col items-center text-center gap-3" style={{ background: navyMid, border }}>
                <CalendarDays size={28} style={{ color: gold }} />
                <p className="font-bodoni" style={{ fontSize: '22px', color: white }}>No events yet</p>
                <p className="font-barlow max-w-md" style={{ fontSize: '15px', fontWeight: 300, color: ice60 }}>
                  Standard listings start at {priceText(data.quote.standard)}{data.quote.standard.amountCents === 0 ? ' with your plan' : ''}. Featured listings add a home-page spot and an email to members.
                </p>
              </div>
            ) : (
              <section className="flex flex-col gap-3" aria-label="Your events">
                {data.events.map((ev) => {
                  const st = STATUS_TEXT[ev.status];
                  const canEdit = ev.status === 'pending_payment' || ev.status === 'pending_review';
                  return (
                    <article key={ev.id} className="p-5 rounded-sm flex flex-col md:flex-row md:items-center gap-4" style={{ background: navyMid, border }}>
                      <div className="min-w-0 flex-1 flex flex-col gap-1.5">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="font-barlow-condensed uppercase" style={{ ...eyebrow, fontSize: '11px', color: st.color }}>{st.label}</span>
                          {ev.tier === 'featured' && <span className="font-barlow-condensed uppercase inline-flex items-center gap-1" style={{ ...eyebrow, fontSize: '11px', color: gold }}><Star size={10} /> Featured</span>}
                          {ev.paymentStatus === 'paid' && <span className="font-barlow" style={{ fontSize: '12px', color: ice60 }}>Paid {money(ev.amountCents ?? 0)}</span>}
                          {ev.paymentStatus === 'refunded' && <span className="font-barlow" style={{ fontSize: '12px', color: ice60 }}>Refunded {money(ev.amountCents ?? 0)}</span>}
                        </div>
                        <p className="font-bodoni" style={{ fontSize: '20px', color: white, lineHeight: 1.25 }}>{ev.title}</p>
                        <p className="font-barlow" style={{ fontSize: '13px', color: ice60 }}>
                          {formatEventWhen(ev.startsAt, ev.endsAt)} · {FORMAT_LABELS[ev.format]}{ev.location ? ` · ${ev.location}` : ''}
                        </p>
                        <p className="font-barlow" style={{ fontSize: '12px', color: ice60 }}>
                          {ev.status === 'rejected' && ev.reviewNote ? `Reason: ${ev.reviewNote}` : st.help}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 shrink-0">
                        {ev.status === 'pending_payment' && (
                          <button type="button" onClick={() => void payNow(ev)} disabled={busyId === ev.id}
                            className="gold-shimmer-bg font-barlow-condensed uppercase inline-flex items-center gap-2 disabled:opacity-50"
                            style={{ ...eyebrow, fontSize: '11px', fontWeight: 600, padding: '10px 16px', borderRadius: '2px', color: navy }}>
                            <CreditCard size={11} /> Pay now · {money(ev.amountCents ?? 0)}
                          </button>
                        )}
                        {ev.status === 'approved' && (
                          <Link to="/events" className="font-barlow-condensed uppercase inline-flex items-center" style={{ ...eyebrow, fontSize: '11px', padding: '10px 16px', borderRadius: '2px', border, color: gold }}>
                            View live
                          </Link>
                        )}
                        {canEdit && (
                          <button type="button" onClick={() => edit(ev)} className="font-barlow-condensed uppercase inline-flex items-center gap-2"
                            style={{ ...eyebrow, fontSize: '11px', padding: '10px 16px', borderRadius: '2px', border, color: ice60, background: 'transparent' }}>
                            <Pencil size={11} /> Edit
                          </button>
                        )}
                        {ev.status === 'pending_payment' && (
                          <button type="button" onClick={() => void withdraw(ev)} className="font-barlow-condensed uppercase inline-flex items-center gap-2"
                            style={{ ...eyebrow, fontSize: '11px', padding: '10px 16px', borderRadius: '2px', border: `1px solid ${danger}`, color: danger, background: 'transparent' }}>
                            <Trash2 size={11} /> {busyId === ev.id ? 'Click to confirm' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function CompanyEventsPage() {
  return (
    <AuthGuard>
      <CompanyEventsInner />
    </AuthGuard>
  );
}
