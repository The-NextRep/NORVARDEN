/**
 * Small presentational building blocks shared by the admin pages.
 */
import { useEffect, useState, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { adminTheme as t, eyebrowStyle } from './theme';

// ── Layout pieces ───────────────────────────────────────────────────────────

export function Eyebrow({ children, color = t.ice60, style }: { children: ReactNode; color?: string; style?: CSSProperties }) {
  return (
    <span className="font-barlow-condensed uppercase" style={{ ...eyebrowStyle, color, ...style }}>
      {children}
    </span>
  );
}

export function Panel({ children, className = '', style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={className} style={{ background: t.navyMid, border: `1px solid ${t.line}`, borderRadius: '3px', ...style }}>
      {children}
    </div>
  );
}

export function Spinner({ size = 28 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center py-16" role="status" aria-label="Loading">
      <div
        className="rounded-full border-2 animate-spin"
        style={{ width: size, height: size, borderColor: t.lineStrong, borderTopColor: t.gold }}
      />
    </div>
  );
}

export function EmptyState({ icon, title, body }: { icon?: ReactNode; title: string; body?: string }) {
  return (
    <div className="flex flex-col items-center text-center py-16 gap-3">
      {icon}
      <p className="font-bodoni" style={{ fontSize: '22px', fontWeight: 400, color: t.white }}>{title}</p>
      {body && <p className="font-barlow max-w-md" style={{ fontSize: '14px', fontWeight: 300, color: t.ice60 }}>{body}</p>}
    </div>
  );
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="font-barlow mb-4 px-4 py-3" style={{ fontSize: '13px', color: t.danger, background: t.dangerWash, borderRadius: '3px' }}>
      {message}
    </p>
  );
}

export type PillTone = 'gold' | 'danger' | 'success' | 'info' | 'muted';

const PILL_TONES: Record<PillTone, { bg: string; fg: string }> = {
  gold: { bg: t.goldWash, fg: t.gold },
  danger: { bg: t.dangerWash, fg: t.danger },
  success: { bg: t.successWash, fg: t.success },
  info: { bg: t.infoWash, fg: t.info },
  muted: { bg: 'hsl(214 60% 93% / 0.06)', fg: t.ice60 },
};

export function Pill({ tone = 'muted', children, title }: { tone?: PillTone; children: ReactNode; title?: string }) {
  const c = PILL_TONES[tone];
  return (
    <span
      title={title}
      className="font-barlow-condensed uppercase inline-flex items-center whitespace-nowrap"
      style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.2em', padding: '3px 8px', borderRadius: '2px', background: c.bg, color: c.fg }}
    >
      {children}
    </span>
  );
}

// ── Controls ────────────────────────────────────────────────────────────────

type ButtonTone = 'gold' | 'ghost' | 'danger' | 'solid';

const BUTTON_TONES: Record<ButtonTone, CSSProperties> = {
  solid: { background: t.gold, color: t.navy, border: `1px solid ${t.gold}` },
  gold: { background: t.goldWash, color: t.gold, border: `1px solid hsl(40 60% 66% / 0.4)` },
  ghost: { background: 'transparent', color: t.ice60, border: `1px solid ${t.lineStrong}` },
  danger: { background: 'transparent', color: t.danger, border: '1px solid hsl(var(--destructive) / 0.5)' },
};

export function AdminButton({
  tone = 'gold',
  size = 'md',
  children,
  style,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: ButtonTone; size?: 'sm' | 'md' }) {
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex items-center justify-center gap-2 font-barlow-condensed uppercase transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      style={{
        fontSize: size === 'sm' ? '9px' : '10px',
        fontWeight: 600,
        letterSpacing: '0.24em',
        padding: size === 'sm' ? '7px 12px' : '10px 18px',
        borderRadius: '2px',
        cursor: 'pointer',
        ...BUTTON_TONES[tone],
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/** A react-router Link styled like AdminButton (avoids nesting <button> in <a>). */
export function AdminLink({ to, tone = 'ghost', size = 'md', children, className = '' }: {
  to: string; tone?: ButtonTone; size?: 'sm' | 'md'; children: ReactNode; className?: string;
}) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center justify-center gap-2 font-barlow-condensed uppercase transition-opacity hover:opacity-80 ${className}`}
      style={{
        fontSize: size === 'sm' ? '9px' : '10px',
        fontWeight: 600,
        letterSpacing: '0.24em',
        padding: size === 'sm' ? '7px 12px' : '10px 18px',
        borderRadius: '2px',
        textDecoration: 'none',
        ...BUTTON_TONES[tone],
      }}
    >
      {children}
    </Link>
  );
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="relative flex-1 min-w-[220px] max-w-md">
      <span className="sr-only">{placeholder}</span>
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: t.ice60 }} aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full font-barlow pl-9 pr-3 py-2.5 focus:outline-none"
        style={{ fontSize: '14px', fontWeight: 300, color: t.white, background: t.panel, border: `1px solid ${t.lineStrong}`, borderRadius: '2px' }}
      />
    </label>
  );
}

export function FilterTabs<T extends string>({ options, value, onChange }: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className="font-barlow-condensed uppercase transition-colors"
            style={{
              ...eyebrowStyle,
              fontSize: '9px',
              letterSpacing: '0.22em',
              padding: '8px 12px',
              borderRadius: '2px',
              cursor: 'pointer',
              background: active ? t.gold : 'transparent',
              color: active ? t.navy : t.ice60,
              border: `1px solid ${active ? t.gold : t.lineStrong}`,
            }}
          >
            {o.label}
            {typeof o.count === 'number' && <span style={{ marginLeft: 6, opacity: 0.75 }}>{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function Pager({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="flex items-center justify-between gap-4 mt-6">
      <Eyebrow>{from}–{to} of {total}</Eyebrow>
      {pages > 1 && (
        <div className="flex items-center gap-2">
          <AdminButton tone="ghost" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
            <ChevronLeft size={12} /> Prev
          </AdminButton>
          <Eyebrow>Page {page} / {pages}</Eyebrow>
          <AdminButton tone="ghost" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page">
            Next <ChevronRight size={12} />
          </AdminButton>
        </div>
      )}
    </div>
  );
}

// ── Confirmation dialog ─────────────────────────────────────────────────────

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  tone?: 'danger' | 'gold';
  /** Optional free-text field (e.g. a suspension reason). */
  reasonLabel?: string;
  reasonPlaceholder?: string;
  reasonRequired?: boolean;
  onConfirm: (reason: string) => Promise<void>;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  tone = 'danger',
  reasonLabel,
  reasonPlaceholder,
  reasonRequired = false,
  onConfirm,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState('');
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) { setReason(''); setError(null); setWorking(false); }
  }, [open]);

  async function handleConfirm() {
    if (reasonRequired && !reason.trim()) { setError('Please enter a reason.'); return; }
    setWorking(true);
    setError(null);
    try {
      await onConfirm(reason.trim());
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setWorking(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!working) onOpenChange(o); }}>
      <AlertDialogContent
        className="sm:rounded-[3px]"
        style={{ background: t.navyMid, border: `1px solid ${tone === 'danger' ? 'hsl(var(--destructive) / 0.45)' : t.lineStrong}`, color: t.white }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="font-bodoni" style={{ fontSize: '24px', fontWeight: 400, color: t.white }}>
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="font-barlow" style={{ fontSize: '14px', fontWeight: 300, color: t.ice60, lineHeight: 1.6 }}>
              {description}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {reasonLabel && (
          <label className="flex flex-col gap-2">
            <Eyebrow>{reasonLabel}{reasonRequired ? '' : ' (optional)'}</Eyebrow>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder={reasonPlaceholder}
              className="w-full font-barlow px-3 py-2 resize-none focus:outline-none"
              style={{ fontSize: '14px', fontWeight: 300, color: t.white, background: t.panel, border: `1px solid ${t.lineStrong}`, borderRadius: '2px' }}
            />
          </label>
        )}

        {error && <p role="alert" className="font-barlow" style={{ fontSize: '13px', color: t.danger }}>{error}</p>}

        <AlertDialogFooter className="gap-2">
          <AdminButton tone="ghost" onClick={() => onOpenChange(false)} disabled={working}>Cancel</AdminButton>
          <AdminButton
            tone={tone === 'danger' ? 'danger' : 'solid'}
            onClick={() => { void handleConfirm(); }}
            disabled={working}
            style={tone === 'danger' ? { background: t.danger, color: t.white, border: `1px solid ${t.danger}` } : undefined}
          >
            {working ? 'Working…' : confirmLabel}
          </AdminButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
