import { db } from '../db/client.js';
import { blockedEmailDomains, blockedCompanyDomains } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com','yahoo.com','outlook.com','hotmail.com','icloud.com',
  'aol.com','proton.me','protonmail.com','me.com','mac.com','live.com',
  'msn.com','ymail.com','googlemail.com','mail.com','inbox.com',
  'zoho.com','fastmail.com','tutanota.com','hey.com',
]);

export function extractDomain(email: string): string {
  return email.split('@')[1]?.toLowerCase() ?? '';
}

export function extractWebsiteDomain(url: string): string {
  try {
    const u = new URL(url.startsWith('http') ? url : 'https://' + url);
    return u.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase();
  }
}

export async function isEmailDomainBlocked(domain: string): Promise<boolean> {
  if (FREE_EMAIL_DOMAINS.has(domain)) return true;
  const rows = await db.select().from(blockedEmailDomains).where(eq(blockedEmailDomains.domain, domain)).limit(1);
  return rows.length > 0;
}

export async function isCompanyDomainBlocked(domain: string): Promise<boolean> {
  const rows = await db.select().from(blockedCompanyDomains).where(eq(blockedCompanyDomains.domain, domain)).limit(1);
  return rows.length > 0;
}

export function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function codeExpiresAt(): Date {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 15);
  return d;
}
