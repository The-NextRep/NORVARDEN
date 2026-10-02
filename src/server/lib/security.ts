/**
 * Small shared security helpers.
 */
import crypto from 'crypto';
import type { Request } from 'express';

/** SHA-256 hex digest, used to store one-time tokens without keeping the raw value. */
export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/** Random URL-safe token (hex). */
export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/** 6-digit numeric one-time code. */
export function sixDigitCode(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

/**
 * Public base URL of the site, used in emailed links.
 * Always prefer APP_BASE_URL so links can't be pointed at another host
 * via a forged Host header.
 */
export function appBaseUrl(req?: Request): string {
  const configured = process.env.APP_BASE_URL?.replace(/\/+$/, '');
  if (configured) return configured;
  // Railway sets RAILWAY_PUBLIC_DOMAIN to the service's public domain, so
  // links work on the Railway URL until a custom domain is configured.
  const railway = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (railway) return `https://${railway}`;
  if (process.env.NODE_ENV === 'production') return 'https://jobs.the-nextrep.com';
  return req ? `${req.protocol}://${req.get('host')}` : 'http://localhost:3000';
}

/** Escape text for safe inclusion in HTML email bodies. */
export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
}

/**
 * Very small in-memory rate limiter (per key, sliding window).
 * Good enough for a single server instance.
 */
const buckets = new Map<string, number[]>();
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
  }
  return true;
}

export function clientIp(req: Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown';
}
