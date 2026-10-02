/**
 * Server-side auth guard middleware.
 *
 * requireAdmin  — 401 if not logged in, 403 if logged in but not admin
 * requireAuth   — 401 if not logged in
 * getSessionUser — helper that returns the session user or null (no response sent)
 *
 * All checks happen via BetterAuth's server-side getSession(), which reads the
 * HttpOnly session cookie. There is no client-supplied header involved.
 */
import type { Request, Response, NextFunction } from 'express';
import { getAuth } from '@/lib/auth/auth';

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
}

/** Resolve the BetterAuth session from the incoming request. Returns null on any error. */
export async function getSessionUser(req: Request): Promise<SessionUser | null> {
  try {
    const auth    = getAuth();
    const session = await auth.api.getSession({
      headers: req.headers as unknown as Headers,
    });
    if (!session?.user) return null;
    if ((session.user as { suspended?: boolean }).suspended) return null;
    return {
      id:      session.user.id,
      email:   session.user.email,
      name:    (session.user as { name?: string | null }).name ?? null,
      isAdmin: (session.user as { isAdmin?: boolean }).isAdmin ?? false,
    };
  } catch {
    return null;
  }
}

/**
 * Require a valid session. Sends 401 if not authenticated.
 * Attaches the resolved user to res.locals.sessionUser for downstream handlers.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const user = await getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  res.locals['sessionUser'] = user;
  next();
}

/**
 * Require admin role. Sends 401 if not authenticated, 403 if authenticated but not admin.
 * Attaches the resolved user to res.locals.sessionUser for downstream handlers.
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const user = await getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  if (!user.isAdmin) {
    res.status(403).json({ error: 'Admin access required.' });
    return;
  }
  res.locals['sessionUser'] = user;
  next();
}
