/**
 * /profile/edit — Member profile editor
 * Wrapped in AuthGuard — only accessible to logged-in members.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { Link, useNavigate } from 'react-router';
import { Upload, X, Plus, Eye, ChevronRight } from 'lucide-react';
import { AuthGuard } from '@/components/auth/RouteGuards';
import { useCurrentUser } from '@/lib/auth/use-current-user';
import {
  JOB_TYPE_LABELS, INDUSTRIES,
  type JobType, type MemberProfile,
} from '@/lib/profile-types';
import { profile_edit } from 'virtual:content';

// ── Design tokens ─────────────────────────────────────────────────────────────
const navy    = 'hsl(var(--hero-navy))';
const navyMid = 'hsl(var(--hero-navy-mid))';
const gold    = 'hsl(var(--hero-gold))';
const white   = 'hsl(var(--hero-white))';
const ice60   = 'hsl(var(--hero-ice-60))';

// ── Reusable field components ─────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <h2
        className="font-barlow-condensed uppercase shrink-0"
        style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.32em', color: ice60 }}
      >
        {children}
      </h2>
      <div style={{ flex: 1, height: '1px', background: 'hsl(var(--hero-gold) / 0.18)' }} />
    </div>
  );
}

function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block font-barlow-condensed uppercase mb-1.5"
      style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em', color: ice60 }}
    >
      {children}
    </label>
  );
}

function TextInput({
  id, value, onChange, placeholder, maxLength, type = 'text', autoComplete, describedBy,
}: {
  id?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; maxLength?: number; type?: 'text' | 'tel';
  autoComplete?: string; describedBy?: string;
}) {
  return (
    <input
      id={id}
      type={type}
      autoComplete={autoComplete}
      aria-describedby={describedBy}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className="w-full font-barlow"
      style={{
        background: navyMid,
        border: '1px solid hsl(var(--hero-gold) / 0.22)',
        borderRadius: '2px',
        padding: '10px 14px',
        fontSize: '15px',
        fontWeight: 300,
        color: white,
        outline: 'none',
      }}
      onFocus={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--hero-gold) / 0.6)'; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--hero-gold) / 0.22)'; }}
    />
  );
}

function TextArea({
  id, value, onChange, placeholder, rows = 4,
}: {
  id?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full font-barlow resize-none"
      style={{
        background: navyMid,
        border: '1px solid hsl(var(--hero-gold) / 0.22)',
        borderRadius: '2px',
        padding: '10px 14px',
        fontSize: '15px',
        fontWeight: 300,
        color: white,
        outline: 'none',
        lineHeight: 1.75,
      }}
      onFocus={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--hero-gold) / 0.6)'; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--hero-gold) / 0.22)'; }}
    />
  );
}

function ChipToggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-barlow-condensed uppercase transition-all"
      style={{
        fontSize: '12px', fontWeight: 500, letterSpacing: '0.22em',
        padding: '7px 14px', borderRadius: '2px',
        border: active ? `1px solid ${gold}` : '1px solid hsl(var(--hero-gold) / 0.25)',
        background: active ? 'hsl(var(--hero-gold) / 0.12)' : 'transparent',
        color: active ? gold : ice60, cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

function TagInput({ tags, onChange, placeholder }: { tags: string[]; onChange: (t: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState('');
  function addTag() {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed) && tags.length < 20) { onChange([...tags, trimmed]); setInput(''); }
  }
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1.5 font-barlow-condensed uppercase"
            style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.18em', padding: '5px 10px', borderRadius: '2px', border: `1px solid ${gold}`, background: 'hsl(var(--hero-gold) / 0.1)', color: gold }}>
            {tag}
            <button type="button" onClick={() => onChange(tags.filter((t) => t !== tag))} aria-label={`Remove ${tag}`} style={{ color: ice60, lineHeight: 1 }}><X size={10} /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
          placeholder={placeholder ?? 'Type and press Enter'} className="flex-1 font-barlow"
          style={{ background: navyMid, border: '1px solid hsl(var(--hero-gold) / 0.22)', borderRadius: '2px', padding: '8px 12px', fontSize: '14px', fontWeight: 300, color: white, outline: 'none' }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--hero-gold) / 0.6)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--hero-gold) / 0.22)'; }} />
        <button type="button" onClick={addTag} className="inline-flex items-center gap-1 font-barlow-condensed uppercase transition-opacity hover:opacity-80"
          style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.22em', padding: '8px 14px', borderRadius: '2px', border: '1px solid hsl(var(--hero-gold) / 0.4)', color: gold, background: 'transparent', cursor: 'pointer' }}>
          <Plus size={11} /> Add
        </button>
      </div>
    </div>
  );
}

function PhotoUpload({ currentUrl, onUpload }: { currentUrl: string | null; onUpload: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview]     = useState<string | null>(currentUrl);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setUploadError(null);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setUploadError('Please choose a JPEG, PNG or WebP image.'); return; }
    if (file.size > 5 * 1024 * 1024) { setUploadError('That image is larger than 5 MB.'); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onerror = () => { setUploadError('Could not read that file.'); setUploading(false); };
    reader.onload = async (e) => {
      try {
        const dataUrl = e.target?.result as string;
        const res = await fetch('/api/profile/me/photo', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dataUrl, mimeType: file.type }) });
        const data = await res.json().catch(() => ({})) as { photoUrl?: string; error?: string };
        if (res.ok && data.photoUrl) { setPreview(data.photoUrl); onUpload(data.photoUrl); }
        else setUploadError(data.error ?? 'Upload failed. Please try again.');
      } catch {
        setUploadError('Network error. Please try again.');
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex items-center gap-6">
      <div className="relative shrink-0" style={{ width: '88px', height: '88px' }}>
        <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center"
          style={{ border: '2px solid hsl(var(--hero-gold) / 0.5)', background: 'hsl(var(--hero-gold) / 0.08)' }}>
          {preview ? <img src={preview} alt="Profile photo" className="w-full h-full object-cover" /> : <Upload size={24} style={{ color: ice60 }} />}
        </div>
        {uploading && (
          <div className="absolute inset-0 rounded-full flex items-center justify-center pointer-events-none" style={{ background: 'hsl(var(--hero-navy) / 0.7)' }}>
            <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: 'hsl(var(--hero-gold) / 0.3)', borderTopColor: gold }} />
          </div>
        )}
      </div>
      <div>
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="font-barlow-condensed uppercase transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em', padding: '10px 20px', borderRadius: '2px', border: '1px solid hsl(var(--hero-gold) / 0.4)', color: gold, background: 'transparent', cursor: 'pointer' }}>
          {preview ? 'Change photo' : 'Upload photo'}
        </button>
        <p className="font-barlow mt-2" style={{ fontSize: '12px', fontWeight: 300, color: ice60 }}>Optional. JPEG, PNG or WebP, max 5 MB.</p>
        {uploadError && <p role="alert" className="font-barlow mt-1" style={{ fontSize: '12px', fontWeight: 300, color: 'hsl(var(--destructive))' }}>{uploadError}</p>}
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>
    </div>
  );
}

function ResumeUpload({ currentFileName, onUpload }: { currentFileName: string | null; onUpload: (fn: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName]   = useState<string | null>(currentFileName);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setUploadError(null);
    if (!/\.(pdf|docx?)$/i.test(file.name)) { setUploadError('Please choose a PDF, DOCX or DOC file.'); return; }
    if (file.size > 10 * 1024 * 1024) { setUploadError('That file is larger than 10 MB.'); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onerror = () => { setUploadError('Could not read that file.'); setUploading(false); };
    reader.onload = async (e) => {
      try {
        const dataUrl = e.target?.result as string;
        const res = await fetch('/api/profile/me/resume', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dataUrl, fileName: file.name }) });
        const data = await res.json().catch(() => ({})) as { resumeFileName?: string; error?: string };
        if (res.ok && data.resumeFileName) { setFileName(data.resumeFileName); onUpload(data.resumeFileName); }
        else setUploadError(data.error ?? 'Upload failed. Please try again.');
      } catch {
        setUploadError('Network error. Please try again.');
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
        className="font-barlow-condensed uppercase transition-opacity hover:opacity-80 disabled:opacity-40 inline-flex items-center gap-2"
        style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em', padding: '10px 20px', borderRadius: '2px', border: '1px solid hsl(var(--hero-gold) / 0.4)', color: gold, background: 'transparent', cursor: 'pointer' }}>
        <Upload size={12} />{fileName ? 'Replace resume' : 'Upload resume'}
      </button>
      {fileName && <span className="font-barlow" style={{ fontSize: '13px', fontWeight: 300, color: ice60 }}>{fileName}</span>}
      {uploading && <span className="font-barlow" style={{ fontSize: '13px', fontWeight: 300, color: ice60 }}>Uploading…</span>}
      <p className="w-full font-barlow" style={{ fontSize: '12px', fontWeight: 300, color: ice60 }}>PDF, DOCX or DOC, max 10 MB. Stored privately — only shared with a company after you accept its connection request.</p>
      {uploadError && <p role="alert" className="w-full font-barlow" style={{ fontSize: '12px', fontWeight: 300, color: 'hsl(var(--destructive))' }}>{uploadError}</p>}
      <input ref={inputRef} type="file" accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword" className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function ProfileEditInner() {
  const { user } = useCurrentUser();
  const navigate  = useNavigate();

  const [profile, setProfile]   = useState<MemberProfile | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const [firstName, setFirstName]                 = useState('');
  const [lastName, setLastName]                   = useState('');
  const [headline, setHeadline]                   = useState('');
  const [city, setCity]                           = useState('');
  const [stateVal, setStateVal]                   = useState('');
  const [linkedinUrl, setLinkedinUrl]             = useState('');
  const [phone, setPhone]                         = useState('');
  const [experienceSummary, setExperienceSummary] = useState('');
  const [openTo, setOpenTo]                       = useState<JobType[]>([]);
  const [industries, setIndustries]               = useState<string[]>([]);
  const [skills, setSkills]                       = useState<string[]>([]);
  const [resumeFileName, setResumeFileName]       = useState<string | null>(null);
  const [photoUrl, setPhotoUrl]                   = useState<string | null>(null);
  const [sport, setSport]                         = useState('');
  const [league, setLeague]                       = useState('');
  const [yearsActive, setYearsActive]             = useState('');
  const [coachingLevel, setCoachingLevel]         = useState('');
  const [coachingSport, setCoachingSport]         = useState('');
  const [yearsCoaching, setYearsCoaching]         = useState('');
  const [branch, setBranch]                       = useState('');
  const [mos, setMos]                             = useState('');
  const [yearsServed, setYearsServed]             = useState('');
  const [isSkillbridge, setIsSkillbridge]         = useState(false);
  const [showBranch, setShowBranch]               = useState(false);
  const [showYears, setShowYears]                 = useState(false);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      try {
        const res = await fetch(`/api/profile/${user.id}`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json() as MemberProfile & { contact?: { phone?: string | null } };
          setProfile(data);
          setFirstName(data.firstName ?? '');
          setLastName(data.lastName ?? '');
          setHeadline(data.headline ?? '');
          setCity(data.city ?? '');
          setStateVal(data.state ?? '');
          setLinkedinUrl(data.linkedinUrl ?? '');
          setPhone(data.contact?.phone ?? '');
          setExperienceSummary(data.experienceSummary ?? '');
          setOpenTo((data.openTo as JobType[]) ?? []);
          setIndustries(data.industriesOfInterest ?? []);
          setSkills(data.skills ?? []);
          setResumeFileName(data.resumeFileName ?? null);
          setPhotoUrl(data.photoUrl ?? null);
          setSport(data.sport ?? '');
          setLeague(data.league ?? '');
          setYearsActive(data.yearsActive ?? '');
          setCoachingLevel(data.coachingLevel ?? '');
          setCoachingSport(data.coachingSport ?? '');
          setYearsCoaching(data.yearsCoaching ?? '');
          setBranch(data.branch ?? '');
          setMos(data.mos ?? '');
          setYearsServed(data.yearsServed ?? '');
          setIsSkillbridge(data.isSkillbridgeEligible ?? false);
          setShowBranch(data.veteranShowBranch ?? false);
          setShowYears(data.veteranShowYears ?? false);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const toggleOpenTo = useCallback((type: JobType) => {
    setOpenTo((prev) => prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]);
  }, []);

  const toggleIndustry = useCallback((ind: string) => {
    setIndustries((prev) => prev.includes(ind) ? prev.filter((i) => i !== ind) : [...prev, ind]);
  }, []);

  // ── Message notification preference ──────────────────────────────────────
  const [msgEmailEnabled, setMsgEmailEnabled] = useState(true);
  const [savingNotif, setSavingNotif] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);

  useEffect(() => {
    void fetch('/api/settings/message-notifications', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : { emailEnabled: true })
      .then((d: { emailEnabled?: boolean }) => setMsgEmailEnabled(d.emailEnabled ?? true))
      .catch(() => {});
  }, []);

  async function saveNotifPref(enabled: boolean) {
    setSavingNotif(true);
    try {
      await fetch('/api/settings/message-notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ emailEnabled: enabled }),
      });
      setNotifSaved(true);
      setTimeout(() => setNotifSaved(false), 2000);
    } finally {
      setSavingNotif(false);
    }
  }

  async function handleSave() {
    setError(null);
    const phoneTrimmed = phone.trim();
    if (phoneTrimmed && (phoneTrimmed.length > 30 || !/^[0-9 +\-()]+$/.test(phoneTrimmed) || !/[0-9]/.test(phoneTrimmed))) {
      setError('Phone can only contain digits, spaces, and + - ( ), up to 30 characters.');
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        firstName, lastName, headline, city, state: stateVal, linkedinUrl,
        phone: phoneTrimmed || null,
        experienceSummary, openTo, industriesOfInterest: industries, skills,
      };
      if (profile?.memberType === 'athlete') Object.assign(body, { sport, league, yearsActive });
      else if (profile?.memberType === 'coach') Object.assign(body, { coachingLevel, coachingSport, yearsCoaching });
      else if (profile?.memberType === 'veteran') Object.assign(body, { branch, mos, yearsServed, isSkillbridgeEligible: isSkillbridge, veteranShowBranch: showBranch, veteranShowYears: showYears });

      const res = await fetch('/api/profile/me', { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error ?? 'Save failed.');
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch { setError('Network error. Please try again.'); }
    finally { setSaving(false); }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: navy }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'hsl(var(--hero-gold) / 0.25)', borderTopColor: gold }} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: navy }}>
        <p className="font-barlow" style={{ color: ice60 }}>
          Profile not found. <Link to="/signup" style={{ color: gold, textDecoration: 'underline' }}>Finish sign-up</Link>
        </p>
      </div>
    );
  }

  const memberType = profile.memberType;
  const pathLabel  = memberType === 'employer' ? 'EMPLOYER' : 'JOB SEEKER';

  return (
    <main className="min-h-screen pb-24" style={{ background: navy }}>
      <Helmet>
        <title>Edit Profile — NORVARDEN</title>
        <meta name="description" content="Edit your member profile on NORVARDEN — update your headline, skills, experience, and job preferences." />
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* Page header */}
      <div className="px-6 md:px-12 lg:px-16 py-10" style={{ borderBottom: '1px solid hsl(var(--hero-gold) / 0.15)' }}>
        <div className="max-w-3xl mx-auto flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="font-barlow-condensed uppercase mb-2" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.32em', color: ice60 }}>{pathLabel} PROFILE</p>
            <h1 className="font-bodoni" style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 400, color: white, lineHeight: 1.05 }}>
              Edit your <em style={{ color: gold, fontStyle: 'italic' }}>profile.</em>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate(`/profile/${user?.id ?? ''}`)}
              className="inline-flex items-center gap-2 font-barlow-condensed uppercase transition-opacity hover:opacity-80"
              style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em', padding: '10px 18px', borderRadius: '2px', border: '1px solid hsl(var(--hero-gold) / 0.3)', color: ice60, background: 'transparent', cursor: 'pointer' }}>
              <Eye size={12} /> Preview
            </button>
            <button type="button" onClick={() => void handleSave()} disabled={saving}
              className="inline-flex items-center gap-2 font-barlow-condensed uppercase transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em', padding: '10px 24px', borderRadius: '2px', background: saved ? 'hsl(var(--hero-gold) / 0.9)' : gold, color: navy, cursor: 'pointer', border: 'none' }}>
              {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save profile'}
            </button>
          </div>
        </div>
        {error && <div className="max-w-3xl mx-auto mt-4"><p className="font-barlow" style={{ fontSize: '14px', fontWeight: 300, color: 'hsl(var(--destructive))' }}>{error}</p></div>}
      </div>

      {/* Form */}
      <div className="px-6 md:px-12 lg:px-16 pt-10">
        <div className="max-w-3xl mx-auto space-y-12">

          <section>
            <SectionHeading>Profile photo</SectionHeading>
            <PhotoUpload currentUrl={photoUrl} onUpload={(url) => setPhotoUrl(url)} />
          </section>

          <section>
            <SectionHeading>Basic info</SectionHeading>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div><FieldLabel htmlFor="firstName">First name</FieldLabel><TextInput id="firstName" value={firstName} onChange={setFirstName} placeholder="First name" maxLength={100} /></div>
              <div><FieldLabel htmlFor="lastName">Last name</FieldLabel><TextInput id="lastName" value={lastName} onChange={setLastName} placeholder="Last name" maxLength={100} /></div>
              <div className="md:col-span-2"><FieldLabel htmlFor="headline">Headline</FieldLabel><TextInput id="headline" value={headline} onChange={setHeadline} placeholder="e.g. Former NFL linebacker | Leadership & operations" maxLength={255} /></div>
              <div><FieldLabel htmlFor="city">City</FieldLabel><TextInput id="city" value={city} onChange={setCity} placeholder="City" maxLength={100} /></div>
              <div><FieldLabel htmlFor="stateVal">State</FieldLabel><TextInput id="stateVal" value={stateVal} onChange={setStateVal} placeholder="State" maxLength={100} /></div>
              <div className="md:col-span-2"><FieldLabel htmlFor="linkedin">LinkedIn URL</FieldLabel><TextInput id="linkedin" value={linkedinUrl} onChange={setLinkedinUrl} placeholder="https://linkedin.com/in/yourname" maxLength={512} /></div>
              <div className="md:col-span-2">
                <FieldLabel htmlFor="phone">Phone (optional)</FieldLabel>
                <TextInput id="phone" type="tel" autoComplete="tel" describedBy="phone-help" value={phone} onChange={setPhone} placeholder="e.g. +1 (555) 123-4567" maxLength={30} />
                <p id="phone-help" className="font-barlow mt-1.5" style={{ fontSize: '12px', fontWeight: 300, color: ice60, lineHeight: 1.5 }}>
                  Only shared with a company after you accept its connection request.
                </p>
              </div>
            </div>
          </section>

          <section>
            <SectionHeading>Open to</SectionHeading>
            <p className="font-barlow mb-4" style={{ fontSize: '14px', fontWeight: 300, color: ice60, lineHeight: 1.65 }}>What types of opportunities are you looking for?</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(JOB_TYPE_LABELS) as JobType[]).filter((t) => t !== 'skillbridge').map((type) => (
                <ChipToggle key={type} label={JOB_TYPE_LABELS[type]} active={openTo.includes(type)} onClick={() => toggleOpenTo(type)} />
              ))}
            </div>
          </section>

          <section>
            <SectionHeading>Industries of interest</SectionHeading>
            <p className="font-barlow mb-4" style={{ fontSize: '14px', fontWeight: 300, color: ice60, lineHeight: 1.65 }}>Select all that apply.</p>
            <div className="flex flex-wrap gap-2">
              {INDUSTRIES.map((ind) => (
                <ChipToggle key={ind} label={ind} active={industries.includes(ind)} onClick={() => toggleIndustry(ind)} />
              ))}
            </div>
          </section>

          <section>
            <SectionHeading>Skills</SectionHeading>
            <p className="font-barlow mb-4" style={{ fontSize: '14px', fontWeight: 300, color: ice60, lineHeight: 1.65 }}>Add up to 20 skills. Press Enter or click Add after each one.</p>
            <TagInput tags={skills} onChange={setSkills} placeholder="e.g. Leadership, Sales, Project management" />
          </section>

          <section>
            <SectionHeading>Experience summary</SectionHeading>
            <FieldLabel htmlFor="summary">Tell employers about your background and what you bring to the table.</FieldLabel>
            <TextArea id="summary" value={experienceSummary} onChange={setExperienceSummary} placeholder="Describe your career, achievements, and what you’re looking for next…" rows={6} />
          </section>

          <section>
            <SectionHeading>Resume</SectionHeading>
            <ResumeUpload currentFileName={resumeFileName} onUpload={(fn) => setResumeFileName(fn)} />
          </section>

          {/* Notification settings */}
          <section>
            <SectionHeading>{profile_edit.notificationsSection}</SectionHeading>
            <div
              className="flex items-center justify-between gap-4 p-4"
              style={{ background: 'hsl(var(--hero-gold) / 0.04)', border: '1px solid hsl(var(--hero-gold) / 0.15)', borderRadius: '3px' }}
            >
              <div>
                <p className="font-barlow-condensed uppercase mb-0.5" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.22em', color: white }}>
                  {profile_edit.newMessageEmailLabel}
                </p>
                <p className="font-barlow" style={{ fontSize: '13px', fontWeight: 300, color: ice60, lineHeight: 1.5 }}>
                  {profile_edit.newMessageEmailDesc}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !msgEmailEnabled;
                  setMsgEmailEnabled(next);
                  void saveNotifPref(next);
                }}
                disabled={savingNotif}
                className="shrink-0 transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{
                  width: '44px', height: '24px', borderRadius: '12px',
                  background: msgEmailEnabled ? gold : 'hsl(var(--hero-gold) / 0.2)',
                  border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                }}
                aria-label={msgEmailEnabled ? 'Disable message email notifications' : 'Enable message email notifications'}
                aria-pressed={msgEmailEnabled}
              >
                <span
                  style={{
                    position: 'absolute', top: '3px',
                    left: msgEmailEnabled ? '23px' : '3px',
                    width: '18px', height: '18px', borderRadius: '50%',
                    background: msgEmailEnabled ? navy : ice60,
                    transition: 'left 0.2s',
                  }}
                />
              </button>
            </div>
            {notifSaved && (
              <p className="font-barlow mt-2" style={{ fontSize: '12px', fontWeight: 300, color: gold }}>{profile_edit.notifSavedMsg}</p>
            )}
          </section>

          <div className="flex items-center justify-between pt-6" style={{ borderTop: '1px solid hsl(var(--hero-gold) / 0.15)' }}>
            <button type="button" onClick={() => navigate(`/profile/${user?.id ?? ''}`)}
              className="inline-flex items-center gap-2 font-barlow-condensed uppercase transition-opacity hover:opacity-80"
              style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em', color: ice60, background: 'transparent', border: 'none', cursor: 'pointer' }}>
              View profile <ChevronRight size={12} />
            </button>
            <button type="button" onClick={() => void handleSave()} disabled={saving}
              className="inline-flex items-center gap-2 font-barlow-condensed uppercase transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em', padding: '12px 32px', borderRadius: '2px', background: saved ? 'hsl(var(--hero-gold) / 0.9)' : gold, color: navy, cursor: 'pointer', border: 'none' }}>
              {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save profile'}
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}

export default function ProfileEditPage() {
  return <AuthGuard><ProfileEditInner /></AuthGuard>;
}
