/**
 * /settings — Account settings for signed-in users.
 *   - Account email (read-only)
 *   - "Email me when I get a new message" toggle (GET/PUT /api/settings/message-notifications)
 *   - Change password → emails a reset link via POST /api/auth/forgot-password
 */
import { useEffect, useState } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { Link } from 'react-router';
import { ChevronLeft, KeyRound, Mail } from 'lucide-react';
import { AuthGuard } from '@/components/auth/RouteGuards';
import { useCurrentUser } from '@/lib/auth/use-current-user';

// ── Design tokens ─────────────────────────────────────────────────────────────
const navy    = 'hsl(var(--hero-navy))';
const navyMid = 'hsl(var(--hero-navy-mid))';
const gold    = 'hsl(var(--hero-gold))';
const white   = 'hsl(var(--hero-white))';
const ice60   = 'hsl(var(--hero-ice-60))';

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

const cardStyle: React.CSSProperties = {
  background: navyMid,
  border: '1px solid hsl(var(--hero-gold) / 0.18)',
  borderRadius: '3px',
  padding: '20px 24px',
};

function SettingsInner() {
  const { user } = useCurrentUser();
  const email = user?.email ?? '';
  const dashboardHref = user?.memberType === 'employer' ? '/company/dashboard' : '/dashboard';

  // ── Message notifications ────────────────────────────────────────────────
  const [msgEmailEnabled, setMsgEmailEnabled] = useState<boolean | null>(null);
  const [eventEmailEnabled, setEventEmailEnabled] = useState<boolean | null>(null);
  const [savingNotif, setSavingNotif] = useState(false);
  const [notifMsg, setNotifMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/settings/message-notifications', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { emailEnabled: true, eventEmailsEnabled: true }))
      .then((d: { emailEnabled?: boolean; eventEmailsEnabled?: boolean }) => {
        if (cancelled) return;
        setMsgEmailEnabled(d.emailEnabled ?? true);
        setEventEmailEnabled(d.eventEmailsEnabled ?? true);
      })
      .catch(() => { if (!cancelled) { setMsgEmailEnabled(true); setEventEmailEnabled(true); } });
    return () => { cancelled = true; };
  }, []);

  async function toggleNotif(kind: 'emailEnabled' | 'eventEmailsEnabled') {
    const current = kind === 'emailEnabled' ? msgEmailEnabled : eventEmailEnabled;
    const setter = kind === 'emailEnabled' ? setMsgEmailEnabled : setEventEmailEnabled;
    if (current === null) return;
    const next = !current;
    setter(next);
    setSavingNotif(true);
    setNotifMsg(null);
    try {
      const res = await fetch('/api/settings/message-notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ [kind]: next }),
      });
      if (!res.ok) throw new Error('save failed');
      setNotifMsg({ ok: true, text: 'Notification preference saved.' });
    } catch {
      setter(!next);
      setNotifMsg({ ok: false, text: 'Could not save. Please try again.' });
    } finally {
      setSavingNotif(false);
    }
  }

  // ── Change password ──────────────────────────────────────────────────────
  const [pwState, setPwState] = useState<'idle' | 'sending' | 'sent'>('idle');

  async function sendPasswordLink() {
    if (!email) return;
    setPwState('sending');
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });
    } catch {
      // The endpoint never reveals anything; show the same confirmation.
    }
    setPwState('sent');
  }

  const labelStyle = { fontSize: '11px', fontWeight: 500, letterSpacing: '0.22em', color: white } as const;
  const descStyle  = { fontSize: '13px', fontWeight: 300, color: ice60, lineHeight: 1.5 } as const;

  return (
    <main className="min-h-screen pb-24" style={{ background: navy }}>
      <Helmet>
        <title>Settings — NORVARDEN</title>
        <meta name="description" content="Manage your account email, message notifications, and password on NORVARDEN." />
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div
        className="px-6 md:px-12 lg:px-16 py-10"
        style={{ borderBottom: '1px solid hsl(var(--hero-gold) / 0.15)', background: navyMid }}
      >
        <div className="max-w-3xl mx-auto">
          <Link
            to={dashboardHref}
            className="inline-flex items-center gap-1 font-barlow-condensed uppercase mb-4 transition-opacity hover:opacity-80"
            style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em', color: ice60, textDecoration: 'none' }}
          >
            <ChevronLeft size={12} /> Dashboard
          </Link>
          <p className="font-barlow-condensed uppercase mb-2" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.32em', color: ice60 }}>
            Account
          </p>
          <h1 className="font-bodoni" style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 400, color: white, lineHeight: 1.05 }}>
            Your <em style={{ color: gold, fontStyle: 'italic' }}>settings.</em>
          </h1>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="px-6 md:px-12 lg:px-16 pt-10">
        <div className="max-w-3xl mx-auto space-y-10">

          {/* Account email */}
          <section>
            <SectionHeading>Account</SectionHeading>
            <div style={cardStyle}>
              <label htmlFor="account-email" className="block font-barlow-condensed uppercase mb-1.5" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em', color: ice60 }}>
                Email address
              </label>
              <div className="flex items-center gap-3">
                <Mail size={14} style={{ color: gold, flexShrink: 0 }} aria-hidden="true" />
                <input
                  id="account-email"
                  type="email"
                  value={email}
                  readOnly
                  aria-readonly="true"
                  className="w-full font-barlow"
                  style={{
                    background: 'transparent', border: '1px solid hsl(var(--hero-gold) / 0.15)', borderRadius: '2px',
                    padding: '10px 14px', fontSize: '15px', fontWeight: 300, color: white, outline: 'none', cursor: 'default',
                  }}
                />
              </div>
              <p className="font-barlow mt-2" style={{ fontSize: '12px', fontWeight: 300, color: ice60, lineHeight: 1.5 }}>
                This is the email you sign in with. It&apos;s never shown to a company unless you accept its connection request.
              </p>
            </div>
          </section>

          {/* Notifications */}
          <section>
            <SectionHeading>Notifications</SectionHeading>
            <div className="flex items-center justify-between gap-4" style={cardStyle}>
              <div>
                <p id="notif-label" className="font-barlow-condensed uppercase mb-0.5" style={labelStyle}>
                  Email me when I get a new message
                </p>
                <p className="font-barlow" style={descStyle}>
                  We&apos;ll send a short email when a connected company or member messages you.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={msgEmailEnabled ?? false}
                aria-labelledby="notif-label"
                onClick={() => void toggleNotif('emailEnabled')}
                disabled={savingNotif || msgEmailEnabled === null}
                className="shrink-0 transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{
                  width: '44px', height: '24px', borderRadius: '12px',
                  background: msgEmailEnabled ? gold : 'hsl(var(--hero-gold) / 0.2)',
                  border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                }}
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
            <div className="flex items-center justify-between gap-4 mt-3" style={cardStyle}>
              <div>
                <p id="event-notif-label" className="font-barlow-condensed uppercase mb-0.5" style={labelStyle}>
                  Email me about featured events
                </p>
                <p className="font-barlow" style={descStyle}>
                  Occasional announcements of hiring events and workshops on NORVARDEN.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={eventEmailEnabled ?? false}
                aria-labelledby="event-notif-label"
                onClick={() => void toggleNotif('eventEmailsEnabled')}
                disabled={savingNotif || eventEmailEnabled === null}
                className="shrink-0 transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{
                  width: '44px', height: '24px', borderRadius: '12px',
                  background: eventEmailEnabled ? gold : 'hsl(var(--hero-gold) / 0.2)',
                  border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                }}
              >
                <span
                  style={{
                    position: 'absolute', top: '3px',
                    left: eventEmailEnabled ? '23px' : '3px',
                    width: '18px', height: '18px', borderRadius: '50%',
                    background: eventEmailEnabled ? navy : ice60,
                    transition: 'left 0.2s',
                  }}
                />
              </button>
            </div>
            {notifMsg && (
              <p role="status" className="font-barlow mt-2" style={{ fontSize: '12px', fontWeight: 300, color: notifMsg.ok ? gold : 'hsl(var(--destructive))' }}>
                {notifMsg.text}
              </p>
            )}
          </section>

          {/* Password */}
          <section>
            <SectionHeading>Password</SectionHeading>
            <div className="flex items-center justify-between gap-4 flex-wrap" style={cardStyle}>
              <div className="min-w-0">
                <p className="font-barlow-condensed uppercase mb-0.5" style={labelStyle}>Change password</p>
                <p className="font-barlow" style={descStyle}>
                  We&apos;ll email a secure link to {email ? <span style={{ color: white }}>{email}</span> : 'your account email'} so you can set a new password.
                </p>
              </div>
              {pwState !== 'sent' && (
                <button
                  type="button"
                  onClick={() => void sendPasswordLink()}
                  disabled={pwState === 'sending' || !email}
                  className="inline-flex items-center gap-2 font-barlow-condensed uppercase transition-opacity hover:opacity-90 disabled:opacity-50 shrink-0"
                  style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em', padding: '10px 20px', borderRadius: '2px', border: `1px solid ${gold}`, color: gold, background: 'transparent', cursor: 'pointer' }}
                >
                  <KeyRound size={12} /> {pwState === 'sending' ? 'Sending…' : 'Change password'}
                </button>
              )}
            </div>
            {pwState === 'sent' && (
              <p role="status" className="font-barlow mt-2" style={{ fontSize: '13px', fontWeight: 300, color: gold }}>
                We&apos;ve emailed you a link to set a new password.
              </p>
            )}
          </section>

        </div>
      </div>
    </main>
  );
}

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsInner />
    </AuthGuard>
  );
}
