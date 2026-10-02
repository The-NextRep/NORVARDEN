import { jobs } from 'virtual:content';
import { ContentListContext } from '@airo/content';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { Search, MapPin, X, Shield, ChevronRight, Building2, Clock, Tag, DollarSign, CalendarClock, Bookmark, BookmarkCheck } from 'lucide-react';
import { Link } from 'react-router';
import { useCurrentUser } from '@/lib/auth/use-current-user';

const siteUrl = 'https://jobs.the-nextrep.com';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type JobType = 'full_time' | 'part_time' | 'contract' | 'internship' | 'skillbridge';

interface JobSummary {
  id: number;
  title: string;
  location: string | null;
  jobType: JobType;
  industry: string | null;
  isRemote: boolean | null;
  payRangeMin: number | null;
  payRangeMax: number | null;
  payCurrency: string | null;
  isVeteranReady: boolean | null;
  requiredSkills: string[] | null;
  applicationDeadline: string | null;
  postedAt: string;
  companyId: number;
  companyName: string;
  isStaffingAgency: boolean | null;
  skillbridgePartner: boolean | null;
}

interface JobDetail extends JobSummary {
  description: string;
  companyWebsite: string | null;
  orgType: string | null;
  missionDiscountUnlocked: boolean | null;
  requiredSkills: string[] | null;
  applicationDeadline: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function getJobTypeLabel(key: string): string {
  return jobs.jobTypeLabels.find((t) => t.key === key)?.label ?? key;
}

function formatPay(min: number | null, max: number | null, _currency: string | null): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n.toLocaleString()}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  if (max) return `Up to ${fmt(max)}`;
  return null;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — all via CSS variables, no literals
// ─────────────────────────────────────────────────────────────────────────────
const navy          = 'hsl(var(--hero-navy))';
const gold          = 'hsl(var(--hero-gold))';
const ice           = 'hsl(var(--hero-ice))';
const white         = 'hsl(var(--hero-white))';
const ice60         = 'hsl(var(--hero-ice-60))';
const sky           = 'hsl(var(--hero-sky))';
const goldBorder    = '1px solid hsl(var(--hero-gold))';
const goldBorder35  = '1px solid hsl(var(--hero-gold) / 0.35)';
const goldBorder20  = '1px solid hsl(var(--hero-gold) / 0.20)';
const cardBg        = 'hsl(var(--hero-card-bg))';
const panelBg       = 'hsl(var(--hero-panel-bg))';
const backdropDark  = 'hsl(var(--hero-backdrop-dark))';
const goldGradient  = `linear-gradient(to right, transparent, ${gold} 30%, ${gold} 70%, transparent)`;

// ─────────────────────────────────────────────────────────────────────────────
// Verified badge
// ─────────────────────────────────────────────────────────────────────────────
function VerifiedBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 font-barlow-condensed uppercase"
      style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.22em', color: gold }}
      title="Verified Company"
    >
      <Shield size={9} strokeWidth={2.5} />
      Verified
    </span>
  );
}

// (JobCard inlined into the grid map below)

// ─────────────────────────────────────────────────────────────────────────────
// Job detail panel (slide-in sheet)
const REPORT_REASONS: Array<[string, string]> = [
  ['fee_for_training', 'Asked me to pay for training'],
  ['fee_for_equipment', 'Asked me to pay for equipment'],
  ['fee_for_background_check', 'Asked me to pay for a background check'],
  ['gift_card_request', 'Asked for gift cards'],
  ['wire_transfer', 'Asked for a wire transfer'],
  ['crypto', 'Asked for crypto'],
  ['check_deposit', 'Sent a check to deposit'],
  ['off_platform_chat', 'Pushed me to chat off-platform'],
  ['other', 'Something else'],
];

/** Lets a member flag a suspicious listing for admin review. */
function ReportListing({ companyId, jobPostId }: { companyId: number; jobPostId: number }) {
  const [open, setOpen]       = useState(false);
  const [reason, setReason]   = useState('');
  const [details, setDetails] = useState('');
  const [state, setState]     = useState<'idle' | 'sending' | 'done'>('idle');
  const [msg, setMsg]         = useState('');

  async function submit() {
    if (!reason) { setMsg('Choose a reason.'); return; }
    setState('sending');
    setMsg('');
    try {
      const res = await fetch('/api/company-reports', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, jobPostId, reason, details: details.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({})) as { error?: string };
      if (!res.ok) { setState('idle'); setMsg(data.error ?? 'Could not send the report.'); return; }
      setState('done');
    } catch {
      setState('idle');
      setMsg('Network error. Please try again.');
    }
  }

  const small = { fontSize: '12px', fontWeight: 300, color: ice60 } as const;
  if (state === 'done') {
    return <p className="font-barlow" style={small}>Thanks — our team will review this company.</p>;
  }
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="font-barlow self-start hover:underline" style={{ ...small, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
        Report this listing
      </button>
    );
  }
  return (
    <div className="flex flex-col gap-2 p-4 rounded-sm" style={{ border: '1px solid hsl(var(--hero-gold) / 0.2)' }}>
      <select value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Reason" className="font-barlow px-3 py-2 rounded-sm" style={{ background: 'hsl(var(--hero-navy-mid))', color: white, fontSize: '14px' }}>
        <option value="">Why are you reporting this?</option>
        {REPORT_REASONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <textarea value={details} onChange={(e) => setDetails(e.target.value)} maxLength={2000} rows={3} placeholder="Details (optional)" className="font-barlow px-3 py-2 rounded-sm" style={{ background: 'hsl(var(--hero-navy-mid))', color: white, fontSize: '14px' }} />
      {msg && <p className="font-barlow" style={{ fontSize: '13px', color: 'hsl(var(--destructive))' }}>{msg}</p>}
      <div className="flex gap-4">
        <button type="button" onClick={() => void submit()} disabled={state === 'sending'} className="font-barlow-condensed uppercase disabled:opacity-50" style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.28em', padding: '10px 18px', borderRadius: '2px', background: gold, color: navy, border: 'none' }}>
          {state === 'sending' ? 'Sending…' : 'Send report'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="font-barlow" style={{ ...small, background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function JobDetail({
  jobId,
  onClose,
  isLoggedIn,
  isMember,
  isSaved,
  onToggleSave,
}: {
  jobId: number;
  onClose: () => void;
  isLoggedIn: boolean;
  isMember: boolean;
  isSaved: boolean;
  onToggleSave: (id: number) => void;
}) {
  const [job, setJob]       = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/jobs/${jobId}`)
      .then((r) => r.json())
      .then((d: { job?: JobDetail }) => { setJob(d.job ?? null); setLoading(false); })
      .catch(() => { setError('Could not load this job.'); setLoading(false); });
  }, [jobId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => { panelRef.current?.focus(); }, []);

  const pay = job ? formatPay(job.payRangeMin, job.payRangeMax, job.payCurrency) : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: backdropDark, backdropFilter: 'blur(4px)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Job details"
        className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-xl overflow-y-auto flex flex-col outline-none"
        style={{ background: panelBg, borderLeft: goldBorder35 }}
      >
        {/* Panel header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-8 py-5"
          style={{ background: panelBg, borderBottom: goldBorder20 }}
        >
          <span
            className="font-barlow-condensed uppercase"
            style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.32em', color: gold }}
          >
            Role Details
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2"
            style={{ border: goldBorder35, color: gold, outlineColor: gold }}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 px-8 py-8 flex flex-col gap-8">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div
                className="w-6 h-6 rounded-full border-2 animate-spin"
                style={{ borderColor: `${gold} transparent transparent transparent` }}
              />
            </div>
          )}

          {error && (
            <p className="font-barlow text-center py-20" style={{ fontSize: '16px', fontWeight: 300, color: ice60 }}>
              {error}
            </p>
          )}

          {job && !loading && (
            <>
              {/* Title */}
              <div className="flex flex-col gap-3">
                <h2
                  className="font-bodoni"
                  style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.01em', color: white }}
                >
                  {job.title}
                </h2>

                <div className="flex items-center gap-2 flex-wrap">
                  <Building2 size={13} style={{ color: ice60 }} />
                  <span className="font-barlow" style={{ fontSize: '15px', fontWeight: 300, color: ice }}>
                    {job.companyName}
                  </span>
                  <VerifiedBadge />
                  {job.skillbridgePartner && (
                    <span
                      className="font-barlow-condensed uppercase"
                      style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.22em', color: sky }}
                    >
                      SkillBridge Partner
                    </span>
                  )}
                </div>

                {job.isStaffingAgency && (
                  <p className="font-barlow italic" style={{ fontSize: '13px', fontWeight: 300, color: ice60 }}>
                    Posted by a staffing agency.
                  </p>
                )}
              </div>

              {/* Hairline */}
              <div style={{ height: '1px', background: goldGradient }} aria-hidden="true" />

              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Location',  value: job.isRemote ? 'Remote' : (job.location ?? '—') },
                  { label: 'Type',      value: getJobTypeLabel(job.jobType) },
                  { label: 'Industry',  value: job.industry ?? '—' },
                  { label: 'Pay',       value: pay ?? '—' },
                  { label: 'Posted',    value: timeAgo(job.postedAt) },
                  ...(job.applicationDeadline ? [{ label: 'Deadline', value: new Date(job.applicationDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }] : []),
                  ...(job.isVeteranReady ? [{ label: 'Veteran-ready', value: 'Yes' }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col gap-1">
                    <span
                      className="font-barlow-condensed uppercase"
                      style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.28em', color: gold }}
                    >
                      {label}
                    </span>
                    <span className="font-barlow" style={{ fontSize: '14px', fontWeight: 300, color: ice }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Hairline */}
              <div style={{ height: '1px', background: goldGradient }} aria-hidden="true" />

              {/* Description */}
              <div className="flex flex-col gap-3">
                <span
                  className="font-barlow-condensed uppercase"
                  style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.32em', color: gold }}
                >
                  About this role
                </span>
                <div
                  className="font-barlow"
                  style={{ fontSize: '16px', fontWeight: 300, lineHeight: 1.75, color: ice, whiteSpace: 'pre-wrap' }}
                >
                  {job.description}
                </div>
              </div>

              {/* Required skills */}
              {job.requiredSkills && job.requiredSkills.length > 0 && (
                <>
                  <div style={{ height: '1px', background: goldGradient }} aria-hidden="true" />
                  <div className="flex flex-col gap-3">
                    <span
                      className="font-barlow-condensed uppercase"
                      style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.32em', color: gold }}
                    >
                      Required skills
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {job.requiredSkills.map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center gap-1.5 font-barlow-condensed uppercase"
                          style={{
                            fontSize: '9px', fontWeight: 500, letterSpacing: '0.2em',
                            padding: '4px 10px', borderRadius: '2px',
                            background: 'hsl(var(--hero-gold) / 0.08)',
                            border: goldBorder35, color: ice60,
                          }}
                        >
                          <Tag size={9} />
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Hairline */}
              <div style={{ height: '1px', background: goldGradient }} aria-hidden="true" />

              {/* Company info */}
              <div className="flex flex-col gap-3">
                <span
                  className="font-barlow-condensed uppercase"
                  style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.32em', color: gold }}
                >
                  About the company
                </span>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 flex items-center justify-center shrink-0"
                    style={{ border: goldBorder35, borderRadius: '2px', background: cardBg }}
                  >
                    <Building2 size={16} style={{ color: gold }} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bodoni" style={{ fontSize: '18px', fontWeight: 400, color: white }}>
                      {job.companyName}
                    </span>
                    {job.companyWebsite && (
                      <a
                        href={job.companyWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-barlow transition-colors hover:underline"
                        style={{ fontSize: '13px', fontWeight: 300, color: ice60 }}
                      >
                        {job.companyWebsite.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-2 flex flex-col gap-4">
                {isMember ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onToggleSave(job.id)}
                      aria-pressed={isSaved}
                      className={`font-barlow-condensed uppercase inline-flex items-center justify-center gap-2 self-start transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${isSaved ? '' : 'gold-shimmer-bg'}`}
                      style={{
                        fontSize: '11px', fontWeight: 600, letterSpacing: '0.3em',
                        padding: '16px 36px', borderRadius: '3px', outlineColor: gold,
                        color: isSaved ? gold : navy,
                        border: isSaved ? '1px solid hsl(var(--hero-gold) / 0.7)' : 'none',
                        background: isSaved ? 'transparent' : undefined,
                      }}
                    >
                      {isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                      {isSaved ? 'Saved' : 'Save this role'}
                    </button>
                    <p className="font-barlow" style={{ fontSize: '14px', fontWeight: 300, lineHeight: 1.6, color: 'hsl(var(--hero-ice) / 0.75)' }}>
                      Verified companies reach out to members whose profiles fit their roles. Keep your{' '}
                      <Link to="/profile/edit" style={{ color: gold }}>profile</Link> complete and your{' '}
                      <Link to="/resume-builder" style={{ color: gold }}>résumé</Link> up to date. Find saved roles any time under{' '}
                      <Link to="/saved-jobs" style={{ color: gold }}>Saved jobs</Link>.
                    </p>
                    <ReportListing companyId={job.companyId} jobPostId={job.id} />
                  </>
                ) : isLoggedIn ? (
                  <p className="font-barlow" style={{ fontSize: '14px', fontWeight: 300, color: 'hsl(var(--hero-ice) / 0.75)' }}>
                    Members (athletes, coaches and veterans) can save roles and get discovered by verified companies.
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    <a
                      href="/signup"
                      className="gold-shimmer-bg font-barlow-condensed uppercase inline-flex items-center justify-center gap-2 self-start transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                      style={{
                        fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em',
                        padding: '17px 44px', borderRadius: '3px', color: navy, outlineColor: gold,
                      }}
                    >
                      Join free to save roles
                      <ChevronRight size={13} />
                    </a>
                    <p className="font-barlow" style={{ fontSize: '13px', fontWeight: 300, color: 'hsl(var(--hero-ice) / 0.75)' }}>
                      Free for athletes, coaches and veterans. Verified companies reach out to members whose profiles fit.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter bar
// ─────────────────────────────────────────────────────────────────────────────
interface Filters {
  search: string;
  location: string;
  jobType: string;
  industry: string;
  remote: boolean;
  veteranReady: boolean;
  payMin: string;
  payMax: string;
  skills: string;
}

function FilterBar({ filters, onChange }: { filters: Filters; onChange: (f: Filters) => void }) {
  const set = (key: keyof Filters, value: string | boolean) =>
    onChange({ ...filters, [key]: value });

  const inputStyle: React.CSSProperties = {
    background: cardBg,
    border: goldBorder35,
    borderRadius: '3px',
    color: white,
    fontFamily: "'Barlow', sans-serif",
    fontSize: '14px',
    fontWeight: 300,
    padding: '10px 14px',
    outline: 'none',
    width: '100%',
  };

  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };

  const toggleStyle = (active: boolean): React.CSSProperties => ({
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: '10px',
    fontWeight: 500,
    letterSpacing: '0.28em',
    textTransform: 'uppercase',
    padding: '10px 16px',
    border: active ? goldBorder : goldBorder35,
    borderRadius: '3px',
    background: active ? 'hsl(var(--hero-gold) / 0.12)' : 'transparent',
    color: active ? gold : ice60,
    cursor: 'pointer',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  });

  return (
    <div className="flex flex-col gap-3">
      {/* Row 1: search + location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: ice60 }} />
          <input
            type="text"
            placeholder="Search roles…"
            value={filters.search}
            onChange={(e) => set('search', e.target.value)}
            style={{ ...inputStyle, paddingLeft: '34px' }}
            aria-label="Search jobs"
          />
        </div>
        <div className="relative">
          <MapPin size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: ice60 }} />
          <input
            type="text"
            placeholder="Location…"
            value={filters.location}
            onChange={(e) => set('location', e.target.value)}
            style={{ ...inputStyle, paddingLeft: '34px' }}
            aria-label="Filter by location"
          />
        </div>
      </div>

      {/* Row 2: selects + toggles */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={filters.jobType}
          onChange={(e) => set('jobType', e.target.value)}
          style={{ ...selectStyle, width: 'auto', minWidth: '140px' }}
          aria-label="Filter by job type"
        >
          <option value="">All types</option>
          <option value="full_time">Full-time</option>
          <option value="part_time">Part-time</option>
          <option value="contract">Contract</option>
          <option value="internship">Internship</option>
          <option value="skillbridge">SkillBridge</option>
        </select>

        <select
          value={filters.industry}
          onChange={(e) => set('industry', e.target.value)}
          style={{ ...selectStyle, width: 'auto', minWidth: '140px' }}
          aria-label="Filter by industry"
        >
          <option value="">All industries</option>
          <ContentListContext field="jobs.industries">
            {jobs.industries.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </ContentListContext>
        </select>

        <button
          onClick={() => set('remote', !filters.remote)}
          style={toggleStyle(filters.remote)}
          aria-pressed={filters.remote}
        >
          Remote only
        </button>

        <button
          onClick={() => set('veteranReady', !filters.veteranReady)}
          style={toggleStyle(filters.veteranReady)}
          aria-pressed={filters.veteranReady}
        >
          Veteran-ready employers
        </button>

      {/* Row 3: salary range + skills */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <DollarSign size={13} style={{ color: ice60, flexShrink: 0 }} />
          <input
            type="number"
            placeholder="Min salary"
            value={filters.payMin}
            onChange={(e) => set('payMin', e.target.value)}
            min={0}
            style={{ ...inputStyle, width: '120px' }}
            aria-label="Minimum salary"
          />
          <span className="font-barlow" style={{ fontSize: '13px', fontWeight: 300, color: ice60 }}>–</span>
          <input
            type="number"
            placeholder="Max salary"
            value={filters.payMax}
            onChange={(e) => set('payMax', e.target.value)}
            min={0}
            style={{ ...inputStyle, width: '120px' }}
            aria-label="Maximum salary"
          />
        </div>
        <div className="relative flex-1" style={{ minWidth: '180px' }}>
          <Tag size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: ice60 }} />
          <input
            type="text"
            placeholder="Skills (e.g. coaching, SQL)"
            value={filters.skills}
            onChange={(e) => set('skills', e.target.value)}
            style={{ ...inputStyle, paddingLeft: '34px' }}
            aria-label="Filter by required skills"
          />
        </div>
      </div>

        {(filters.search || filters.location || filters.jobType || filters.industry || filters.remote || filters.veteranReady || filters.payMin || filters.payMax || filters.skills) && (
          <button
            onClick={() => onChange({ search: '', location: '', jobType: '', industry: '', remote: false, veteranReady: false, payMin: '', payMax: '', skills: '' })}
            className="inline-flex items-center gap-1.5 font-barlow-condensed uppercase transition-colors hover:opacity-80"
            style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.22em', color: ice60 }}
          >
            <X size={11} />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function JobsPage() {
  const [jobList, setJobList]               = useState<JobSummary[]>([]);
  const [loading, setLoading]         = useState(true);
  const [fetchError, setFetchError]   = useState<string | null>(null);
  const [selectedId, setSelectedId]   = useState<number | null>(null);
  const [filters, setFilters]         = useState<Filters>({
    search: '', location: '', jobType: '', industry: '', remote: false, veteranReady: false,
    payMin: '', payMax: '', skills: '',
  });

  const { user, isPending } = useCurrentUser();
  const isLoggedIn = !!user;
  const isMember = !!user && !user.isAdmin && user.memberType !== null && user.memberType !== 'employer';
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [savedOnly, setSavedOnly] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load the member's saved job IDs
  useEffect(() => {
    if (isPending) return;
    if (!isMember) { setSavedIds(new Set()); return; }
    fetch('/api/saved-jobs/ids', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { ids: [] }))
      .then((d: { ids?: number[] }) => setSavedIds(new Set(d.ids ?? [])))
      .catch(() => {});
  }, [isMember, isPending]);

  // Open a specific job from a link like /jobs?job=12
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const id = Number(new URLSearchParams(window.location.search).get('job'));
    if (Number.isInteger(id) && id > 0) setSelectedId(id);
  }, []);

  const toggleSave = useCallback((id: number) => {
    if (!isMember) { window.location.href = '/signup'; return; }
    const wasSaved = savedIds.has(id);
    setSaveError(null);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (wasSaved) next.delete(id); else next.add(id);
      return next;
    });
    fetch(`/api/saved-jobs/${id}`, { method: wasSaved ? 'DELETE' : 'POST', credentials: 'include' })
      .then(async (r) => {
        if (!r.ok) {
          const d = await r.json().catch(() => ({})) as { error?: string };
          throw new Error(d.error ?? 'Could not update saved roles.');
        }
      })
      .catch((err: unknown) => {
        setSaveError(err instanceof Error ? err.message : 'Could not update saved roles.');
        setSavedIds((prev) => {
          const next = new Set(prev);
          if (wasSaved) next.add(id); else next.delete(id);
          return next;
        });
      });
  }, [isMember, savedIds]);

  const visibleJobs = savedOnly ? jobList.filter((j) => savedIds.has(j.id)) : jobList;

  const fetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchJobs = useCallback((f: Filters) => {
    const params = new URLSearchParams();
    if (f.search)       params.set('search', f.search);
    if (f.location)     params.set('location', f.location);
    if (f.jobType)      params.set('jobType', f.jobType);
    if (f.industry)     params.set('industry', f.industry);
    if (f.remote)       params.set('remote', 'true');
    if (f.veteranReady) params.set('veteranReady', 'true');
    if (f.payMin)       params.set('payMin', f.payMin);
    if (f.payMax)       params.set('payMax', f.payMax);
    if (f.skills)       params.set('skills', f.skills);

    setLoading(true);
    fetch(`/api/jobs?${params.toString()}`)
      .then((r) => r.json())
      .then((d: { jobs?: JobSummary[] }) => { setJobList(d.jobs ?? []); setLoading(false); })
      .catch(() => { setFetchError('Could not load jobs. Please try again.'); setLoading(false); });
  }, []);

  useEffect(() => {
    if (fetchTimer.current) clearTimeout(fetchTimer.current);
    fetchTimer.current = setTimeout(() => fetchJobs(filters), 300);
    return () => { if (fetchTimer.current) clearTimeout(fetchTimer.current); };
  }, [filters, fetchJobs]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${siteUrl}/jobs#webpage`,
    url: `${siteUrl}/jobs`,
    name: 'Open Roles — REP | IV',
    isPartOf: { '@id': `${siteUrl}/#website` },
  };

  return (
    <>
      <Helmet>
        <title>Open Roles — REP | IV</title>
        <meta name="description" content="Browse verified job postings for athletes, coaches, and military veterans. Every company on REP | IV is checked before they can post." />
        <link rel="canonical" href={`${siteUrl}/jobs`} />
        <meta property="og:title" content="Open Roles — REP | IV" />
        <meta property="og:description" content="Browse verified job postings for athletes, coaches, and military veterans." />
        <meta property="og:url" content={`${siteUrl}/jobs`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>
      </Helmet>

      <main>
        {/* ── Page hero — 45vh, football stadium photo, slow zoom ─────────── */}
        <section
          className="relative flex items-end overflow-hidden"
          style={{ minHeight: '45vh', background: navy }}
          aria-label="Jobs hero"
        >
          {/* Background photo — reuses .bg-photo + .active for the breathe zoom */}
          <div
            className="bg-photo active"
            role="img"
            aria-label="Runway seen from above"
            style={{ backgroundImage: 'url(/images/runway-aerial.jpg)' }}
          />

          {/* Navy overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(to right, hsl(var(--hero-navy-80)) 0%, hsl(var(--hero-navy-55)) 55%, hsl(var(--hero-navy-30)) 100%)`,
            }}
            aria-hidden="true"
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
            style={{ background: `linear-gradient(to top, hsl(var(--hero-navy-85)) 0%, transparent 100%)` }}
            aria-hidden="true"
          />

          {/* Hero text */}
          <div className="relative z-10 px-6 md:px-12 lg:px-16 pb-12 pt-24 w-full max-w-7xl mx-auto">
            <p
              className="font-barlow-condensed uppercase mb-4"
              style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.36em', color: gold }}
            >
              Open Roles
            </p>

            <div
              className="mb-5 w-24"
              style={{ height: '1px', background: gold }}
              aria-hidden="true"
            />

            <h1
              className="font-bodoni"
              style={{
                fontSize: 'clamp(2.2rem, 4.5vw, 4rem)',
                fontWeight: 400,
                lineHeight: 1.05,
                letterSpacing: '-0.01em',
                color: white,
              }}
            >
              Your next team is{' '}
              <em className="gold-shimmer" style={{ fontStyle: 'italic' }}>hiring.</em>
            </h1>
          </div>
        </section>

        {/* ── Filters + job grid ──────────────────────────────────────────── */}
        <section
          className="px-6 md:px-12 lg:px-16 py-12 max-w-7xl mx-auto"
          style={{ minHeight: '55vh' }}
        >
          <div className="mb-10">
            <FilterBar filters={filters} onChange={setFilters} />
          </div>

          {/* 1px gold hairline */}
          <div
            className="mb-8"
            style={{ height: '1px', background: `linear-gradient(to right, ${gold}, transparent)` }}
            aria-hidden="true"
          />

          {/* Loading spinner */}
          {loading && (
            <div className="flex items-center justify-center py-24">
              <div
                className="w-8 h-8 rounded-full border-2 animate-spin"
                style={{ borderColor: `${gold} transparent transparent transparent` }}
              />
            </div>
          )}

          {/* Error */}
          {fetchError && !loading && (
            <p className="font-barlow text-center py-24" style={{ fontSize: '16px', fontWeight: 300, color: ice60 }}>
              {fetchError}
            </p>
          )}

          {/* Empty state */}
          {!loading && !fetchError && jobList.length === 0 && (
            <div className="flex flex-col items-center text-center py-24 gap-6 max-w-md mx-auto">
              <div style={{ height: '1px', width: '60px', background: gold }} aria-hidden="true" />
              <h2
                className="font-bodoni"
                style={{ fontSize: '2rem', fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.01em', color: white }}
              >
                New roles are being added.
              </h2>
              <p className="font-barlow" style={{ fontSize: '16px', fontWeight: 300, lineHeight: 1.75, color: ice60 }}>
                Build your profile now so companies can find you.
              </p>
              <a
                href="/signup"
                className="gold-shimmer-bg font-barlow-condensed uppercase inline-flex items-center justify-center transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em',
                  paddingTop: '17px', paddingBottom: '17px',
                  paddingLeft: '44px', paddingRight: '44px',
                  borderRadius: '3px', color: navy, outlineColor: gold,
                }}
              >
                Join free
              </a>
              <div style={{ height: '1px', width: '60px', background: gold }} aria-hidden="true" />
            </div>
          )}

          {/* Job grid */}
          {!loading && !fetchError && jobList.length > 0 && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <p
                  className="font-barlow-condensed uppercase"
                  style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.26em', color: 'hsl(var(--hero-ice) / 0.75)' }}
                >
                  {visibleJobs.length} {visibleJobs.length === 1 ? 'role' : 'roles'} {savedOnly ? 'saved' : 'found'}
                </p>
                {isMember && (
                  <button
                    type="button"
                    onClick={() => setSavedOnly((v) => !v)}
                    aria-pressed={savedOnly}
                    className="font-barlow-condensed uppercase inline-flex items-center gap-2 transition-colors focus-visible:outline focus-visible:outline-2"
                    style={{
                      fontSize: '11px', fontWeight: 600, letterSpacing: '0.22em', padding: '8px 14px', borderRadius: '3px',
                      border: '1px solid hsl(var(--hero-gold) / 0.55)', outlineColor: gold,
                      color: savedOnly ? navy : gold, background: savedOnly ? gold : 'transparent',
                    }}
                  >
                    <Bookmark size={12} /> Saved only ({savedIds.size})
                  </button>
                )}
              </div>
              {saveError && (
                <p role="alert" className="font-barlow mb-4" style={{ fontSize: '14px', color: 'hsl(0 85% 75%)' }}>{saveError}</p>
              )}
              {savedOnly && visibleJobs.length === 0 && (
                <p className="font-barlow py-10" style={{ fontSize: '16px', fontWeight: 300, color: 'hsl(var(--hero-ice) / 0.75)' }}>
                  You haven&rsquo;t saved any of these roles yet. Tap the bookmark on a role to save it.
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {visibleJobs.map((job) => {
                  const cardPay = formatPay(job.payRangeMin, job.payRangeMax, job.payCurrency);
                  const saved = savedIds.has(job.id);
                  return (
                    <div key={job.id} className="relative">
                    {isMember && (
                      <button
                        type="button"
                        onClick={() => toggleSave(job.id)}
                        aria-pressed={saved}
                        aria-label={saved ? `Remove ${job.title} from saved roles` : `Save ${job.title}`}
                        title={saved ? 'Saved' : 'Save role'}
                        className="absolute z-10 w-9 h-9 flex items-center justify-center transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2"
                        style={{ top: '14px', right: '14px', borderRadius: '50%', border: '1px solid hsl(var(--hero-gold) / 0.45)', color: gold, outlineColor: gold, background: 'hsl(var(--hero-navy) / 0.6)' }}
                      >
                        {saved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedId(job.id)}
                      className="w-full h-full text-left transition-all duration-200 focus-visible:outline focus-visible:outline-2"
                      style={{ outlineColor: gold }}
                    >
                      <div
                        className="flex flex-col gap-3 p-6 h-full transition-all duration-200"
                        style={{
                          background: cardBg,
                          backdropFilter: 'blur(16px)',
                          WebkitBackdropFilter: 'blur(16px)',
                          border: goldBorder35,
                          borderRadius: '3px',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.border = goldBorder; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.border = goldBorder35; }}
                      >
                        {/* Title */}
                        <h3
                          className="font-bodoni"
                          style={{ fontSize: '22px', fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.01em', color: white, paddingRight: isMember ? '40px' : 0 }}
                        >
                          {job.title}
                        </h3>

                        {/* Company row */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-barlow" style={{ fontSize: '14px', fontWeight: 300, color: ice }}>
                            {job.companyName}
                          </span>
                          <span
                            className="inline-flex items-center gap-1 font-barlow-condensed uppercase"
                            style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.22em', color: gold }}
                            title="Verified Company"
                          >
                            <Shield size={9} strokeWidth={2.5} />
                            <span>Verified</span>
                          </span>
                          {job.skillbridgePartner && (
                            <span
                              className="font-barlow-condensed uppercase"
                              style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.22em', color: sky }}
                            >
                              SkillBridge Partner
                            </span>
                          )}
                        </div>

                        {/* Staffing agency notice */}
                        {job.isStaffingAgency && (
                          <p className="font-barlow italic" style={{ fontSize: '12px', fontWeight: 300, color: ice60 }}>
                            Posted by a staffing agency.
                          </p>
                        )}

                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                          {(job.location || job.isRemote) && (
                            <span className="inline-flex items-center gap-1 font-barlow" style={{ fontSize: '13px', fontWeight: 300, color: ice60 }}>
                              <MapPin size={11} />
                              <span>{job.isRemote ? 'Remote' : job.location}</span>
                            </span>
                          )}
                          <span
                            className="font-barlow-condensed uppercase"
                            style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.2em', color: ice60 }}
                          >
                            {getJobTypeLabel(job.jobType)}
                          </span>
                          {job.industry && (
                            <span className="font-barlow" style={{ fontSize: '13px', fontWeight: 300, color: ice60 }}>
                              {job.industry}
                            </span>
                          )}
                        </div>

                        {/* Required skills chips (max 3) */}
                        {job.requiredSkills && job.requiredSkills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {job.requiredSkills.slice(0, 3).map((s) => (
                              <span
                                key={s}
                                className="inline-flex items-center gap-1 font-barlow-condensed uppercase"
                                style={{
                                  fontSize: '8px', fontWeight: 500, letterSpacing: '0.18em',
                                  padding: '3px 7px', borderRadius: '2px',
                                  background: 'hsl(var(--hero-gold) / 0.07)',
                                  border: goldBorder20, color: ice60,
                                }}
                              >
                                <Tag size={8} />
                                {s}
                              </span>
                            ))}
                            {job.requiredSkills.length > 3 && (
                              <span className="font-barlow" style={{ fontSize: '11px', fontWeight: 300, color: ice60 }}>
                                +{job.requiredSkills.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Pay + time */}
                        <div className="flex items-center justify-between mt-auto pt-2" style={{ borderTop: goldBorder20 }}>
                          {cardPay ? (
                            <span className="font-barlow" style={{ fontSize: '14px', fontWeight: 300, color: gold }}>
                              {cardPay}
                            </span>
                          ) : <span />}
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="inline-flex items-center gap-1 font-barlow" style={{ fontSize: '12px', fontWeight: 300, color: ice60 }}>
                              <Clock size={10} />
                              <span>{timeAgo(job.postedAt)}</span>
                            </span>
                            {job.applicationDeadline && (
                              <span className="inline-flex items-center gap-1 font-barlow" style={{ fontSize: '11px', fontWeight: 300, color: 'hsl(var(--hero-ice) / 0.6)' }}>
                                <CalendarClock size={9} />
                                <span>Due {new Date(job.applicationDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Veteran-ready tag */}
                        {job.isVeteranReady && (
                          <div
                            className="inline-flex items-center gap-1.5 self-start font-barlow-condensed uppercase"
                            style={{
                              fontSize: '9px', fontWeight: 500, letterSpacing: '0.22em',
                              padding: '3px 8px', border: goldBorder35, borderRadius: '2px', color: gold,
                            }}
                          >
                            Veteran-ready employer
                          </div>
                        )}
                      </div>
                    </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </main>

      {/* Job detail panel */}
      {selectedId !== null && (
        <JobDetail
          jobId={selectedId}
          onClose={() => setSelectedId(null)}
          isLoggedIn={isLoggedIn}
          isMember={isMember}
          isSaved={savedIds.has(selectedId)}
          onToggleSave={toggleSave}
        />
      )}
    </>
  );
}
