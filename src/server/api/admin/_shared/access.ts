/**
 * Batched access lookups for admin lists.
 * Mirrors the rules in src/server/lib/company-access.ts#getCompanyAccess
 * (Stripe subscription with an active-like status and a future/no period end,
 * otherwise manualAccessUntil in the future) without one query per company.
 */
import { desc, inArray } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { companySubscriptions } from '@/server/db/schema';

export const ACTIVE_SUB_STATUSES = ['active', 'trialing', 'past_due'] as const;
const ACTIVE = new Set<string>(ACTIVE_SUB_STATUSES);

export interface AdminAccessSummary {
  active: boolean;
  source: 'stripe' | 'manual' | null;
  plan: string | null;
  billingCycle: string | null;
  status: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

export async function getAccessForCompanies(
  companies: { id: number; manualAccessUntil: Date | null }[],
): Promise<Map<number, AdminAccessSummary>> {
  const result = new Map<number, AdminAccessSummary>();
  if (companies.length === 0) return result;

  const subs = await db
    .select()
    .from(companySubscriptions)
    .where(inArray(companySubscriptions.companyId, companies.map((c) => c.id)))
    .orderBy(desc(companySubscriptions.updatedAt));

  const byCompany = new Map<number, typeof subs>();
  for (const s of subs) {
    const list = byCompany.get(s.companyId) ?? [];
    list.push(s);
    byCompany.set(s.companyId, list);
  }

  const now = new Date();
  for (const c of companies) {
    const list = byCompany.get(c.id) ?? [];
    const live = list.find((s) => ACTIVE.has(s.status) && (!s.currentPeriodEnd || s.currentPeriodEnd > now));
    if (live) {
      result.set(c.id, {
        active: true,
        source: 'stripe',
        plan: live.plan,
        billingCycle: live.billingCycle,
        status: live.status,
        currentPeriodEnd: live.currentPeriodEnd,
        cancelAtPeriodEnd: !!live.cancelAtPeriodEnd,
      });
      continue;
    }
    if (c.manualAccessUntil && c.manualAccessUntil > now) {
      result.set(c.id, {
        active: true,
        source: 'manual',
        plan: 'founding',
        billingCycle: null,
        status: 'active',
        currentPeriodEnd: c.manualAccessUntil,
        cancelAtPeriodEnd: false,
      });
      continue;
    }
    const latest = list[0];
    result.set(c.id, {
      active: false,
      source: null,
      plan: latest?.plan ?? null,
      billingCycle: latest?.billingCycle ?? null,
      status: latest?.status ?? null,
      currentPeriodEnd: latest?.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: !!latest?.cancelAtPeriodEnd,
    });
  }
  return result;
}
