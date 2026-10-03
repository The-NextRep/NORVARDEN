/**
 * /messages — Private messaging between verified companies and members.
 * Auth-required. Conversation list + thread panel.
 */
import { useEffect, useState, useRef, useCallback } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { useSearchParams } from 'react-router';
import {
  MessageSquare, Send, AlertTriangle, ShieldOff,
  ChevronLeft, MoreVertical, Check, X,
} from 'lucide-react';
import { AuthGuard } from '@/components/auth/RouteGuards';
import { useCurrentUser } from '@/lib/auth/use-current-user';
import { messages as content } from 'virtual:content';

// ── Design tokens ──────────────────────────────────────────────────────────────
const navy    = 'hsl(var(--hero-navy))';
const navyMid = 'hsl(var(--hero-navy-mid))';
const gold    = 'hsl(var(--hero-gold))';
const white   = 'hsl(var(--hero-white))';
const ice60   = 'hsl(var(--hero-ice-60))';

// ── Types ──────────────────────────────────────────────────────────────────────
interface ConversationSummary {
  id: number;
  connectionId: number;
  connectionStatus: string;
  otherUserId: string;
  displayName: string;
  photoUrl: string | null;
  memberType: string | null;
  iAmCompany: boolean;
  lastMessageBody: string | null;
  lastMessageAt: string | null;
  lastMessageSenderId: string | null;
  unreadCount: number;
  blockedAt: string | null;
  reportedAt: string | null;
  reportStatus: string | null;
  safetyNoticeSeen: boolean | null;
}

interface Message {
  id: number;
  conversationId: number;
  senderId: string;
  body: string;
  createdAt: string;
}

interface ConversationDetail {
  id: number;
  connectionId: number;
  connectionStatus: string;
  companyUserId: string;
  memberUserId: string;
  iAmCompany: boolean;
  blockedAt: string | null;
  blockedBy: string | null;
  reportedAt: string | null;
  reportStatus: string | null;
  safetyNoticeSeen: boolean | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'short' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function Avatar({ name, photoUrl, size = 40 }: { name: string; photoUrl: string | null; size?: number }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div
      className="shrink-0 rounded-full overflow-hidden flex items-center justify-center font-bodoni"
      style={{ width: size, height: size, border: '1.5px solid hsl(var(--hero-gold) / 0.4)', background: 'hsl(var(--hero-gold) / 0.1)', fontSize: size * 0.4, color: gold, flexShrink: 0 }}
    >
      {photoUrl
        ? <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
        : initial
      }
    </div>
  );
}

// ── Conversation list item ─────────────────────────────────────────────────────
function ConvItem({ conv, active, onClick }: { conv: ConversationSummary; active: boolean; onClick: () => void }) {
  const isUnread = conv.unreadCount > 0;
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-start gap-3 px-4 py-4 transition-colors"
      style={{
        background: active ? 'hsl(var(--hero-gold) / 0.08)' : 'transparent',
        borderBottom: '1px solid hsl(var(--hero-gold) / 0.1)',
        borderLeft: active ? `3px solid ${gold}` : '3px solid transparent',
      }}
    >
      <Avatar name={conv.displayName} photoUrl={conv.photoUrl} size={40} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span
            className="font-barlow-condensed uppercase truncate"
            style={{ fontSize: '11px', fontWeight: isUnread ? 600 : 500, letterSpacing: '0.2em', color: isUnread ? white : ice60 }}
          >
            {conv.displayName}
          </span>
          <span className="font-barlow shrink-0" style={{ fontSize: '11px', fontWeight: 300, color: 'hsl(var(--hero-ice) / 0.6)' }}>
            {formatTime(conv.lastMessageAt)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p
            className="font-barlow truncate"
            style={{ fontSize: '13px', fontWeight: isUnread ? 400 : 300, color: isUnread ? ice60 : 'hsl(var(--hero-ice) / 0.6)', lineHeight: 1.4 }}
          >
            {conv.lastMessageBody ?? 'No messages yet'}
          </p>
          {isUnread && (
            <span
              className="shrink-0 flex items-center justify-center font-barlow-condensed"
              style={{ minWidth: '18px', height: '18px', borderRadius: '9px', background: gold, color: navy, fontSize: '12px', fontWeight: 600, padding: '0 5px' }}
            >
              {conv.unreadCount}
            </span>
          )}
        </div>
        {conv.blockedAt && (
          <span className="font-barlow-condensed uppercase" style={{ fontSize: '11px', letterSpacing: '0.2em', color: 'hsl(var(--destructive))' }}>Blocked</span>
        )}
      </div>
    </button>
  );
}

// ── Message bubble ─────────────────────────────────────────────────────────────
function MessageBubble({ msg, isMine }: { msg: Message; isMine: boolean }) {
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        style={{
          maxWidth: '72%',
          padding: '10px 14px',
          borderRadius: isMine ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
          background: isMine ? gold : navyMid,
          border: isMine ? 'none' : '1px solid hsl(var(--hero-gold) / 0.2)',
        }}
      >
        <p className="font-barlow" style={{ fontSize: '14px', fontWeight: 300, color: isMine ? navy : white, lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {msg.body}
        </p>
        <p className="font-barlow mt-1" style={{ fontSize: '11px', fontWeight: 300, color: isMine ? 'hsl(var(--hero-navy) / 0.6)' : 'hsl(var(--hero-ice) / 0.6)', textAlign: isMine ? 'right' : 'left' }}>
          {formatTime(msg.createdAt)}
        </p>
      </div>
    </div>
  );
}

// ── Thread panel ───────────────────────────────────────────────────────────────
function ThreadPanel({
  convSummary,
  onBack,
  myUserId,
  onConversationUpdate,
}: {
  convSummary: ConversationSummary;
  onBack: () => void;
  myUserId: string;
  onConversationUpdate: () => void;
}) {
  const [detail, setDetail]       = useState<ConversationDetail | null>(null);
  const [msgs, setMsgs]           = useState<Message[]>([]);
  const [loading, setLoading]     = useState(true);
  const [body, setBody]           = useState('');
  const [sending, setSending]     = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [safetyDismissed, setSafetyDismissed] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const menuRef   = useRef<HTMLDivElement>(null);

  const fetchThread = useCallback(() => {
    setLoading(true);
    void fetch(`/api/messages/${convSummary.id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d: { conversation?: ConversationDetail; messages?: Message[] }) => {
        if (d.conversation) setDetail(d.conversation);
        if (d.messages) setMsgs(d.messages);
        onConversationUpdate();
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [convSummary.id, onConversationUpdate]);

  useEffect(() => { fetchThread(); }, [fetchThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function h(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [menuOpen]);

  const canSend = detail && !detail.blockedAt && detail.connectionStatus === 'accepted' && body.trim().length > 0 && body.trim().length <= 2000;

  async function handleSend() {
    if (!canSend || sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ recipientId: convSummary.otherUserId, body: body.trim() }),
      });
      if (res.ok) {
        setBody('');
        fetchThread();
      }
    } finally {
      setSending(false);
    }
  }

  async function handleReport() {
    if (!reportReason.trim() || actionBusy) return;
    setActionBusy(true);
    try {
      await fetch(`/api/messages/${convSummary.id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: reportReason.trim() }),
      });
      setShowReport(false);
      setReportReason('');
      fetchThread();
    } finally {
      setActionBusy(false);
    }
  }

  async function handleBlock() {
    if (actionBusy) return;
    setActionBusy(true);
    try {
      await fetch(`/api/messages/${convSummary.id}/block`, {
        method: 'POST',
        credentials: 'include',
      });
      setShowBlockConfirm(false);
      fetchThread();
      onConversationUpdate();
    } finally {
      setActionBusy(false);
    }
  }

  const isBlocked   = !!(detail?.blockedAt);
  const isReadOnly  = isBlocked || detail?.connectionStatus !== 'accepted';
  const showSafety  = !safetyDismissed && !detail?.safetyNoticeSeen;
  const isReported  = !!(detail?.reportedAt);

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div
        className="flex items-center gap-3 px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid hsl(var(--hero-gold) / 0.18)', background: navyMid }}
      >
        <button onClick={onBack} className="md:hidden mr-1 transition-opacity hover:opacity-70" aria-label="Back to conversations">
          <ChevronLeft size={20} style={{ color: ice60 }} />
        </button>
        <Avatar name={convSummary.displayName} photoUrl={convSummary.photoUrl} size={36} />
        <div className="flex-1 min-w-0">
          <p className="font-barlow-condensed uppercase truncate" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.22em', color: white }}>
            {convSummary.displayName}
          </p>
          {isBlocked && (
            <p className="font-barlow" style={{ fontSize: '11px', fontWeight: 300, color: 'hsl(var(--destructive))' }}>Blocked</p>
          )}
          {!isBlocked && isReadOnly && (
            <p className="font-barlow" style={{ fontSize: '11px', fontWeight: 300, color: ice60 }}>Connection removed</p>
          )}
        </div>

        {/* Actions menu */}
        {!isBlocked && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="p-1.5 rounded transition-opacity hover:opacity-70"
              aria-label="Conversation options"
            >
              <MoreVertical size={16} style={{ color: ice60 }} />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-full mt-1 w-44 py-1 z-50"
                style={{ background: navy, border: '1px solid hsl(var(--hero-gold) / 0.3)', borderRadius: '3px', boxShadow: '0 8px 24px hsl(var(--hero-navy) / 0.8)' }}
              >
                {!isReported && (
                  <button
                    onClick={() => { setMenuOpen(false); setShowReport(true); }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-left transition-colors hover:bg-white/5"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: white }}
                  >
                    <AlertTriangle size={13} style={{ color: ice60 }} />
                    {content.reportLabel}
                  </button>
                )}
                {isReported && (
                  <div className="flex items-center gap-2 px-4 py-2.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: ice60 }}>
                    <Check size={13} /> Reported
                  </div>
                )}
                {!convSummary.iAmCompany && (
                  <button
                    onClick={() => { setMenuOpen(false); setShowBlockConfirm(true); }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-left transition-colors hover:bg-white/5"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'hsl(var(--destructive))' }}
                  >
                    <ShieldOff size={13} />
                    {content.blockLabel}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Safety notice */}
      {showSafety && (
        <div
          className="flex items-start gap-3 px-4 py-3 shrink-0"
          style={{ background: 'hsl(var(--hero-gold) / 0.07)', borderBottom: '1px solid hsl(var(--hero-gold) / 0.2)' }}
        >
          <AlertTriangle size={15} style={{ color: gold, flexShrink: 0, marginTop: '2px' }} />
          <p className="font-barlow flex-1" style={{ fontSize: '13px', fontWeight: 300, color: ice60, lineHeight: 1.6 }}>
            {content.safetyNotice}
          </p>
          <button onClick={() => setSafetyDismissed(true)} aria-label="Dismiss" className="shrink-0 transition-opacity hover:opacity-70">
            <X size={14} style={{ color: ice60 }} />
          </button>
        </div>
      )}

      {/* Read-only / blocked notice */}
      {isReadOnly && (
        <div
          className="flex items-center gap-2 px-4 py-2.5 shrink-0"
          style={{ background: isBlocked ? 'hsl(var(--destructive) / 0.08)' : 'hsl(var(--hero-gold) / 0.05)', borderBottom: '1px solid hsl(var(--hero-gold) / 0.15)' }}
        >
          <ShieldOff size={13} style={{ color: isBlocked ? 'hsl(var(--destructive))' : ice60 }} />
          <p className="font-barlow" style={{ fontSize: '12px', fontWeight: 300, color: isBlocked ? 'hsl(var(--destructive))' : ice60 }}>
            {isBlocked ? content.blockedNotice : content.readOnlyNotice}
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ minHeight: 0 }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'hsl(var(--hero-gold) / 0.2)', borderTopColor: gold }} />
          </div>
        ) : msgs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <MessageSquare size={28} style={{ color: 'hsl(var(--hero-gold) / 0.3)' }} />
            <p className="font-barlow" style={{ fontSize: '14px', fontWeight: 300, color: ice60 }}>No messages yet. Say hello!</p>
          </div>
        ) : (
          msgs.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} isMine={msg.senderId === myUserId} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Compose */}
      {!isReadOnly && (
        <div
          className="shrink-0 px-4 py-3"
          style={{ borderTop: '1px solid hsl(var(--hero-gold) / 0.18)', background: navyMid }}
        >
          <div className="flex items-end gap-2">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              placeholder={content.sendPlaceholder}
              maxLength={2000}
              rows={2}
              className="flex-1 resize-none font-barlow"
              style={{
                background: 'hsl(var(--hero-navy) / 0.6)',
                border: '1px solid hsl(var(--hero-gold) / 0.25)',
                borderRadius: '3px',
                padding: '10px 12px',
                fontSize: '14px',
                fontWeight: 300,
                color: white,
                lineHeight: 1.5,
                outline: 'none',
              }}
              aria-label="Message body"
            />
            <button
              onClick={() => { void handleSend(); }}
              disabled={!canSend || sending}
              className="shrink-0 flex items-center justify-center transition-opacity hover:opacity-80 disabled:opacity-30"
              style={{ width: '40px', height: '40px', borderRadius: '2px', background: gold, border: 'none', cursor: canSend && !sending ? 'pointer' : 'default' }}
              aria-label={content.sendLabel}
            >
              <Send size={16} style={{ color: navy }} />
            </button>
          </div>
          {body.length > 1800 && (
            <p className="font-barlow mt-1 text-right" style={{ fontSize: '11px', fontWeight: 300, color: body.length > 2000 ? 'hsl(var(--destructive))' : ice60 }}>
              {body.length}/2000
            </p>
          )}
        </div>
      )}

      {/* Report modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'hsl(var(--hero-navy) / 0.85)' }}>
          <div className="w-full max-w-md p-6" style={{ background: navyMid, border: `1px solid ${gold}`, borderRadius: '3px' }}>
            <h3 className="font-bodoni mb-2" style={{ fontSize: '22px', fontWeight: 400, color: white }}>{content.reportLabel}</h3>
            <p className="font-barlow mb-4" style={{ fontSize: '14px', fontWeight: 300, color: ice60, lineHeight: 1.65 }}>{content.reportConfirm}</p>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder={content.reportReasonPlaceholder}
              rows={3}
              maxLength={500}
              className="w-full resize-none font-barlow mb-4"
              style={{ background: 'hsl(var(--hero-navy) / 0.6)', border: '1px solid hsl(var(--hero-gold) / 0.3)', borderRadius: '3px', padding: '10px 12px', fontSize: '14px', fontWeight: 300, color: white, lineHeight: 1.5, outline: 'none' }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => { void handleReport(); }}
                disabled={!reportReason.trim() || actionBusy}
                className="font-barlow-condensed uppercase transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ padding: '10px 20px', borderRadius: '2px', background: gold, color: navy, fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em', border: 'none', cursor: 'pointer' }}
              >
                Submit report
              </button>
              <button
                onClick={() => { setShowReport(false); setReportReason(''); }}
                className="font-barlow-condensed uppercase transition-opacity hover:opacity-80"
                style={{ padding: '10px 20px', borderRadius: '2px', background: 'transparent', color: ice60, fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em', border: '1px solid hsl(var(--hero-gold) / 0.3)', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block confirm modal */}
      {showBlockConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'hsl(var(--hero-navy) / 0.85)' }}>
          <div className="w-full max-w-md p-6" style={{ background: navyMid, border: '1px solid hsl(var(--destructive))', borderRadius: '3px' }}>
            <h3 className="font-bodoni mb-2" style={{ fontSize: '22px', fontWeight: 400, color: white }}>{content.blockLabel}</h3>
            <p className="font-barlow mb-6" style={{ fontSize: '14px', fontWeight: 300, color: ice60, lineHeight: 1.65 }}>{content.blockConfirm}</p>
            <div className="flex gap-3">
              <button
                onClick={() => { void handleBlock(); }}
                disabled={actionBusy}
                className="font-barlow-condensed uppercase transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ padding: '10px 20px', borderRadius: '2px', background: 'hsl(var(--destructive))', color: white, fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em', border: 'none', cursor: 'pointer' }}
              >
                Block company
              </button>
              <button
                onClick={() => setShowBlockConfirm(false)}
                className="font-barlow-condensed uppercase transition-opacity hover:opacity-80"
                style={{ padding: '10px 20px', borderRadius: '2px', background: 'transparent', color: ice60, fontSize: '12px', fontWeight: 500, letterSpacing: '0.28em', border: '1px solid hsl(var(--hero-gold) / 0.3)', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Inner page ─────────────────────────────────────────────────────────────────
function MessagesInner() {
  const { user } = useCurrentUser();
  const [searchParams, setSearchParams] = useSearchParams();

  const [convList, setConvList]       = useState<ConversationSummary[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [activeId, setActiveId]       = useState<number | null>(null);
  const [mobileShowThread, setMobileShowThread] = useState(false);

  // Redirect employers to company dashboard (they also use /messages but let's keep it universal)
  // Actually both sides use /messages — no redirect needed.

  const fetchList = useCallback(() => {
    void fetch('/api/messages', { credentials: 'include' })
      .then((r) => r.json())
      .then((d: { conversations?: ConversationSummary[] }) => {
        setConvList(d.conversations ?? []);
        setListLoading(false);
      })
      .catch(() => setListLoading(false));
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  // Support ?conv=id deep-link
  useEffect(() => {
    const convParam = searchParams.get('conv');
    if (convParam) {
      const id = parseInt(convParam, 10);
      if (!isNaN(id)) {
        setActiveId(id);
        setMobileShowThread(true);
      }
    }
  }, [searchParams]);

  const activeConv = convList.find((c) => c.id === activeId) ?? null;

  function selectConv(id: number) {
    setActiveId(id);
    setMobileShowThread(true);
    setSearchParams({ conv: String(id) }, { replace: true });
  }

  function handleBack() {
    setMobileShowThread(false);
    setActiveId(null);
    setSearchParams({}, { replace: true });
  }

  return (
    <main className="flex flex-col" style={{ background: navy, height: 'calc(100vh - 64px)', marginTop: '64px' }}>
      <Helmet>
        <title>{content.pageTitle} — NORVARDEN</title>
        <meta name="description" content="Private messages between verified companies and members on NORVARDEN." />
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Conversation list ─────────────────────────────────────────────── */}
        <div
          className={`${mobileShowThread ? 'hidden' : 'flex'} md:flex flex-col w-full md:w-80 lg:w-96 shrink-0`}
          style={{ borderRight: '1px solid hsl(var(--hero-gold) / 0.18)', background: navyMid }}
        >
          {/* List header */}
          <div className="px-5 py-4 shrink-0" style={{ borderBottom: '1px solid hsl(var(--hero-gold) / 0.18)' }}>
            <h1 className="font-bodoni" style={{ fontSize: '22px', fontWeight: 400, color: white, lineHeight: 1.05 }}>
              {content.pageTitle}
            </h1>
          </div>

          {/* List body */}
          <div className="flex-1 overflow-y-auto">
            {listLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'hsl(var(--hero-gold) / 0.2)', borderTopColor: gold }} />
              </div>
            ) : convList.length === 0 ? (
              <div className="flex flex-col items-center text-center px-6 py-16 gap-4">
                <MessageSquare size={32} style={{ color: 'hsl(var(--hero-gold) / 0.3)' }} />
                <p className="font-bodoni" style={{ fontSize: '20px', fontWeight: 400, color: white }}>{content.emptyHeading}</p>
                <p className="font-barlow" style={{ fontSize: '14px', fontWeight: 300, color: ice60, lineHeight: 1.65 }}>{content.emptyBody}</p>
              </div>
            ) : (
              convList.map((conv) => (
                <ConvItem
                  key={conv.id}
                  conv={conv}
                  active={conv.id === activeId}
                  onClick={() => selectConv(conv.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Thread panel ──────────────────────────────────────────────────── */}
        <div className={`${mobileShowThread ? 'flex' : 'hidden'} md:flex flex-1 flex-col overflow-hidden`}>
          {activeConv && user ? (
            <ThreadPanel
              convSummary={activeConv}
              onBack={handleBack}
              myUserId={user.id}
              onConversationUpdate={fetchList}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
              <MessageSquare size={40} style={{ color: 'hsl(var(--hero-gold) / 0.2)' }} />
              <p className="font-bodoni" style={{ fontSize: '24px', fontWeight: 400, color: 'hsl(var(--hero-white) / 0.7)' }}>
                Select a conversation
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function MessagesPage() {
  return (
    <AuthGuard>
      <MessagesInner />
    </AuthGuard>
  );
}
