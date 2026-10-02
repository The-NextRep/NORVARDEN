/**
 * /admin/messages — Admin-only view of reported conversations.
 * Shows only conversations that have been reported.
 * Admins can view the full thread and dismiss reports.
 */
import { useEffect, useState, useCallback } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { Link } from 'react-router';
import { AlertTriangle, ChevronLeft, Check } from 'lucide-react';
import { AdminGuard } from '@/components/auth/RouteGuards';
import { admin_messages } from 'virtual:content';
import AdminNav from '@/components/admin/AdminNav';

const navy    = 'hsl(var(--hero-navy))';
const navyMid = 'hsl(var(--hero-navy-mid, 218 52% 13%))';
const gold    = 'hsl(var(--hero-gold))';
const white   = 'hsl(var(--hero-white))';
const ice60   = 'hsl(var(--hero-ice-60))';

interface ReportedConv {
  id: number;
  connectionId: number;
  companyUserId: string;
  memberUserId: string;
  reportedAt: string | null;
  reportedBy: string | null;
  reportReason: string | null;
  reportStatus: string | null;
  blockedAt: string | null;
}

interface Message {
  id: number;
  senderId: string;
  body: string;
  createdAt: string;
}

interface ConvDetail {
  conversation: {
    id: number;
    companyUserId: string;
    memberUserId: string;
    iAmCompany: boolean;
    blockedAt: string | null;
    reportedAt: string | null;
    reportStatus: string | null;
  };
  messages: Message[];
}

function formatTime(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function ThreadView({ convId, companyUserId, memberUserId, onDismiss }: {
  convId: number;
  companyUserId: string;
  memberUserId: string;
  onDismiss: () => void;
}) {
  const [detail, setDetail] = useState<ConvDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    void fetch(`/api/messages/${convId}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d: ConvDetail) => setDetail(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [convId]);

  async function handleDismiss() {
    setDismissing(true);
    try {
      await fetch(`/api/admin/reported-conversations/${convId}/dismiss`, {
        method: 'POST',
        credentials: 'include',
      });
      onDismiss();
    } finally {
      setDismissing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'hsl(var(--hero-gold) / 0.2)', borderTopColor: gold }} />
      </div>
    );
  }

  const msgs = detail?.messages ?? [];

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className="font-barlow-condensed uppercase" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.28em', color: ice60 }}>
          Company: {companyUserId.slice(0, 8)}…
        </span>
        <span style={{ color: 'hsl(var(--hero-gold) / 0.3)' }}>·</span>
        <span className="font-barlow-condensed uppercase" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.28em', color: ice60 }}>
          Member: {memberUserId.slice(0, 8)}…
        </span>
      </div>

      <div
        className="mb-4 max-h-96 overflow-y-auto p-4 flex flex-col gap-3"
        style={{ background: 'hsl(var(--hero-navy) / 0.5)', border: '1px solid hsl(var(--hero-gold) / 0.15)', borderRadius: '3px' }}
      >
        {msgs.length === 0 ? (
          <p className="font-barlow text-center" style={{ fontSize: '14px', fontWeight: 300, color: ice60 }}>No messages.</p>
        ) : msgs.map((msg) => {
          const isCompany = msg.senderId === companyUserId;
          return (
            <div key={msg.id} className={`flex ${isCompany ? 'justify-end' : 'justify-start'}`}>
              <div
                style={{
                  maxWidth: '72%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: isCompany ? 'hsl(var(--hero-gold) / 0.15)' : navyMid,
                  border: '1px solid hsl(var(--hero-gold) / 0.2)',
                }}
              >
                <p className="font-barlow-condensed uppercase mb-1" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.2em', color: gold }}>
                  {isCompany ? admin_messages.companyLabel : admin_messages.memberLabel}
                </p>
                <p className="font-barlow" style={{ fontSize: '13px', fontWeight: 300, color: white, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {msg.body}
                </p>
                <p className="font-barlow mt-1" style={{ fontSize: '12px', fontWeight: 300, color: ice60 }}>
                  {formatTime(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {detail?.conversation.reportStatus !== 'dismissed' && (
        <button
          onClick={() => { void handleDismiss(); }}
          disabled={dismissing}
          className="inline-flex items-center gap-2 font-barlow-condensed uppercase transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em', padding: '10px 20px', borderRadius: '2px', background: 'hsl(var(--hero-gold) / 0.15)', color: gold, border: '1px solid hsl(var(--hero-gold) / 0.4)', cursor: 'pointer' }}
        >
          <Check size={12} />
          {admin_messages.dismissLabel}
        </button>
      )}
      {detail?.conversation.reportStatus === 'dismissed' && (
        <span className="font-barlow-condensed uppercase" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em', color: ice60 }}>
          {admin_messages.dismissedLabel}
        </span>
      )}
    </div>
  );
}

function AdminMessagesInner() {
  const [convs, setConvs]         = useState<ReportedConv[]>([]);
  const [loading, setLoading]     = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchReported = useCallback(() => {
    setLoading(true);
    void fetch('/api/admin/reported-conversations', { credentials: 'include' })
      .then((r) => r.json())
      .then((d: { conversations?: ReportedConv[] }) => setConvs(d.conversations ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchReported(); }, [fetchReported]);

  return (
    <main className="min-h-screen pb-24" style={{ background: navy }}>
      <Helmet>
        <title>Reported Conversations — Admin — NORVARDEN</title>
        <meta name="description" content="Admin review queue for reported conversations on NORVARDEN." />
        <meta name="robots" content="noindex" />
      </Helmet>

      <AdminNav />

      <div className="px-6 md:px-12 lg:px-16 py-10" style={{ borderBottom: '1px solid hsl(var(--hero-gold) / 0.15)', background: navyMid }}>
        <div className="max-w-4xl mx-auto">
          <Link to="/admin" className="inline-flex items-center gap-1.5 font-barlow-condensed uppercase mb-4 transition-opacity hover:opacity-70" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.28em', color: ice60, textDecoration: 'none' }}>
            <ChevronLeft size={12} /> Overview
          </Link>
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} style={{ color: gold }} />
            <h1 className="font-bodoni" style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 400, color: white, lineHeight: 1.05 }}>
              {admin_messages.pageTitle}
            </h1>
          </div>
          <p className="font-barlow mt-2" style={{ fontSize: '14px', fontWeight: 300, color: ice60 }}>
            {admin_messages.pageSubtitle}
          </p>
        </div>
      </div>

      <div className="px-6 md:px-12 lg:px-16 pt-8">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'hsl(var(--hero-gold) / 0.2)', borderTopColor: gold }} />
            </div>
          ) : convs.length === 0 ? (
            <div className="flex flex-col items-center text-center py-16 gap-3">
              <Check size={32} style={{ color: 'hsl(var(--hero-gold) / 0.3)' }} />
              <p className="font-bodoni" style={{ fontSize: '22px', fontWeight: 400, color: white }}>{admin_messages.emptyHeading}</p>
              <p className="font-barlow" style={{ fontSize: '14px', fontWeight: 300, color: ice60 }}>{admin_messages.emptyBody}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {convs.map((conv) => (
                <div
                  key={conv.id}
                  style={{ background: navyMid, border: '1px solid hsl(var(--hero-gold) / 0.2)', borderRadius: '3px', overflow: 'hidden' }}
                >
                  <button
                    onClick={() => setExpandedId(expandedId === conv.id ? null : conv.id)}
                    className="w-full flex items-start gap-4 p-5 text-left transition-colors hover:bg-white/5"
                  >
                    <AlertTriangle size={16} style={{ color: gold, flexShrink: 0, marginTop: '2px' }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-1">
                        <span className="font-barlow-condensed uppercase" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.22em', color: white }}>
                          Conversation #{conv.id}
                        </span>
                        <span
                          className="font-barlow-condensed uppercase"
                          style={{
                            fontSize: '11px', fontWeight: 500, letterSpacing: '0.2em',
                            padding: '2px 7px', borderRadius: '2px',
                            background: conv.reportStatus === 'dismissed' ? 'hsl(var(--hero-gold) / 0.1)' : 'hsl(var(--destructive) / 0.15)',
                            color: conv.reportStatus === 'dismissed' ? ice60 : 'hsl(var(--destructive))',
                          }}
                        >
                          {conv.reportStatus ?? 'pending'}
                        </span>
                        {conv.blockedAt && (
                          <span className="font-barlow-condensed uppercase" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.2em', padding: '2px 7px', borderRadius: '2px', background: 'hsl(var(--destructive) / 0.1)', color: 'hsl(var(--destructive))' }}>
                            Blocked
                          </span>
                        )}
                      </div>
                      {conv.reportReason && (
                        <p className="font-barlow" style={{ fontSize: '13px', fontWeight: 300, color: ice60, lineHeight: 1.5 }}>
                          "{conv.reportReason}"
                        </p>
                      )}
                      <p className="font-barlow mt-1" style={{ fontSize: '11px', fontWeight: 300, color: 'hsl(214 60% 93% / 0.3)' }}>
                        Reported {conv.reportedAt ? new Date(conv.reportedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                      </p>
                    </div>
                  </button>

                  {expandedId === conv.id && (
                    <div className="px-5 pb-5 pt-0" style={{ borderTop: '1px solid hsl(var(--hero-gold) / 0.12)' }}>
                      <div className="pt-4">
                        <ThreadView
                          convId={conv.id}
                          companyUserId={conv.companyUserId}
                          memberUserId={conv.memberUserId}
                          onDismiss={fetchReported}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function AdminMessagesPage() {
  return (
    <AdminGuard>
      <AdminMessagesInner />
    </AdminGuard>
  );
}
