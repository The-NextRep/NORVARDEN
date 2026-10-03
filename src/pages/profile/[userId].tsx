/**
 * /profile/:userId — Public member profile page
 *
 * Access tiers (enforced server-side, mirrored here for UX):
 *   self / admin       → full profile
 *   connected employer → full profile
 *   unconnected employer → locked overlay with "Request to connect" CTA
 *   unauthenticated    → restricted stub (name, badge, headline)
 *
 * Preview-as-company toggle: members can see exactly what an employer sees.
 *
 * Contact info (email, phone) and résumé download are only returned by the API
 * to self / admin / an employer whose connection the member accepted.
 */
import { useState, useEffect } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { Link, useParams, useNavigate } from 'react-router';
import {
  MapPin, Download, ExternalLink, Lock, Eye, EyeOff,
  Pencil, CheckCircle, Mail, Phone, MessageSquare,
} from 'lucide-react';
import { useCurrentUser } from '@/lib/auth/use-current-user';
import {
  JOB_TYPE_LABELS,
  type MemberProfile, type JobType,
} from '@/lib/profile-types';

// ── Design tokens ─────────────────────────────────────────────────────────────
const navy  = 'hsl(var(--hero-navy))';
const gold  = 'hsl(var(--hero-gold))';
const white = 'hsl(var(--hero-white))';
const ice60 = 'hsl(var(--hero-ice-60))';

// ── Types ─────────────────────────────────────────────────────────────────────
type ConnStatus = 'none' | 'pending' | 'accepted' | 'unavailable';

type ProfileView = MemberProfile & {
  contact?: { email: string | null; phone: string | null };
  canDownloadResume?: boolean;
};

// ── Chip display ──────────────────────────────────────────────────────────────
function Chip({ label, gold: isGold }: { label: string; gold?: boolean }) {
  return (
    <span
      className="font-barlow-condensed uppercase"
      style={{
        fontSize: '12px', fontWeight: 500, letterSpacing: '0.18em',
        padding: '5px 12px', borderRadius: '2px',
        border: isGold ? `1px solid ${gold}` : '1px solid hsl(var(--hero-gold) / 0.3)',
        background: isGold ? 'hsl(var(--hero-gold) / 0.1)' : 'transparent',
        color: isGold ? gold : ice60,
      }}
    >
      {label}
    </span>
  );
}

// ── Verified badge ────────────────────────────────────────────────────────────
function VerifiedBadge({ size = 16 }: { size?: number }) {
  return (
    <span
      title="Verified member"
      className="inline-flex items-center gap-1 font-barlow-condensed uppercase"
      style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.22em', color: gold }}
    >
      <CheckCircle size={size} style={{ color: gold }} />
      Verified
    </span>
  );
}


// ── Section heading ───────────────────────────────────────────────────────────
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 mb-4">
      <h2 className="font-barlow-condensed uppercase shrink-0"
        style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.32em', color: ice60 }}>
        {children}
      </h2>
      <div style={{ flex: 1, height: '1px', background: 'hsl(var(--hero-gold) / 0.15)' }} />
    </div>
  );
}

// ── Locked overlay (unconnected employer view) ────────────────────────────────
function LockedOverlay({ onRequest, requesting, requested, unavailable, canRequest, error }: {
  onRequest: () => void; requesting: boolean; requested: boolean; unavailable: boolean; canRequest: boolean;
  error?: { message: string; href?: string; cta?: string } | null;
}) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 pointer-events-none"
      style={{ background: 'hsl(var(--hero-navy) / 0.85)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
    >
      <div className="pointer-events-auto flex flex-col items-center">
        <Lock size={32} style={{ color: gold, marginBottom: '16px', opacity: 0.7 }} />
        <p className="font-bodoni mb-2" style={{ fontSize: '22px', fontWeight: 400, color: white, lineHeight: 1.1 }}>
          Full profile <em style={{ color: gold, fontStyle: 'italic' }}>locked.</em>
        </p>
        <p className="font-barlow mb-6 max-w-xs" style={{ fontSize: '14px', fontWeight: 300, color: ice60, lineHeight: 1.65 }}>
          Send a connection request to unlock this member's full profile, resume, and experience summary.
        </p>
        {unavailable ? (
          <span className="font-barlow-condensed uppercase" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em', color: ice60 }}>
            Not available
          </span>
        ) : requested ? (
          <span className="font-barlow-condensed uppercase" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em', color: ice60 }}>
            Request sent — awaiting response
          </span>
        ) : !canRequest ? null : (
          <button
            type="button"
            onClick={onRequest}
            disabled={requesting}
            className="font-barlow-condensed uppercase transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em', padding: '12px 28px', borderRadius: '2px', background: gold, color: navy, border: 'none', cursor: 'pointer' }}
          >
            {requesting ? 'Sending…' : 'Request to connect'}
          </button>
        )}
        {error && (
          <p className="font-barlow mt-4 max-w-xs" role="alert" style={{ fontSize: '13px', fontWeight: 300, color: 'hsl(var(--destructive))', lineHeight: 1.6 }}>
            {error.message}{' '}
            {error.href && (
              <Link to={error.href} style={{ color: gold, textDecoration: 'underline' }}>{error.cta}</Link>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Contact block (only rendered when the API returned contact info) ─────────
function ContactBlock({ profile, note }: { profile: ProfileView; note: string | null }) {
  const contact = profile.contact;
  const resumeHref = profile.canDownloadResume ? `/api/profile/${encodeURIComponent(profile.userId)}/resume` : null;
  if (!contact && !resumeHref) return null;
  const labelStyle = { fontSize: '11px', fontWeight: 500, letterSpacing: '0.28em', color: ice60 } as const;
  const valueStyle = { fontSize: '15px', fontWeight: 300, color: white } as const;

  return (
    <section>
      <SectionHeading>Contact</SectionHeading>
      <div
        className="p-5 rounded-sm"
        style={{ background: 'hsl(var(--hero-gold) / 0.05)', border: '1px solid hsl(var(--hero-gold) / 0.18)' }}
      >
        <div className="flex flex-wrap gap-x-10 gap-y-5">
          {contact?.email && (
            <div className="min-w-0">
              <p className="font-barlow-condensed uppercase mb-1" style={labelStyle}>Email</p>
              <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-2 font-barlow transition-opacity hover:opacity-80 break-all" style={valueStyle}>
                <Mail size={13} style={{ color: gold, flexShrink: 0 }} /> {contact.email}
              </a>
            </div>
          )}
          {contact?.phone && (
            <div>
              <p className="font-barlow-condensed uppercase mb-1" style={labelStyle}>Phone</p>
              <a href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`} className="inline-flex items-center gap-2 font-barlow transition-opacity hover:opacity-80" style={valueStyle}>
                <Phone size={13} style={{ color: gold, flexShrink: 0 }} /> {contact.phone}
              </a>
            </div>
          )}
          {resumeHref && (
            <div>
              <p className="font-barlow-condensed uppercase mb-1" style={labelStyle}>Resume</p>
              <a
                href={resumeHref}
                className="inline-flex items-center gap-2 font-barlow-condensed uppercase transition-opacity hover:opacity-80"
                style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em', padding: '10px 20px', borderRadius: '2px', border: `1px solid ${gold}`, color: gold, background: 'transparent' }}
              >
                <Download size={12} /> {profile.resumeFileName ?? 'Download resume'}
              </a>
            </div>
          )}
        </div>
        {note && (
          <p className="font-barlow mt-4" style={{ fontSize: '12px', fontWeight: 300, color: ice60, lineHeight: 1.5 }}>
            {note}
          </p>
        )}
      </div>
    </section>
  );
}

// ── Full profile body ─────────────────────────────────────────────────────────
function FullProfileBody({ profile, contactNote = null }: { profile: ProfileView; contactNote?: string | null }) {
  return (
    <div className="space-y-10">

      <ContactBlock profile={profile} note={contactNote} />

      {/* Open to */}
      {profile.openTo && profile.openTo.length > 0 && (
        <section>
          <SectionHeading>Open to</SectionHeading>
          <div className="flex flex-wrap gap-2">
            {(profile.openTo as JobType[]).map((type) => (
              <Chip key={type} label={JOB_TYPE_LABELS[type] ?? type} gold />
            ))}
          </div>
        </section>
      )}

      {/* Industries */}
      {profile.industriesOfInterest && profile.industriesOfInterest.length > 0 && (
        <section>
          <SectionHeading>Industries of interest</SectionHeading>
          <div className="flex flex-wrap gap-2">
            {profile.industriesOfInterest.map((ind) => (
              <Chip key={ind} label={ind} />
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {profile.skills && profile.skills.length > 0 && (
        <section>
          <SectionHeading>Skills</SectionHeading>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <Chip key={skill} label={skill} />
            ))}
          </div>
        </section>
      )}

      {/* Experience summary */}
      {profile.experienceSummary && (
        <section>
          <SectionHeading>Experience summary</SectionHeading>
          <p className="font-barlow" style={{ fontSize: '16px', fontWeight: 300, color: white, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
            {profile.experienceSummary}
          </p>
        </section>
      )}

      {/* LinkedIn */}
      {profile.linkedinUrl && (
        <section>
          <SectionHeading>LinkedIn</SectionHeading>
          <a
            href={profile.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-barlow transition-opacity hover:opacity-80"
            style={{ fontSize: '14px', fontWeight: 300, color: ice60 }}
          >
            {profile.linkedinUrl} <ExternalLink size={12} />
          </a>
        </section>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate   = useNavigate();
  const { user: currentUser, isPending: sessionPending } = useCurrentUser();

  const [profile, setProfile]           = useState<ProfileView | null>(null);
  const [loading, setLoading]           = useState(true);
  const [notFound, setNotFound]         = useState(false);
  const [connStatus, setConnStatus]     = useState<ConnStatus>('none');
  const [requesting, setRequesting]     = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [requestError, setRequestError] = useState<{ message: string; href?: string; cta?: string } | null>(null);
  // Preview-as-company toggle (only shown to self)
  const [previewMode, setPreviewMode]   = useState<'self' | 'company-connected' | 'company-locked'>('self');

  const isSelf = !sessionPending && currentUser?.id === userId;

  // Load profile
  useEffect(() => {
    if (!userId) return;
    void (async () => {
      try {
        const res = await fetch(`/api/profile/${userId}`, { credentials: 'include' });
        if (res.status === 404) { setNotFound(true); return; }
        if (res.ok) setProfile(await res.json() as ProfileView);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  // Load connection status (employers only)
  useEffect(() => {
    if (!userId || !currentUser || isSelf || currentUser.memberType !== 'employer') return;
    void (async () => {
      const res = await fetch(`/api/connections/status/${userId}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json() as { status?: string; conversationId?: number | null };
        setConversationId(data.conversationId ?? null);
        // Anything other than none/pending/accepted (e.g. a legacy 'declined') reads as "Not available".
        const s = data.status;
        setConnStatus(s === 'none' || s === 'pending' || s === 'accepted' ? s : 'unavailable');
      }
    })();
  }, [userId, currentUser, isSelf]);

  async function handleRequestConnect() {
    if (!userId) return;
    setRequesting(true);
    setRequestError(null);
    try {
      const res = await fetch('/api/connections/request', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: userId }),
      });
      if (res.ok) {
        setConnStatus('pending');
      } else if (res.status === 409) {
        const data = await res.json().catch(() => ({})) as { status?: string };
        setConnStatus(data.status === 'accepted' ? 'accepted' : 'pending');
      } else if (res.status === 429) {
        setConnStatus('unavailable');
      } else {
        const data = await res.json().catch(() => ({})) as { error?: string; message?: string };
        const message = data.message || data.error || 'Could not send the request. Please try again.';
        if (res.status === 402) setRequestError({ message, href: '/pricing', cta: 'See plans' });
        else if (res.status === 403) setRequestError({ message, href: '/company/account', cta: 'Check verification status' });
        else setRequestError({ message });
      }
    } catch {
      setRequestError({ message: 'Network error. Please try again.' });
    } finally { setRequesting(false); }
  }

  if (loading || sessionPending) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: navy }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'hsl(var(--hero-gold) / 0.25)', borderTopColor: gold }} />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: navy }}>
        <Helmet><title>Member not found — NORVARDEN</title></Helmet>
        <p className="font-bodoni mb-4" style={{ fontSize: '32px', fontWeight: 400, color: white }}>Member not <em style={{ color: gold, fontStyle: 'italic' }}>found.</em></p>
        <button type="button" onClick={() => navigate('/jobs')} className="font-barlow-condensed uppercase" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em', color: ice60, background: 'transparent', border: 'none', cursor: 'pointer' }}>Browse jobs</button>
      </main>
    );
  }

  const memberType = profile.memberType;
  const pathLabel  = memberType === 'employer' ? 'EMPLOYER' : 'JOB SEEKER';
  const displayName = profile.firstName && profile.lastName
    ? `${profile.firstName} ${profile.lastName}`
    : profile.firstName ?? profile.name ?? 'Member';
  const initial = displayName.charAt(0).toUpperCase();

  // Effective access comes from the server (it applies the connection + block rules)
  const isEmployer = currentUser?.memberType === 'employer';
  const effectiveAccess = profile.accessTier;

  // For preview mode (self only), override the rendered view
  const renderAccess = isSelf && previewMode !== 'self'
    ? (previewMode === 'company-connected' ? 'connected' : 'restricted')
    : effectiveAccess;

  const showFull = renderAccess === 'self' || renderAccess === 'admin' || renderAccess === 'connected';

  const title = `${displayName} — NORVARDEN`;

  return (
    <main className="min-h-screen pb-24" style={{ background: navy }}>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={`View ${displayName}'s verified member profile on NORVARDEN.`} />
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* Company preview banner */}
      {isSelf && previewMode !== 'self' && (
        <div
          className="sticky top-16 z-40 flex items-center justify-between px-6 py-3"
          style={{ background: 'hsl(var(--hero-gold) / 0.12)', borderBottom: `1px solid ${gold}` }}
        >
          <div className="flex items-center gap-3">
            <Eye size={14} style={{ color: gold }} />
            <span className="font-barlow-condensed uppercase" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em', color: gold }}>
              Company preview &mdash; {previewMode === 'company-connected' ? 'connected employer view' : 'unconnected employer view'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setPreviewMode(previewMode === 'company-connected' ? 'company-locked' : 'company-connected')}
              className="font-barlow-condensed uppercase transition-opacity hover:opacity-80"
              style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.22em', color: ice60, background: 'transparent', border: '1px solid hsl(var(--hero-gold) / 0.3)', padding: '5px 12px', borderRadius: '2px', cursor: 'pointer' }}>
              Switch to {previewMode === 'company-connected' ? 'unconnected' : 'connected'} view
            </button>
            <button type="button" onClick={() => setPreviewMode('self')}
              className="font-barlow-condensed uppercase transition-opacity hover:opacity-80"
              style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.22em', color: gold, background: 'transparent', border: `1px solid ${gold}`, padding: '5px 12px', borderRadius: '2px', cursor: 'pointer' }}>
              Exit preview
            </button>
          </div>
        </div>
      )}

      {/* ── Hero band ──────────────────────────────────────────────────────── */}
      <div
        className="px-6 md:px-12 lg:px-16 py-12 md:py-16"
        style={{ borderBottom: '1px solid hsl(var(--hero-gold) / 0.15)', background: 'hsl(var(--hero-navy-mid))' }}
      >
        <div className="max-w-4xl mx-auto flex items-start gap-8 flex-wrap md:flex-nowrap">

          {/* Avatar */}
          <div className="shrink-0">
            <div
              className="rounded-full overflow-hidden flex items-center justify-center font-bodoni"
              style={{ width: '96px', height: '96px', border: `2px solid ${gold}`, background: 'hsl(var(--hero-gold) / 0.1)', fontSize: '36px', fontWeight: 400, color: gold }}
            >
              {profile.photoUrl
                ? <img src={profile.photoUrl} alt={displayName} className="w-full h-full object-cover" />
                : initial
              }
            </div>
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <span className="font-barlow-condensed uppercase" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.32em', color: ice60 }}>{pathLabel}</span>
              {profile.verificationStatus === 'verified' && <VerifiedBadge />}
            </div>

            <h1 className="font-bodoni mb-2" style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 400, color: white, lineHeight: 1.05 }}>
              {displayName}
            </h1>

            {profile.headline && (
              <p className="font-barlow mb-3" style={{ fontSize: '16px', fontWeight: 300, color: ice60, lineHeight: 1.5 }}>
                {profile.headline}
              </p>
            )}

            {(profile.city || profile.state) && (
              <div className="flex items-center gap-1.5">
                <MapPin size={13} style={{ color: ice60 }} />
                <span className="font-barlow" style={{ fontSize: '13px', fontWeight: 300, color: ice60 }}>
                  {[profile.city, profile.state].filter(Boolean).join(', ')}
                </span>
              </div>
            )}

          </div>

          {/* Message (connected company) */}
          {!isSelf && isEmployer && effectiveAccess === 'connected' && conversationId && (
            <div className="flex flex-col gap-2 shrink-0">
              <button type="button" onClick={() => navigate(`/messages?conv=${conversationId}`)}
                className="inline-flex items-center gap-2 font-barlow-condensed uppercase transition-opacity hover:opacity-90"
                style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em', padding: '10px 18px', borderRadius: '2px', background: gold, color: navy, border: 'none', cursor: 'pointer' }}>
                <MessageSquare size={12} /> Message
              </button>
            </div>
          )}

          {/* Actions (self only) */}
          {isSelf && previewMode === 'self' && (
            <div className="flex flex-col gap-2 shrink-0">
              <button type="button" onClick={() => navigate('/profile/edit')}
                className="inline-flex items-center gap-2 font-barlow-condensed uppercase transition-opacity hover:opacity-80"
                style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em', padding: '10px 18px', borderRadius: '2px', border: `1px solid ${gold}`, color: gold, background: 'transparent', cursor: 'pointer' }}>
                <Pencil size={12} /> Edit profile
              </button>
              <button type="button" onClick={() => setPreviewMode('company-connected')}
                className="inline-flex items-center gap-2 font-barlow-condensed uppercase transition-opacity hover:opacity-80"
                style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em', padding: '10px 18px', borderRadius: '2px', border: '1px solid hsl(var(--hero-gold) / 0.3)', color: ice60, background: 'transparent', cursor: 'pointer' }}>
                <EyeOff size={12} /> Preview as company
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Profile body ───────────────────────────────────────────────────── */}
      <div className="px-6 md:px-12 lg:px-16 pt-10">
        <div className="max-w-4xl mx-auto">
          {showFull ? (
            <FullProfileBody
              profile={
                isSelf && previewMode === 'company-connected'
                  ? {
                      ...profile,
                      contact: profile.contact ?? { email: currentUser?.email ?? null, phone: null },
                      canDownloadResume: !!profile.resumeFileName,
                    }
                  : profile
              }
              contactNote={
                renderAccess === 'connected'
                  ? "Shared because you're connected."
                  : renderAccess === 'self'
                    ? 'Only shared with a company after you accept its connection request.'
                    : null
              }
            />
          ) : (
            /* Restricted / locked view */
            <div className="relative" style={{ minHeight: '320px' }}>
              {/* Blurred preview of what's behind */}
              <div style={{ filter: 'blur(6px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.4 }}>
                <FullProfileBody profile={{
                  ...profile,
                  contact: undefined,
                  canDownloadResume: false,
                  resumeFileName: null,
                  linkedinUrl: null,
                  openTo: ['full_time', 'contract'],
                  industriesOfInterest: ['Corporate Leadership', 'Sports Technology'],
                  skills: ['Leadership', 'Team building', 'Strategy'],
                  experienceSummary: 'Full profile available after connection is accepted.',
                }} />
              </div>
              {/* Lock overlay */}
              <LockedOverlay
                onRequest={() => { if (!isSelf) void handleRequestConnect(); }}
                requesting={requesting}
                requested={connStatus === 'pending'}
                unavailable={connStatus === 'unavailable'}
                canRequest={isEmployer || isSelf}
                error={requestError}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
