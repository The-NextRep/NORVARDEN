/**
 * /company/jobs — Job posting management for verified employers.
 * Lists all company job posts (active / paused / closed) with edit and
 * close/delete actions. Includes a slide-in form panel for creating and
 * editing posts.
 */
import { useEffect, useState, useRef, useCallback } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { Link, useNavigate } from 'react-router';
import {
  PlusCircle, X, ChevronRight, Briefcase, MapPin, DollarSign,
  Clock, Tag, Wifi, Pencil, Trash2, AlertTriangle,
  CheckCircle, ChevronLeft, Loader2,
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
type JobStatus = 'active' | 'paused' | 'closed' | 'removed';
type JobType   = 'full_time' | 'part_time' | 'contract' | 'internship' | 'skillbridge';

interface JobPost {
  id: number;
  title: string;
  description: string;
  location: string | null;
  jobType: JobType;
  industry: string | null;
  isRemote: boolean;
  payRangeMin: number | null;
  payRangeMax: number | null;
  isVeteranReady: boolean;
  requiredSkills: string[] | null;
  applicationDeadline: string | null;
  status: JobStatus;
  postedAt: string;
}

interface FormState {
  title: string;
  description: string;
  location: string;
  jobType: JobType;
  industry: string;
  isRemote: boolean;
  payRangeMin: string;
  payRangeMax: string;
  isVeteranReady: boolean;
  requiredSkills: string[];
  applicationDeadline: string;
}

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  location: '',
  jobType: 'full_time',
  industry: '',
  isRemote: false,
  payRangeMin: '',
  payRangeMax: '',
  isVeteranReady: false,
  requiredSkills: [],
  applicationDeadline: '',
};

const JOB_TYPE_LABELS: Record<JobType, string> = {
  full_time:   'Full-time',
  part_time:   'Part-time',
  contract:    'Contract',
  internship:  'Internship',
  skillbridge: 'SkillBridge',
};

const STATUS_CONFIG: Record<JobStatus, { label: string; color: string; bg: string }> = {
  active:  { label: 'Active',  color: 'hsl(142 60% 55%)', bg: 'hsl(142 60% 55% / 0.1)' },
  paused:  { label: 'Paused',  color: 'hsl(38 90% 60%)',  bg: 'hsl(38 90% 60% / 0.1)'  },
  closed:  { label: 'Closed',  color: ice60,               bg: 'hsl(var(--hero-ice) / 0.08)' },
  removed: { label: 'Removed', color: 'hsl(0 70% 60%)',   bg: 'hsl(0 70% 60% / 0.08)'  },
};

const INDUSTRIES = [
  'Technology', 'Software & IT', 'Data & Analytics', 'Cybersecurity',
  'Customer Support', 'Healthcare', 'Finance', 'Education',
  'Government & Nonprofit', 'Marketing & Media', 'Operations & Logistics', 'Sales', 'Other',
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatSalary(min: number | null, max: number | null): string {
  if (!min && !max) return '';
  const fmt = (n: number) => '$' + n.toLocaleString();
  if (min && max) return fmt(min) + ' – ' + fmt(max);
  if (min) return 'From ' + fmt(min);
  return 'Up to ' + fmt(max!);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Form field wrapper ────────────────────────────────────────────────────────
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-barlow-condensed uppercase mb-2"
        style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.28em', color: ice60 }}>
        {label}{required && <span style={{ color: gold }}> *</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'hsl(var(--hero-navy) / 0.6)',
  border: '1px solid hsl(var(--hero-gold) / 0.2)',
  borderRadius: '2px',
  padding: '10px 14px',
  color: white,
  fontSize: '14px',
  fontFamily: 'var(--font-sans)',
  fontWeight: 300,
  outline: 'none',
};

// ── Skills tag input ──────────────────────────────────────────────────────────
function SkillsInput({ skills, onChange }: { skills: string[]; onChange: (s: string[]) => void }) {
  const [input, setInput] = useState('');

  function addSkill(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed || skills.includes(trimmed) || skills.length >= 20) return;
    onChange([...skills, trimmed]);
    setInput('');
  }

  function removeSkill(s: string) {
    onChange(skills.filter((x) => x !== s));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {skills.map((s) => (
          <span key={s} className="inline-flex items-center gap-1 font-barlow-condensed uppercase"
            style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.2em', padding: '4px 10px', borderRadius: '2px', background: 'hsl(var(--hero-gold) / 0.1)', border: '1px solid hsl(var(--hero-gold) / 0.3)', color: gold }}>
            {s}
            <button type="button" onClick={() => removeSkill(s)} style={{ color: ice60, lineHeight: 1 }}>
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(input); } }}
          placeholder="Type a skill and press Enter"
          style={{ ...inputStyle, flex: 1 }}
        />
        <button type="button" onClick={() => addSkill(input)}
          className="font-barlow-condensed uppercase transition-opacity hover:opacity-80"
          style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.2em', padding: '10px 14px', borderRadius: '2px', background: 'hsl(var(--hero-gold) / 0.12)', border: '1px solid hsl(var(--hero-gold) / 0.3)', color: gold }}>
          Add
        </button>
      </div>
    </div>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className="flex items-center gap-3 transition-opacity hover:opacity-80">
      <div className="relative" style={{ width: '36px', height: '20px' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '10px', background: checked ? gold : 'hsl(var(--hero-gold) / 0.15)', border: '1px solid hsl(var(--hero-gold) / 0.3)', transition: 'background 0.2s' }} />
        <div style={{ position: 'absolute', top: '3px', left: checked ? '19px' : '3px', width: '14px', height: '14px', borderRadius: '50%', background: checked ? navy : ice60, transition: 'left 0.2s' }} />
      </div>
      <span className="font-barlow" style={{ fontSize: '13px', fontWeight: 300, color: ice60 }}>{label}</span>
    </button>
  );
}

// ── Job card ──────────────────────────────────────────────────────────────────
function JobCard({
  post, onEdit, onClose, onDelete,
}: {
  post: JobPost;
  onEdit: (p: JobPost) => void;
  onClose: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const cfg = STATUS_CONFIG[post.status] ?? STATUS_CONFIG.closed;
  const salary = formatSalary(post.payRangeMin, post.payRangeMax);

  return (
    <div className="relative"
      style={{ background: navyMid, border: '1px solid hsl(var(--hero-gold) / 0.15)', borderRadius: '3px', padding: '22px 24px' }}>
      <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-barlow-condensed uppercase"
            style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.22em', padding: '3px 8px', borderRadius: '2px', background: cfg.bg, color: cfg.color, border: '1px solid ' + cfg.color + '33' }}>
            {cfg.label}
          </span>
          <span className="font-barlow-condensed uppercase"
            style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.22em', color: ice60 }}>
            {JOB_TYPE_LABELS[post.jobType]}
          </span>
        </div>
        {post.status !== 'removed' && (
          <div className="flex items-center gap-2">
            <button onClick={() => onEdit(post)}
              className="inline-flex items-center gap-1.5 font-barlow-condensed uppercase transition-opacity hover:opacity-80"
              style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.22em', padding: '6px 12px', borderRadius: '2px', border: '1px solid hsl(var(--hero-gold) / 0.25)', color: ice60, background: 'transparent' }}>
              <Pencil size={11} /> Edit
            </button>
            {post.status !== 'closed' && (
              <button onClick={() => onClose(post.id)}
                className="inline-flex items-center gap-1.5 font-barlow-condensed uppercase transition-opacity hover:opacity-80"
                style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.22em', padding: '6px 12px', borderRadius: '2px', border: '1px solid hsl(var(--hero-gold) / 0.25)', color: ice60, background: 'transparent' }}>
                <X size={11} /> Close
              </button>
            )}
            <button onClick={() => onDelete(post.id)}
              className="inline-flex items-center gap-1.5 font-barlow-condensed uppercase transition-opacity hover:opacity-80"
              style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.22em', padding: '6px 12px', borderRadius: '2px', border: '1px solid hsl(0 70% 45% / 0.3)', color: 'hsl(0 70% 60%)', background: 'transparent' }}>
              <Trash2 size={11} /> Remove
            </button>
          </div>
        )}
      </div>

      <h3 className="font-bodoni mb-2" style={{ fontSize: '20px', fontWeight: 400, color: white, lineHeight: 1.1 }}>
        {post.title}
      </h3>

      <div className="flex flex-wrap gap-x-5 gap-y-1.5 mb-3">
        {post.location && (
          <span className="inline-flex items-center gap-1.5 font-barlow" style={{ fontSize: '13px', fontWeight: 300, color: ice60 }}>
            <MapPin size={12} style={{ color: gold, flexShrink: 0 }} /> {post.location}{post.isRemote ? ' · Remote OK' : ''}
          </span>
        )}
        {!post.location && post.isRemote && (
          <span className="inline-flex items-center gap-1.5 font-barlow" style={{ fontSize: '13px', fontWeight: 300, color: ice60 }}>
            <Wifi size={12} style={{ color: gold, flexShrink: 0 }} /> Remote
          </span>
        )}
        {salary !== '' && (
          <span className="inline-flex items-center gap-1.5 font-barlow" style={{ fontSize: '13px', fontWeight: 300, color: ice60 }}>
            <DollarSign size={12} style={{ color: gold, flexShrink: 0 }} /> {salary}
          </span>
        )}
        {post.applicationDeadline && (
          <span className="inline-flex items-center gap-1.5 font-barlow" style={{ fontSize: '13px', fontWeight: 300, color: ice60 }}>
            <Clock size={12} style={{ color: gold, flexShrink: 0 }} /> Deadline {formatDate(post.applicationDeadline)}
          </span>
        )}
      </div>

      {post.requiredSkills && post.requiredSkills.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {post.requiredSkills.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 font-barlow-condensed uppercase"
              style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.18em', padding: '3px 8px', borderRadius: '2px', background: 'hsl(var(--hero-gold) / 0.07)', border: '1px solid hsl(var(--hero-gold) / 0.2)', color: ice60 }}>
              <Tag size={9} /> {s}
            </span>
          ))}
        </div>
      )}

      <p className="font-barlow" style={{ fontSize: '13px', fontWeight: 300, color: ice60, lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {post.description}
      </p>

      <p className="font-barlow-condensed uppercase mt-3" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.2em', color: 'hsl(var(--hero-ice) / 0.62)' }}>
        Posted {formatDate(post.postedAt)}
      </p>
    </div>
  );
}

// ── Slide-in form panel ───────────────────────────────────────────────────────
function JobFormPanel({
  open, editPost, onClose, onSaved,
}: {
  open: boolean;
  editPost: JobPost | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editPost) {
      setForm({
        title: editPost.title,
        description: editPost.description,
        location: editPost.location ?? '',
        jobType: editPost.jobType,
        industry: editPost.industry ?? '',
        isRemote: editPost.isRemote,
        payRangeMin: editPost.payRangeMin?.toString() ?? '',
        payRangeMax: editPost.payRangeMax?.toString() ?? '',
        isVeteranReady: editPost.isVeteranReady,
        requiredSkills: editPost.requiredSkills ?? [],
        applicationDeadline: editPost.applicationDeadline ? editPost.applicationDeadline.slice(0, 10) : '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError('');
  }, [editPost, open]);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const body = {
        title: form.title,
        description: form.description,
        // Empty values are sent (not omitted) so an edit can clear a field.
        location: form.location,
        jobType: form.jobType,
        industry: form.industry,
        isRemote: form.isRemote,
        payRangeMin: form.payRangeMin ? parseInt(form.payRangeMin, 10) : null,
        payRangeMax: form.payRangeMax ? parseInt(form.payRangeMax, 10) : null,
        isVeteranReady: form.isVeteranReady,
        requiredSkills: form.requiredSkills,
        applicationDeadline: form.applicationDeadline,
      };
      const url    = editPost ? '/api/company/jobs/' + editPost.id : '/api/company/jobs';
      const method = editPost ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error ?? 'Something went wrong.');
        return;
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'hsl(var(--hero-navy) / 0.7)',
          backdropFilter: 'blur(4px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.25s',
        }}
      />
      <div
        ref={panelRef}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 50,
          width: 'min(560px, 100vw)',
          background: navyMid,
          borderLeft: '1px solid hsl(var(--hero-gold) / 0.25)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        <div className="flex items-center justify-between px-7 py-5 shrink-0"
          style={{ borderBottom: '1px solid hsl(var(--hero-gold) / 0.15)', background: navy }}>
          <div>
            <p className="font-barlow-condensed uppercase" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em', color: ice60 }}>
              {editPost ? 'Edit posting' : 'New posting'}
            </p>
            <h2 className="font-bodoni" style={{ fontSize: '22px', fontWeight: 400, color: white, lineHeight: 1.05 }}>
              {editPost ? (
                <>{editPost.title.length > 28 ? editPost.title.slice(0, 28) + '…' : editPost.title}</>
              ) : (
                <>Post a <em style={{ color: gold, fontStyle: 'italic' }}>job.</em></>
              )}
            </h2>
          </div>
          <button onClick={onClose} className="transition-opacity hover:opacity-70"
            style={{ color: ice60, padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={(e) => { void handleSubmit(e); }} className="flex-1 px-7 py-6 space-y-5">
          <Field label="Job title" required>
            <input value={form.title} onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Data Analyst" required style={inputStyle} />
          </Field>

          <Field label="Description" required>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
              placeholder="Describe the role, responsibilities, and what makes it a great opportunity…"
              required rows={6} style={{ ...inputStyle, resize: 'vertical', minHeight: '120px' }} />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Job type" required>
              <select value={form.jobType} onChange={(e) => set('jobType', e.target.value as JobType)}
                style={{ ...inputStyle, cursor: 'pointer' }}>
                {(Object.entries(JOB_TYPE_LABELS) as [JobType, string][]).filter(([v]) => v !== 'skillbridge' || form.jobType === 'skillbridge').map(([v, l]) => (
                  <option key={v} value={v} style={{ background: '#071226' }}>{l}</option>
                ))}
              </select>
            </Field>
            <Field label="Industry">
              <select value={form.industry} onChange={(e) => set('industry', e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="" style={{ background: '#071226' }}>Select industry</option>
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i} style={{ background: '#071226' }}>{i}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Location">
            <input value={form.location} onChange={(e) => set('location', e.target.value)}
              placeholder="e.g. Austin, TX" style={inputStyle} />
          </Field>

          <div className="flex flex-col gap-3">
            <Toggle checked={form.isRemote} onChange={(v) => set('isRemote', v)} label="Remote / hybrid OK" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Salary min (USD)">
              <input type="number" value={form.payRangeMin} onChange={(e) => set('payRangeMin', e.target.value)}
                placeholder="e.g. 60000" min={0} style={inputStyle} />
            </Field>
            <Field label="Salary max (USD)">
              <input type="number" value={form.payRangeMax} onChange={(e) => set('payRangeMax', e.target.value)}
                placeholder="e.g. 90000" min={0} style={inputStyle} />
            </Field>
          </div>

          <Field label="Application deadline">
            <input type="date" value={form.applicationDeadline}
              onChange={(e) => set('applicationDeadline', e.target.value)}
              style={{ ...inputStyle, colorScheme: 'dark' }} />
          </Field>

          <Field label="Required skills">
            <SkillsInput skills={form.requiredSkills} onChange={(s) => set('requiredSkills', s)} />
          </Field>

          {error !== '' && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-sm"
              style={{ background: 'hsl(0 70% 45% / 0.08)', border: '1px solid hsl(0 70% 45% / 0.35)' }}>
              <AlertTriangle size={14} style={{ color: 'hsl(0 70% 60%)', flexShrink: 0 }} />
              <p className="font-barlow" style={{ fontSize: '13px', fontWeight: 300, color: ice60 }}>{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2 pb-6">
            <button type="submit" disabled={saving}
              className="inline-flex items-center gap-2 font-barlow-condensed uppercase transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.28em', padding: '11px 22px', borderRadius: '2px', background: gold, color: navy, border: 'none' }}>
              {saving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
              {saving ? 'Saving…' : editPost ? 'Save changes' : 'Post job'}
            </button>
            <button type="button" onClick={onClose}
              className="font-barlow-condensed uppercase transition-opacity hover:opacity-80"
              style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.28em', padding: '11px 22px', borderRadius: '2px', border: '1px solid hsl(var(--hero-gold) / 0.25)', color: ice60, background: 'transparent' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ── Tab bar ───────────────────────────────────────────────────────────────────
type Tab = 'active' | 'paused' | 'closed';

function TabBar({ active, counts, onChange }: { active: Tab; counts: Record<Tab, number>; onChange: (t: Tab) => void }) {
  const tabs: { key: Tab; label: string }[] = [
    { key: 'active', label: 'Active' },
    { key: 'paused', label: 'Paused' },
    { key: 'closed', label: 'Closed' },
  ];
  return (
    <div className="flex gap-1" style={{ borderBottom: '1px solid hsl(var(--hero-gold) / 0.15)', marginBottom: '24px' }}>
      {tabs.map(({ key, label }) => (
        <button key={key} onClick={() => onChange(key)}
          className="font-barlow-condensed uppercase transition-colors"
          style={{
            fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em',
            padding: '10px 18px',
            color: active === key ? gold : ice60,
            borderBottom: active === key ? '2px solid ' + gold : '2px solid transparent',
            background: 'transparent',
            marginBottom: '-1px',
          }}>
          {label}
          {counts[key] > 0 && (
            <span className="ml-2" style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '10px', background: active === key ? 'hsl(var(--hero-gold) / 0.15)' : 'hsl(var(--hero-gold) / 0.08)', color: active === key ? gold : ice60 }}>
              {counts[key]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Confirm dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({
  open, title, message, confirmLabel, danger, onConfirm, onCancel,
}: {
  open: boolean; title: string; message: string; confirmLabel: string; danger?: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'hsl(var(--hero-navy) / 0.8)', backdropFilter: 'blur(4px)' }} onClick={onCancel} />
      <div className="relative" style={{ background: navyMid, border: '1px solid hsl(var(--hero-gold) / 0.3)', borderRadius: '3px', padding: '28px', maxWidth: '400px', width: '100%' }}>
        <h3 className="font-bodoni mb-2" style={{ fontSize: '20px', fontWeight: 400, color: white }}>{title}</h3>
        <p className="font-barlow mb-6" style={{ fontSize: '14px', fontWeight: 300, color: ice60, lineHeight: 1.6 }}>{message}</p>
        <div className="flex gap-3">
          <button onClick={onConfirm}
            className="font-barlow-condensed uppercase transition-opacity hover:opacity-80"
            style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.28em', padding: '10px 20px', borderRadius: '2px', background: danger === true ? 'hsl(0 70% 45%)' : gold, color: white, border: 'none' }}>
            {confirmLabel}
          </button>
          <button onClick={onCancel}
            className="font-barlow-condensed uppercase transition-opacity hover:opacity-80"
            style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.28em', padding: '10px 20px', borderRadius: '2px', border: '1px solid hsl(var(--hero-gold) / 0.25)', color: ice60, background: 'transparent' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Inner page ────────────────────────────────────────────────────────────────
function CompanyJobsInner() {
  const { user } = useCurrentUser();
  const navigate  = useNavigate();

  const [posts, setPosts]       = useState<JobPost[]>([]);
  const [usage, setUsage]       = useState<{ limit: number | null; activeCount: number } | null>(null);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState<Tab>('active');
  const [formOpen, setFormOpen] = useState(false);
  const [editPost, setEditPost] = useState<JobPost | null>(null);
  const [confirm, setConfirm]   = useState<{ type: 'close' | 'delete'; id: number } | null>(null);

  useEffect(() => {
    if (user && user.memberType !== 'employer') void navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/company/jobs', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json() as { posts: JobPost[]; limit?: number | null; activeCount?: number };
        setPosts(data.posts);
        if (data.limit !== undefined) setUsage({ limit: data.limit, activeCount: data.activeCount ?? 0 });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchPosts(); }, [fetchPosts]);

  function openNew() { setEditPost(null); setFormOpen(true); }
  function openEdit(p: JobPost) { setEditPost(p); setFormOpen(true); }
  function closeForm() { setFormOpen(false); setEditPost(null); }

  async function handleClose(id: number) {
    await fetch('/api/company/jobs/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status: 'closed' }),
    });
    setConfirm(null);
    void fetchPosts();
  }

  async function handleDelete(id: number) {
    await fetch('/api/company/jobs/' + id, { method: 'DELETE', credentials: 'include' });
    setConfirm(null);
    void fetchPosts();
  }

  const visible = posts.filter((p) => {
    if (tab === 'active') return p.status === 'active';
    if (tab === 'paused') return p.status === 'paused';
    return p.status === 'closed' || p.status === 'removed';
  });

  const counts: Record<Tab, number> = {
    active: posts.filter((p) => p.status === 'active').length,
    paused: posts.filter((p) => p.status === 'paused').length,
    closed: posts.filter((p) => p.status === 'closed' || p.status === 'removed').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: navy }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: 'hsl(var(--hero-gold) / 0.25)', borderTopColor: gold }} />
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-24" style={{ background: navy }}>
      <Helmet>
        <title>Job Postings — NORVARDEN</title>
        <meta name="description" content="Create and manage your company's job postings on NORVARDEN. Reach verified people with disabilities." />
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="px-6 md:px-12 lg:px-16 py-10"
        style={{ borderBottom: '1px solid hsl(var(--hero-gold) / 0.15)', background: navyMid }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <Link to="/company/dashboard"
              className="inline-flex items-center gap-1 font-barlow-condensed uppercase transition-opacity hover:opacity-70"
              style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.28em', color: ice60, textDecoration: 'none' }}>
              <ChevronLeft size={12} /> Dashboard
            </Link>
            <ChevronRight size={12} style={{ color: 'hsl(var(--hero-ice) / 0.6)' }} />
            <span className="font-barlow-condensed uppercase" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.28em', color: gold }}>
              Job postings
            </span>
          </div>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="font-barlow-condensed uppercase mb-1" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.32em', color: ice60 }}>
                Employer tools
              </p>
              <h1 className="font-bodoni" style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 400, color: white, lineHeight: 1.05 }}>
                Job <em style={{ color: gold, fontStyle: 'italic' }}>postings.</em>
              </h1>
              {usage && usage.limit !== 0 && (
                <p className="font-barlow mt-2" style={{ fontSize: '13px', fontWeight: 300, color: ice60 }}>
                  {usage.limit === null
                    ? `${usage.activeCount} active · unlimited on your plan`
                    : `${usage.activeCount} of ${usage.limit} active posts used`}
                  {usage.limit !== null && usage.activeCount >= usage.limit && (
                    <> · <Link to="/company/account" style={{ color: gold }}>Upgrade for more</Link></>
                  )}
                </p>
              )}
            </div>
            <button onClick={openNew}
              className="inline-flex items-center gap-2 font-barlow-condensed uppercase transition-opacity hover:opacity-80"
              style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.28em', padding: '11px 22px', borderRadius: '2px', background: gold, color: navy, border: 'none' }}>
              <PlusCircle size={13} /> Post a job
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-12 lg:px-16 pt-10">
        <div className="max-w-5xl mx-auto">
          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center"
              style={{ border: '1px dashed hsl(var(--hero-gold) / 0.2)', borderRadius: '3px' }}>
              <Briefcase size={40} style={{ color: 'hsl(var(--hero-gold) / 0.3)', marginBottom: '16px' }} />
              <h2 className="font-bodoni mb-2" style={{ fontSize: '24px', fontWeight: 400, color: white }}>
                No job posts <em style={{ color: gold, fontStyle: 'italic' }}>yet.</em>
              </h2>
              <p className="font-barlow mb-6" style={{ fontSize: '14px', fontWeight: 300, color: ice60, maxWidth: '360px', lineHeight: 1.65 }}>
                Create your first listing to start connecting with verified people with disabilities.
              </p>
              <button onClick={openNew}
                className="inline-flex items-center gap-2 font-barlow-condensed uppercase transition-opacity hover:opacity-80"
                style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.28em', padding: '11px 22px', borderRadius: '2px', background: gold, color: navy, border: 'none' }}>
                <PlusCircle size={13} /> Post your first job
              </button>
            </div>
          ) : (
            <>
              <TabBar active={tab} counts={counts} onChange={setTab} />
              {visible.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="font-barlow" style={{ fontSize: '14px', fontWeight: 300, color: ice60 }}>
                    No {tab} postings.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {visible.map((p) => (
                    <JobCard key={p.id} post={p}
                      onEdit={openEdit}
                      onClose={(id) => setConfirm({ type: 'close', id })}
                      onDelete={(id) => setConfirm({ type: 'delete', id })}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <JobFormPanel open={formOpen} editPost={editPost} onClose={closeForm} onSaved={() => { void fetchPosts(); }} />

      <ConfirmDialog
        open={confirm?.type === 'close'}
        title="Close this posting?"
        message="The listing will no longer appear in search results. You can reopen it by editing the post."
        confirmLabel="Close posting"
        onConfirm={() => { if (confirm) void handleClose(confirm.id); }}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm?.type === 'delete'}
        title="Remove this posting?"
        message="This will permanently remove the listing. This action cannot be undone."
        confirmLabel="Remove"
        danger
        onConfirm={() => { if (confirm) void handleDelete(confirm.id); }}
        onCancel={() => setConfirm(null)}
      />
    </main>
  );
}

export default function CompanyJobsPage() {
  return (
    <AuthGuard>
      <CompanyJobsInner />
    </AuthGuard>
  );
}
