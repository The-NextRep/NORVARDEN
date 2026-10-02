/**
 * useCurrentUser
 *
 * Fetches /api/auth/me and returns the enriched user (with memberType + isAdmin).
 * Caches in module-level state so all header instances share one request.
 * Re-fetches on window focus so the header stays fresh after login/logout in
 * another tab. Focus re-fetches are silent (no "pending" flash) so guarded
 * pages never unmount and lose unsaved form input.
 */
import { useCallback, useSyncExternalStore } from 'react';

export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  memberType: 'athlete' | 'coach' | 'veteran' | 'employer' | null;
  isAdmin: boolean;
}

type State =
  | { status: 'pending' }
  | { status: 'authenticated'; user: CurrentUser }
  | { status: 'unauthenticated' };

const PENDING: State = { status: 'pending' };

// Module-level cache — shared across all hook instances in the same page load.
let _cache: State = PENDING;
const _listeners = new Set<() => void>();

function notify(s: State) {
  _cache = s;
  _listeners.forEach((fn) => fn());
}

let _inflight: Promise<void> | null = null;

function fetchMe(): Promise<void> {
  if (_inflight) return _inflight;
  _inflight = (async () => {
    try {
      const res  = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
      const data = await res.json() as { user: CurrentUser | null };
      const next: State = data.user ? { status: 'authenticated', user: data.user } : { status: 'unauthenticated' };
      // Keep the same object when nothing changed so subscribers don't re-render.
      if (JSON.stringify(next) !== JSON.stringify(_cache)) notify(next);
    } catch {
      if (_cache.status === 'pending') notify({ status: 'unauthenticated' });
    } finally {
      _inflight = null;
    }
  })();
  return _inflight;
}

// Kick off the first fetch immediately (module init) and refresh silently on
// focus (handles login/logout in another tab).
if (typeof window !== 'undefined') {
  void fetchMe();
  window.addEventListener('focus', () => { void fetchMe(); });
}

function subscribe(fn: () => void) {
  _listeners.add(fn);
  return () => { _listeners.delete(fn); };
}

// The server never knows the user, so SSR and hydration both render "pending";
// the real state is applied right after hydration.
const getSnapshot = () => _cache;
const getServerSnapshot = () => PENDING;

export function useCurrentUser() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const refetch = useCallback(() => fetchMe(), []);

  return {
    isPending:       state.status === 'pending',
    isAuthenticated: state.status === 'authenticated',
    user:            state.status === 'authenticated' ? state.user : null,
    refetch,
  };
}

/** Re-read the session now (e.g. right after sign-in / sign-up). */
export function refreshCurrentUser(): Promise<void> {
  // A fetch started before the cookie changed would return stale data.
  return _inflight ? _inflight.then(fetchMe) : fetchMe();
}

/** Call this after a successful logout to immediately clear the cache. */
export function clearCurrentUser() {
  notify({ status: 'unauthenticated' });
}
