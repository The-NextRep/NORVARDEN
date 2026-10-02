/**
 * Route guard components for client-side access control.
 *
 * AdminGuard  — redirects to /login if logged out; shows 403 page if logged in but not admin
 * AuthGuard   — redirects to /login if logged out
 *
 * Both use useCurrentUser which hits /api/auth/me (server-side session check).
 * The server independently enforces the same rules on every API call — these
 * guards are UX only and do not replace server enforcement.
 */
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { ShieldOff } from 'lucide-react';
import { useCurrentUser } from '@/lib/auth/use-current-user';

// ── Shared loading skeleton ───────────────────────────────────────────────────
function GuardSkeleton() {
  const navy = 'hsl(var(--hero-navy))';
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: navy }}
      aria-label="Checking access…"
    >
      <div
        className="w-8 h-8 rounded-full border-2 animate-spin"
        style={{
          borderColor: 'hsl(var(--hero-gold) / 0.25)',
          borderTopColor: 'hsl(var(--hero-gold))',
        }}
      />
    </div>
  );
}

// ── 403 page (logged in, wrong role) ─────────────────────────────────────────
function AccessDeniedPage() {
  const navy = 'hsl(var(--hero-navy))';
  const gold = 'hsl(var(--hero-gold))';
  const white = 'hsl(var(--hero-white))';
  const ice60 = 'hsl(var(--hero-ice-60))';

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: navy }}
    >
      <ShieldOff size={48} style={{ color: gold, marginBottom: '24px', opacity: 0.7 }} aria-hidden="true" />

      <h1
        className="font-bodoni mb-3"
        style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 400, color: white, lineHeight: 1.05 }}
      >
        You don&apos;t have access to{' '}
        <em style={{ color: gold, fontStyle: 'italic' }}>this page.</em>
      </h1>

      <p
        className="font-barlow mb-8 max-w-md"
        style={{ fontSize: '16px', fontWeight: 300, color: ice60, lineHeight: 1.75 }}
      >
        This area is restricted to administrators. If you believe this is a mistake,
        contact support.
      </p>

      <a
        href="/"
        className="font-barlow-condensed uppercase inline-flex items-center justify-center transition-opacity hover:opacity-80"
        style={{
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.28em',
          color: gold,
          border: '1px solid hsl(var(--hero-gold) / 0.4)',
          padding: '12px 28px',
          borderRadius: '2px',
        }}
      >
        Back to home
      </a>
    </main>
  );
}

// ── AdminGuard ────────────────────────────────────────────────────────────────
/**
 * Wrap any /admin/* page with this.
 * - Pending session → spinner
 * - Not authenticated → redirect to /login?next=<current path>
 * - Authenticated but not admin → 403 page
 * - Admin → renders children
 */
export function AdminGuard({ children }: { children: ReactNode }) {
  const { isPending, isAuthenticated, user } = useCurrentUser();
  const location = useLocation();

  if (isPending) return <GuardSkeleton />;

  if (!isAuthenticated) {
    return <Navigate to={'/login?next=' + encodeURIComponent(location.pathname)} replace />;
  }

  if (!user?.isAdmin) {
    return <AccessDeniedPage />;
  }

  return <>{children}</>;
}

// ── AuthGuard ─────────────────────────────────────────────────────────────────
/**
 * Wrap any authenticated-member page with this.
 * - Pending session → spinner
 * - Not authenticated → redirect to /login?next=<current path>
 * - Authenticated → renders children
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { isPending, isAuthenticated } = useCurrentUser();
  const location = useLocation();

  if (isPending) return <GuardSkeleton />;

  if (!isAuthenticated) {
    return <Navigate to={'/login?next=' + encodeURIComponent(location.pathname)} replace />;
  }

  return <>{children}</>;
}
