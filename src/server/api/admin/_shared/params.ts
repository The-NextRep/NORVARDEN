/**
 * Small helpers shared by the /api/admin/* handlers.
 * (Not a route — lives under an underscore folder.)
 */
import type { Request, Response } from 'express';
import type { SessionUser } from '@/server/middleware/auth-guards';

/** Parse a strictly positive integer path param (`:id`). Returns null when invalid. */
export function parseIdParam(req: Request, name = 'id'): number | null {
  const raw = req.params[name];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== 'string' || !/^\d{1,10}$/.test(value)) return null;
  const n = parseInt(value, 10);
  return n > 0 && n <= 2147483647 ? n : null;
}

/** Parse a string path param (e.g. a user id). Returns null when missing or oversized. */
export function parseStringParam(req: Request, name = 'id', maxLength = 64): string | null {
  const raw = req.params[name];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed && trimmed.length <= maxLength ? trimmed : null;
}

/** Read a positive integer query param with bounds. */
export function parseIntQuery(value: unknown, fallback: number, min: number, max: number): number {
  const s = Array.isArray(value) ? value[0] : value;
  if (typeof s !== 'string' || !/^\d{1,9}$/.test(s)) return fallback;
  const n = parseInt(s, 10);
  return Math.min(max, Math.max(min, n));
}

/** Read a trimmed string query param (max 200 chars). */
export function parseStringQuery(value: unknown): string {
  const s = Array.isArray(value) ? value[0] : value;
  return typeof s === 'string' ? s.trim().slice(0, 200) : '';
}

/** Escape LIKE wildcards so user input matches literally. */
export function escapeLike(input: string): string {
  return input.replace(/[\\%_]/g, (c) => '\\' + c);
}

/** The signed-in admin (set by requireAdmin). */
export function getAdmin(res: Response): SessionUser | undefined {
  return res.locals['sessionUser'] as SessionUser | undefined;
}
