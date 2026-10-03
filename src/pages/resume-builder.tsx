import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { ArrowDown, ArrowUp, Download, Plus, Sparkles, Trash2, X } from 'lucide-react';
import { useCurrentUser } from '@/lib/auth/use-current-user';
import {
  emptyResume, RESUME_LIMITS as L,
  type ResumeData, type ResumeExperience, type ResumeEducation, type ResumeCertification,
} from '@/lib/resume-types';

// ─── Design tokens (site palette) ───────────────────────────────────────────
const navy  = 'hsl(var(--hero-navy))';
const gold  = 'hsl(var(--hero-gold))';
const white = 'hsl(var(--hero-white))';
const faded = 'hsl(var(--hero-ice) / 0.78)';
const panel = 'hsl(var(--hero-panel-bg))';
const line  = '1px solid hsl(var(--hero-gold) / 0.28)';

type Track = 'work' | 'early' | 'break';

const TRACK_LABELS: Record<Track, string> = { work: 'Work experience', early: 'Students & early career', break: 'Career break' };

interface Prefill {
  fullName: string; headline: string; email: string; phone: string; location: string; linkedinUrl: string;
  summary: string; skills: string[]; memberType: string | null;
  sport: string | null; league: string | null; yearsActive: string | null;
  coachingSport: string | null; coachingLevel: string | null; yearsCoaching: string | null;
  branch: string | null; mos: string | null; yearsServed: string | null;
}

// ─── "Translate your experience" suggestions ────────────────────────────────
const SUGGESTIONS: Record<Track, string[]> = {
  work: [
    'Delivered [12] projects on time and within budget by building clear plans, tracking milestones and flagging risks early',
    'Improved a key process, cutting turnaround time by [30%] and reducing errors by [25%]',
    'Resolved [40+] customer or user requests per week while maintaining a [95%] satisfaction rating',
    'Analyzed [data/reports] to identify trends and recommend changes that saved [$20,000] a year',
    'Trained and mentored [5] new team members on tools, workflows and quality standards',
    'Collaborated with [design, engineering and sales] teams to launch [product/feature] used by [10,000+] people',
    'Created clear documentation and guides that reduced repeat support questions by [35%]',
    'Used assistive and productivity technology ([screen reader / speech-to-text / task-management tools]) to manage a high-volume workload accurately',
  ],
  early: [
    'Completed a [capstone/class] project in [subject], [building/researching] [what] and presenting results to [audience]',
    'Earned [certification, e.g. Google IT Support / CompTIA A+] while studying [part-time/full-time]',
    'Built [an app / website / dashboard] using [tools], now used by [number] people',
    'Interned at [organization], supporting [team] with [tasks] and delivering [result]',
    'Led a [club / group project] of [8] people, organizing [events/meetings] and meeting every deadline',
    'Tutored or mentored [10+] students in [subject], improving their [grades/scores] by [amount]',
    'Volunteered [100+] hours with [organization], helping [who] with [what]',
    'Balanced [coursework] with [part-time work / other commitments], maintaining a [3.5] GPA',
  ],
  break: [
    'Career break ([2023–2024]): focused on health and recovery; completed [course/certification] in [skill] during this time',
    'Managed a complex schedule of appointments, paperwork and benefits, building strong organization and self-advocacy skills',
    'Completed [online course / bootcamp] in [skill] to stay current while away from full-time work',
    'Freelanced or volunteered as [role] for [organization], delivering [project/result]',
    'Served as a caregiver for a family member, coordinating care, budgets and schedules for [number] people',
    'Learned and became proficient with [assistive technology / software], applying it to [projects/tasks]',
    'Advocated for accessibility with [organization/community], leading to [change or result]',
    'Returned to [field] through [returnship / part-time role / project], delivering [result] within [timeframe]',
  ],
};

const BREAK_PHRASES: [string, string][] = [
  ['Unemployed', 'Career break'],
  ['Medical leave / disability leave', 'Career break: health and recovery (no further detail needed)'],
  ['Not working', 'Professional development: [course / certification]'],
  ['Stayed home', 'Caregiver: managed care, budgets and schedules'],
  ['Did odd jobs', 'Freelance / contract work: [skill], [result]'],
  ['Helped out at …', 'Volunteer [role], [organization]'],
];

let idCounter = 0;
const newId = () => `x${Date.now().toString(36)}${(idCounter++).toString(36)}`;

function blankExperience(): ResumeExperience {
  return { id: newId(), title: '', organization: '', location: '', start: '', end: '', current: false, bullets: [''] };
}

function seedFromPrefill(p: Prefill): ResumeData {
  const r = emptyResume();
  r.fullName = p.fullName; r.headline = p.headline; r.email = p.email; r.phone = p.phone;
  r.location = p.location; r.linkedinUrl = p.linkedinUrl; r.summary = p.summary;
  r.skills = (p.skills ?? []).slice(0, L.skills);
  const exp = blankExperience();
  r.experience = [exp];
  return r;
}

// ─── Small UI pieces ────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, type = 'text', max = L.text }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; max?: number;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-barlow-condensed uppercase" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.2em', color: gold }}>{label}</span>
      <input
        type={type}
        value={value}
        maxLength={max}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="font-barlow w-full outline-none focus-visible:ring-2"
        style={{ fontSize: '15px', padding: '10px 12px', background: 'hsl(var(--hero-navy))', color: white, border: line, borderRadius: '3px' }}
      />
    </label>
  );
}

function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="p-5 flex flex-col gap-4" style={{ background: panel, border: line, borderRadius: '3px' }}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bodoni" style={{ fontSize: '22px', fontWeight: 400, color: white }}>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function SmallButton({ onClick, children, label }: { onClick: () => void; children: ReactNode; label: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label}
      className="inline-flex items-center justify-center gap-1.5 font-barlow-condensed uppercase transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2"
      style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.16em', padding: '7px 10px', color: gold, border: '1px solid hsl(var(--hero-gold) / 0.45)', borderRadius: '3px', outlineColor: gold }}>
      {children}
    </button>
  );
}

// ─── Résumé preview (printable) ─────────────────────────────────────────────
function dates(e: ResumeExperience) {
  const end = e.current ? 'Present' : e.end;
  return [e.start, end].filter(Boolean).join(' – ');
}

function ResumePreview({ r }: { r: ResumeData }) {
  const modern = r.template === 'modern';
  const head: React.CSSProperties = modern
    ? { fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '10.5pt', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1a1a1a', borderBottom: '1.5px solid #b8972a', paddingBottom: '3px', margin: '14px 0 6px' }
    : { fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '12pt', fontWeight: 700, color: '#111', borderBottom: '1px solid #333', paddingBottom: '2px', margin: '14px 0 6px' };
  const body: React.CSSProperties = { fontFamily: modern ? 'Arial, Helvetica, sans-serif' : 'Georgia, "Times New Roman", serif', fontSize: '10.5pt', lineHeight: 1.4, color: '#222' };
  const contact = [r.email, r.phone, r.location, r.linkedinUrl.replace(/^https?:\/\/(www\.)?/, '')].filter(Boolean);
  const exp = r.experience.filter((e) => e.title || e.organization || e.bullets.some(Boolean));
  const edu = r.education.filter((e) => e.school || e.credential);
  const certs = r.certifications.filter((c) => c.name);

  return (
    <article id="resume-print" style={{ ...body, background: '#fff', padding: '0.6in 0.65in', minHeight: '11in' }} aria-label="Résumé preview">
      <header style={{ textAlign: modern ? 'left' : 'center', marginBottom: '6px' }}>
        <h1 style={{ fontFamily: modern ? 'Arial, Helvetica, sans-serif' : 'Georgia, "Times New Roman", serif', fontSize: modern ? '22pt' : '20pt', fontWeight: 700, color: '#111', margin: 0, letterSpacing: modern ? '0.02em' : 0 }}>
          {r.fullName || 'Your Name'}
        </h1>
        {r.headline && <p style={{ margin: '3px 0 0', fontSize: '11pt', color: modern ? '#8a6d1e' : '#333' }}>{r.headline}</p>}
        {contact.length > 0 && <p style={{ margin: '4px 0 0', fontSize: '9.5pt', color: '#444' }}>{contact.join('  |  ')}</p>}
      </header>

      {r.summary && (<>
        <h2 style={head}>Summary</h2>
        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{r.summary}</p>
      </>)}

      {exp.length > 0 && (<>
        <h2 style={head}>Experience</h2>
        {exp.map((e) => (
          <div key={e.id} style={{ marginBottom: '9px', breakInside: 'avoid' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <strong style={{ color: '#111' }}>{e.title}{e.organization ? `, ${e.organization}` : ''}</strong>
              <span style={{ color: '#444', fontSize: '9.5pt' }}>{[e.location, dates(e)].filter(Boolean).join('  ·  ')}</span>
            </div>
            {e.bullets.filter(Boolean).length > 0 && (
              <ul style={{ margin: '3px 0 0', paddingLeft: '18px', listStyle: 'disc' }}>
                {e.bullets.filter(Boolean).map((b, i) => <li key={i} style={{ marginBottom: '2px' }}>{b}</li>)}
              </ul>
            )}
          </div>
        ))}
      </>)}

      {edu.length > 0 && (<>
        <h2 style={head}>Education</h2>
        {edu.map((e) => (
          <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '4px' }}>
            <span><strong style={{ color: '#111' }}>{e.school}</strong>{[e.credential, e.field].filter(Boolean).length ? ` | ${[e.credential, e.field].filter(Boolean).join(', ')}` : ''}</span>
            <span style={{ color: '#444', fontSize: '9.5pt' }}>{e.year}</span>
          </div>
        ))}
      </>)}

      {certs.length > 0 && (<>
        <h2 style={head}>Certifications</h2>
        {certs.map((c) => (
          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '3px' }}>
            <span><strong style={{ color: '#111' }}>{c.name}</strong>{c.issuer ? ` | ${c.issuer}` : ''}</span>
            <span style={{ color: '#444', fontSize: '9.5pt' }}>{c.year}</span>
          </div>
        ))}
      </>)}

      {r.skills.length > 0 && (<>
        <h2 style={head}>Skills</h2>
        <p style={{ margin: 0 }}>{r.skills.join('  •  ')}</p>
      </>)}
    </article>
  );
}

const PRINT_CSS = `
@media print {
  @page { size: letter; margin: 0; }
  html, body { background: #fff !important; }
  body * { visibility: hidden !important; }
  #resume-print, #resume-print * { visibility: visible !important; }
  #resume-print { position: absolute; left: 0; top: 0; width: 8.5in; min-height: auto !important; box-shadow: none !important; }
}
`;

// ─── Page ───────────────────────────────────────────────────────────────────
type SaveState = { kind: 'idle' } | { kind: 'saving' } | { kind: 'saved'; at: string } | { kind: 'error'; msg: string };

export default function ResumeBuilderPage() {
  const { user, isPending } = useCurrentUser();
  const [r, setR] = useState<ResumeData | null>(null);
  const [track, setTrack] = useState<Track>('work');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [save, setSave] = useState<SaveState>({ kind: 'idle' });
  const [targetExp, setTargetExp] = useState<string | null>(null);
  const [skillDraft, setSkillDraft] = useState('');
  const [view, setView] = useState<'edit' | 'preview'>('edit');
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isEmployer = user?.memberType === 'employer';
  const canUse = !!user && !isEmployer;

  useEffect(() => {
    if (!canUse || r) return;
    fetch('/api/resume-builder', { credentials: 'include' })
      .then(async (res) => {
        const d = await res.json().catch(() => ({})) as { resume?: ResumeData | null; updatedAt?: string | null; prefill?: Prefill; error?: string };
        if (!res.ok) throw new Error(d.error ?? 'Could not load your résumé.');
        const data = d.resume ?? (d.prefill ? seedFromPrefill(d.prefill) : emptyResume());
        setR(data);
        setTargetExp(data.experience[0]?.id ?? null);
        if (d.updatedAt) setSave({ kind: 'saved', at: d.updatedAt });
      })
      .catch((e: unknown) => setLoadError(e instanceof Error ? e.message : 'Could not load your résumé.'));
  }, [canUse, r]);

  const doSave = useCallback(async (data: ResumeData) => {
    setSave({ kind: 'saving' });
    try {
      const res = await fetch('/api/resume-builder', {
        method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resume: data }),
      });
      const d = await res.json().catch(() => ({})) as { updatedAt?: string; error?: string };
      if (!res.ok) throw new Error(d.error ?? 'Could not save.');
      dirty.current = false;
      setSave({ kind: 'saved', at: d.updatedAt ?? new Date().toISOString() });
    } catch (e) {
      setSave({ kind: 'error', msg: e instanceof Error ? e.message : 'Could not save.' });
    }
  }, []);

  // Autosave 1.5s after the last change
  const update = useCallback((fn: (d: ResumeData) => ResumeData) => {
    setR((prev) => {
      if (!prev) return prev;
      const next = fn(prev);
      dirty.current = true;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => { void doSave(next); }, 1500);
      return next;
    });
  }, [doSave]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty.current) { e.preventDefault(); } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  const set = <K extends keyof ResumeData>(k: K) => (v: ResumeData[K]) => update((d) => ({ ...d, [k]: v }));

  // Experience helpers
  const setExp = (id: string, patch: Partial<ResumeExperience>) =>
    update((d) => ({ ...d, experience: d.experience.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
  const moveExp = (i: number, dir: -1 | 1) => update((d) => {
    const list = [...d.experience]; const j = i + dir;
    if (j < 0 || j >= list.length) return d;
    [list[i], list[j]] = [list[j], list[i]];
    return { ...d, experience: list };
  });
  const addSuggestion = (text: string) => {
    if (!r) return;
    let id = targetExp && r.experience.some((e) => e.id === targetExp) ? targetExp : null;
    if (!id) {
      const e = blankExperience();
      e.bullets = [text];
      update((d) => ({ ...d, experience: [...d.experience, e].slice(0, L.experience) }));
      setTargetExp(e.id);
      return;
    }
    update((d) => ({
      ...d,
      experience: d.experience.map((e) => {
        if (e.id !== id) return e;
        const bullets = e.bullets.filter(Boolean);
        return bullets.length >= L.bullets ? e : { ...e, bullets: [...bullets, text] };
      }),
    }));
  };

  const addSkill = () => {
    const s = skillDraft.trim().slice(0, L.skill);
    if (!s || !r) return;
    if (!r.skills.some((x) => x.toLowerCase() === s.toLowerCase()) && r.skills.length < L.skills) set('skills')([...r.skills, s]);
    setSkillDraft('');
  };

  const saveLabel = useMemo(() => {
    switch (save.kind) {
      case 'saving': return 'Saving…';
      case 'saved': return `Saved ${new Date(save.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
      case 'error': return save.msg;
      default: return '';
    }
  }, [save]);

  // ── Gates ──
  const gate = (msg: ReactNode) => (
    <main style={{ background: navy, color: white, minHeight: '70vh' }} className="px-5 md:px-12 py-24">
      <div className="mx-auto text-center" style={{ maxWidth: '560px' }}>
        <h1 className="font-bodoni mb-4" style={{ fontSize: '2.4rem', fontWeight: 400 }}>Résumé builder</h1>
        <p className="font-barlow" style={{ fontSize: '17px', fontWeight: 300, lineHeight: 1.7, color: faded }}>{msg}</p>
      </div>
    </main>
  );

  const head = (
    <>
    <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
    <Helmet>
      <title>Résumé Builder — NORVARDEN</title>
      <meta name="robots" content="noindex" />
    </Helmet>
    </>
  );

  if (!user && !isPending) return (<>{head}{gate(<>Please <Link to="/login?next=/resume-builder" style={{ color: gold }}>sign in</Link> or <Link to="/signup" style={{ color: gold }}>join free</Link> to build your résumé.</>)}</>);
  if (isEmployer) return (<>{head}{gate('The résumé builder is for people with disabilities.')}</>);
  if (loadError) return (<>{head}{gate(loadError)}</>);
  if (!r) return (<>{head}<main style={{ background: navy, minHeight: '70vh' }} className="flex items-center justify-center"><div className="w-7 h-7 rounded-full border-2 animate-spin" style={{ borderColor: `${gold} transparent transparent transparent` }} /></main></>);

  return (
    <>
      {head}
      <main style={{ background: navy, color: white }}>
        {/* Header */}
        <section className="px-5 md:px-10 pt-16 pb-8 mx-auto" style={{ maxWidth: '1400px' }}>
          <p className="font-barlow-condensed uppercase mb-3" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.34em', color: gold }}>Career tools</p>
          <h1 className="font-bodoni mb-3" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', fontWeight: 400, lineHeight: 1.05 }}>Résumé builder</h1>
          <p className="font-barlow mb-6" style={{ fontSize: '16px', fontWeight: 300, lineHeight: 1.7, color: faded, maxWidth: '70ch' }}>
            Turn what you did on the field, the sideline or in uniform into a résumé hiring managers understand. Your work saves automatically.
            When it&rsquo;s ready, download the PDF and upload it on your <Link to="/profile/edit" className="underline underline-offset-4" style={{ color: gold }}>profile</Link> so companies you connect with can see it.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => { if (timer.current) clearTimeout(timer.current); void doSave(r); }}
              className="gold-shimmer-bg font-barlow-condensed uppercase inline-flex items-center gap-2"
              style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.26em', padding: '13px 26px', borderRadius: '3px', color: navy }}>
              Save
            </button>
            <button type="button" onClick={() => window.print()}
              className="font-barlow-condensed uppercase inline-flex items-center gap-2"
              style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.26em', padding: '12px 22px', borderRadius: '3px', color: gold, border: '1px solid hsl(var(--hero-gold) / 0.7)' }}>
              <Download size={14} /> Download PDF
            </button>
            <label className="inline-flex items-center gap-2 font-barlow" style={{ fontSize: '14px', color: faded }}>
              Style
              <select value={r.template} onChange={(e) => set('template')(e.target.value === 'modern' ? 'modern' : 'classic')}
                className="font-barlow" style={{ background: navy, color: white, border: line, borderRadius: '3px', padding: '8px 10px', fontSize: '14px' }}>
                <option value="classic">Classic</option>
                <option value="modern">Modern</option>
              </select>
            </label>
            <span role="status" className="font-barlow" style={{ fontSize: '14px', color: save.kind === 'error' ? 'hsl(0 85% 75%)' : faded }}>{saveLabel}</span>
          </div>
          <p className="font-barlow mt-3" style={{ fontSize: '13px', color: 'hsl(var(--hero-ice) / 0.65)' }}>
            Tip: in the print window choose <strong>Save as PDF</strong> as the destination.
          </p>

          {/* Mobile view toggle */}
          <div className="lg:hidden mt-6 inline-flex p-1" style={{ border: line, borderRadius: '3px' }} role="tablist" aria-label="View">
            {(['edit', 'preview'] as const).map((v) => (
              <button key={v} type="button" role="tab" aria-selected={view === v} onClick={() => setView(v)}
                className={`font-barlow-condensed uppercase ${view === v ? 'gold-shimmer-bg' : ''}`}
                style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.2em', padding: '9px 18px', borderRadius: '2px', color: view === v ? navy : faded }}>
                {v === 'edit' ? 'Edit' : 'Preview'}
              </button>
            ))}
          </div>
        </section>

        <section className="px-5 md:px-10 pb-24 mx-auto grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" style={{ maxWidth: '1400px' }}>
          {/* ── Editor ── */}
          <div className={`flex flex-col gap-5 min-w-0 ${view === 'preview' ? 'hidden lg:flex' : ''}`}>
            <Section title="Contact">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" value={r.fullName} onChange={set('fullName')} />
                <Field label="Headline" value={r.headline} onChange={set('headline')} placeholder="e.g. Operations Leader | Former NFL Linebacker" />
                <Field label="Email" type="email" value={r.email} onChange={set('email')} />
                <Field label="Phone" type="tel" value={r.phone} onChange={set('phone')} max={50} />
                <Field label="City, State" value={r.location} onChange={set('location')} />
                <Field label="LinkedIn URL" value={r.linkedinUrl} onChange={set('linkedinUrl')} />
              </div>
            </Section>

            <Section title="Summary">
              <label className="flex flex-col gap-1.5">
                <span className="font-barlow" style={{ fontSize: '14px', color: faded }}>
                  2–4 sentences: who you are, what you&rsquo;re great at, and the role you want next.
                </span>
                <textarea value={r.summary} maxLength={L.summary} rows={5} onChange={(e) => set('summary')(e.target.value)}
                  className="font-barlow w-full outline-none"
                  style={{ fontSize: '15px', lineHeight: 1.6, padding: '10px 12px', background: navy, color: white, border: line, borderRadius: '3px', resize: 'vertical' }} />
              </label>
            </Section>

            {/* Translator */}
            <Section title="Bullet ideas">
              <p className="font-barlow" style={{ fontSize: '14px', lineHeight: 1.6, color: faded }}>
                Click a line to add it to the selected job below, then replace the <strong style={{ color: gold }}>[brackets]</strong> with your real numbers.
              </p>
              <div className="inline-flex flex-wrap gap-1 p-1 self-start" style={{ border: line, borderRadius: '3px' }} role="tablist" aria-label="Experience type">
                {(['work', 'early', 'break'] as const).map((t) => (
                  <button key={t} type="button" role="tab" aria-selected={track === t} onClick={() => setTrack(t)}
                    className={`font-barlow-condensed uppercase ${track === t ? 'gold-shimmer-bg' : ''}`}
                    style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.2em', padding: '8px 14px', borderRadius: '2px', color: track === t ? navy : faded }}>
                    {TRACK_LABELS[t]}
                  </button>
                ))}
              </div>
              {r.experience.length > 1 && (
                <label className="flex items-center gap-2 font-barlow flex-wrap" style={{ fontSize: '14px', color: faded }}>
                  Add to:
                  <select value={targetExp ?? ''} onChange={(e) => setTargetExp(e.target.value)}
                    style={{ background: navy, color: white, border: line, borderRadius: '3px', padding: '6px 8px', fontSize: '14px', maxWidth: '100%' }}>
                    {r.experience.map((e, i) => <option key={e.id} value={e.id}>{e.title || e.organization || `Job ${i + 1}`}</option>)}
                  </select>
                </label>
              )}
              <ul className="flex flex-col gap-2">
                {SUGGESTIONS[track].map((s) => (
                  <li key={s}>
                    <button type="button" onClick={() => addSuggestion(s)}
                      className="w-full text-left flex gap-2.5 p-3 font-barlow transition-colors hover:bg-white/5 focus-visible:outline focus-visible:outline-2"
                      style={{ fontSize: '14px', lineHeight: 1.5, color: white, border: '1px solid hsl(var(--hero-gold) / 0.18)', borderRadius: '3px', outlineColor: gold }}>
                      <Plus size={14} className="shrink-0" style={{ color: gold, marginTop: '3px' }} aria-hidden="true" />
                      <span>{s}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {track === 'break' && (
                <details className="font-barlow" style={{ fontSize: '14px', color: white }}>
                  <summary className="cursor-pointer font-barlow-condensed uppercase" style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.2em', color: gold }}>
                    Phrasing career breaks
                  </summary>
                  <table className="w-full mt-3" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th className="text-left py-1.5 pr-3 font-barlow-condensed uppercase" style={{ fontSize: '11px', letterSpacing: '0.16em', color: faded }}>Instead of</th>
                        <th className="text-left py-1.5 font-barlow-condensed uppercase" style={{ fontSize: '11px', letterSpacing: '0.16em', color: faded }}>Write</th>
                      </tr>
                    </thead>
                    <tbody>
                      {BREAK_PHRASES.map(([a, b]) => (
                        <tr key={a} style={{ borderTop: '1px solid hsl(var(--hero-gold) / 0.15)' }}>
                          <td className="py-1.5 pr-3" style={{ color: faded }}>{a}</td>
                          <td className="py-1.5">{b}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              )}
              <div className="flex gap-2 p-3 font-barlow" style={{ fontSize: '13px', lineHeight: 1.55, color: faded, background: 'hsl(var(--hero-gold) / 0.06)', borderRadius: '3px' }}>
                <Sparkles size={14} className="shrink-0" style={{ color: gold, marginTop: '2px' }} aria-hidden="true" />
                <span>Strong bullets start with an action verb (led, built, managed, trained) and end with a result, ideally a number.</span>
              </div>
            </Section>

            <Section title="Experience" action={
              r.experience.length < L.experience ? (
                <SmallButton label="Add job" onClick={() => { const e = blankExperience(); update((d) => ({ ...d, experience: [...d.experience, e] })); setTargetExp(e.id); }}>
                  <Plus size={12} /> Add job
                </SmallButton>
              ) : undefined
            }>
              {r.experience.length === 0 && <p className="font-barlow" style={{ fontSize: '14px', color: faded }}>Add your first role.</p>}
              {r.experience.map((e, i) => (
                <div key={e.id} className="flex flex-col gap-3 p-4" onFocusCapture={() => setTargetExp(e.id)}
                  style={{ border: targetExp === e.id ? '1px solid hsl(var(--hero-gold) / 0.7)' : '1px solid hsl(var(--hero-gold) / 0.18)', borderRadius: '3px' }}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-barlow-condensed uppercase" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.2em', color: faded }}>Job {i + 1}</span>
                    <div className="flex gap-1.5">
                      <SmallButton label="Move up" onClick={() => moveExp(i, -1)}><ArrowUp size={12} /></SmallButton>
                      <SmallButton label="Move down" onClick={() => moveExp(i, 1)}><ArrowDown size={12} /></SmallButton>
                      <SmallButton label="Remove job" onClick={() => update((d) => ({ ...d, experience: d.experience.filter((x) => x.id !== e.id) }))}><Trash2 size={12} /></SmallButton>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Job title" value={e.title} onChange={(v) => setExp(e.id, { title: v })} />
                    <Field label="Organization" value={e.organization} onChange={(v) => setExp(e.id, { organization: v })} />
                    <Field label="Location" value={e.location} onChange={(v) => setExp(e.id, { location: v })} />
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Start" value={e.start} onChange={(v) => setExp(e.id, { start: v })} placeholder="2016" max={40} />
                      {e.current ? (
                        <div className="flex flex-col gap-1.5">
                          <span className="font-barlow-condensed uppercase" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.2em', color: gold }}>End</span>
                          <span className="font-barlow" style={{ fontSize: '15px', padding: '10px 0', color: faded }}>Present</span>
                        </div>
                      ) : (
                        <Field label="End" value={e.end} onChange={(v) => setExp(e.id, { end: v })} placeholder="2024" max={40} />
                      )}
                    </div>
                  </div>
                  <label className="inline-flex items-center gap-2 font-barlow" style={{ fontSize: '14px', color: faded }}>
                    <input type="checkbox" checked={e.current} onChange={(ev) => setExp(e.id, { current: ev.target.checked })} /> I currently work here
                  </label>
                  <div className="flex flex-col gap-2">
                    <span className="font-barlow-condensed uppercase" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.2em', color: gold }}>Accomplishments</span>
                    {e.bullets.map((b, bi) => (
                      <div key={bi} className="flex gap-2 items-start">
                        <textarea value={b} rows={2} maxLength={L.bullet} aria-label={`Accomplishment ${bi + 1}`}
                          onChange={(ev) => setExp(e.id, { bullets: e.bullets.map((x, k) => (k === bi ? ev.target.value : x)) })}
                          className="font-barlow flex-1 min-w-0 outline-none"
                          style={{ fontSize: '14px', lineHeight: 1.5, padding: '8px 10px', background: navy, color: white, border: line, borderRadius: '3px', resize: 'vertical' }} />
                        <button type="button" aria-label="Remove accomplishment"
                          onClick={() => setExp(e.id, { bullets: e.bullets.filter((_, k) => k !== bi) })}
                          className="p-2 transition-opacity hover:opacity-70" style={{ color: faded }}>
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {e.bullets.length < L.bullets && (
                      <div><SmallButton label="Add accomplishment" onClick={() => setExp(e.id, { bullets: [...e.bullets, ''] })}><Plus size={12} /> Add line</SmallButton></div>
                    )}
                  </div>
                </div>
              ))}
            </Section>

            <Section title="Education" action={r.education.length < L.education ? (
              <SmallButton label="Add education" onClick={() => update((d) => ({ ...d, education: [...d.education, { id: newId(), school: '', credential: '', field: '', year: '' } as ResumeEducation] }))}><Plus size={12} /> Add</SmallButton>
            ) : undefined}>
              {r.education.length === 0 && <p className="font-barlow" style={{ fontSize: '14px', color: faded }}>Add schools, degrees or programs (including certificates, bootcamps and online courses).</p>}
              {r.education.map((e) => (
                <div key={e.id} className="grid gap-3 sm:grid-cols-2 p-4 relative" style={{ border: '1px solid hsl(var(--hero-gold) / 0.18)', borderRadius: '3px' }}>
                  <Field label="School" value={e.school} onChange={(v) => update((d) => ({ ...d, education: d.education.map((x) => (x.id === e.id ? { ...x, school: v } : x)) }))} />
                  <Field label="Degree / credential" value={e.credential} onChange={(v) => update((d) => ({ ...d, education: d.education.map((x) => (x.id === e.id ? { ...x, credential: v } : x)) }))} />
                  <Field label="Field of study" value={e.field} onChange={(v) => update((d) => ({ ...d, education: d.education.map((x) => (x.id === e.id ? { ...x, field: v } : x)) }))} />
                  <div className="flex gap-2 items-end">
                    <div className="flex-1"><Field label="Year" value={e.year} max={40} onChange={(v) => update((d) => ({ ...d, education: d.education.map((x) => (x.id === e.id ? { ...x, year: v } : x)) }))} /></div>
                    <SmallButton label="Remove education" onClick={() => update((d) => ({ ...d, education: d.education.filter((x) => x.id !== e.id) }))}><Trash2 size={12} /></SmallButton>
                  </div>
                </div>
              ))}
            </Section>

            <Section title="Certifications" action={r.certifications.length < L.certifications ? (
              <SmallButton label="Add certification" onClick={() => update((d) => ({ ...d, certifications: [...d.certifications, { id: newId(), name: '', issuer: '', year: '' } as ResumeCertification] }))}><Plus size={12} /> Add</SmallButton>
            ) : undefined}>
              {r.certifications.length === 0 && <p className="font-barlow" style={{ fontSize: '14px', color: faded }}>Licenses, certifications, clearances.</p>}
              {r.certifications.map((c) => (
                <div key={c.id} className="grid gap-3 sm:grid-cols-[1fr_1fr_100px_auto] items-end p-4" style={{ border: '1px solid hsl(var(--hero-gold) / 0.18)', borderRadius: '3px' }}>
                  <Field label="Name" value={c.name} onChange={(v) => update((d) => ({ ...d, certifications: d.certifications.map((x) => (x.id === c.id ? { ...x, name: v } : x)) }))} />
                  <Field label="Issuer" value={c.issuer} onChange={(v) => update((d) => ({ ...d, certifications: d.certifications.map((x) => (x.id === c.id ? { ...x, issuer: v } : x)) }))} />
                  <Field label="Year" value={c.year} max={40} onChange={(v) => update((d) => ({ ...d, certifications: d.certifications.map((x) => (x.id === c.id ? { ...x, year: v } : x)) }))} />
                  <SmallButton label="Remove certification" onClick={() => update((d) => ({ ...d, certifications: d.certifications.filter((x) => x.id !== c.id) }))}><Trash2 size={12} /></SmallButton>
                </div>
              ))}
            </Section>

            <Section title="Skills">
              <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); addSkill(); }}>
                <input value={skillDraft} onChange={(e) => setSkillDraft(e.target.value)} maxLength={L.skill} placeholder="e.g. Team leadership" aria-label="Add a skill"
                  className="font-barlow flex-1 min-w-0 outline-none"
                  style={{ fontSize: '15px', padding: '10px 12px', background: navy, color: white, border: line, borderRadius: '3px' }} />
                <button type="submit" className="gold-shimmer-bg font-barlow-condensed uppercase"
                  style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.2em', padding: '0 16px', borderRadius: '3px', color: navy }}>Add</button>
              </form>
              <div className="flex flex-wrap gap-2">
                {r.skills.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1.5 font-barlow" style={{ fontSize: '14px', padding: '5px 8px 5px 12px', border: '1px solid hsl(var(--hero-gold) / 0.4)', borderRadius: '999px', color: white }}>
                    {s}
                    <button type="button" aria-label={`Remove ${s}`} onClick={() => set('skills')(r.skills.filter((x) => x !== s))} style={{ color: faded }}><X size={13} /></button>
                  </span>
                ))}
              </div>
            </Section>
          </div>

          {/* ── Preview ── */}
          <div className={`min-w-0 ${view === 'edit' ? 'hidden lg:block' : ''}`}>
            <div className="lg:sticky lg:top-24">
              <p className="font-barlow-condensed uppercase mb-3" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.26em', color: gold }}>Live preview</p>
              <div className="overflow-x-auto" style={{ borderRadius: '3px', boxShadow: '0 20px 50px -25px rgba(0,0,0,0.8)' }}>
                <ResumePreview r={r} />
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
