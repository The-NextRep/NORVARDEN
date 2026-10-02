/**
 * What a company pays to host an event on REP | IV.
 *
 *   No plan        standard $750, featured $1,500
 *   Scout          1 standard per calendar quarter included, then $500;
 *                  featured $500
 *   Partner*       unlimited standard; 1 featured per quarter included, then $500
 *   (* Founding partners with admin-granted access count as Partner.)
 *
 * The 30% mission discount applies to every fee. Rejected events don't use up
 * an included listing.
 */
import { and, eq, gte, ne, sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { events } from '@/server/db/schema';
import { getCompanyAccess, type EmployerCompany } from '@/server/lib/company-access';

export type EventTier = 'standard' | 'featured';
export const EVENT_TIERS: readonly EventTier[] = ['standard', 'featured'];

export const EVENT_FEES = {
  nonMember: { standard: 75000, featured: 150000 },
  memberExtra: 50000,
} as const;

export interface TierQuote {
  amountCents: number;
  included: boolean;
  /** Plain-English reason shown next to the price. */
  note: string;
}

export interface EventQuote {
  plan: 'none' | 'scout' | 'partner';
  missionDiscount: boolean;
  standard: TierQuote;
  featured: TierQuote;
}

export function quarterStart(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), Math.floor(d.getUTCMonth() / 3) * 3, 1));
}

async function includedUsedThisQuarter(companyId: number, tier: EventTier): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`COUNT(*)` })
    .from(events)
    .where(and(
      eq(events.hostCompanyId, companyId),
      eq(events.coverage, 'included'),
      eq(events.tier, tier),
      ne(events.status, 'rejected'),
      gte(events.createdAt, quarterStart()),
    ));
  return Number(row?.n ?? 0);
}

function discounted(cents: number, mission: boolean): number {
  return mission ? Math.round(cents * 0.7) : cents;
}

export async function quoteForCompany(company: EmployerCompany): Promise<EventQuote> {
  const access = await getCompanyAccess(company);
  const mission = !!company.missionDiscountUnlocked;
  const plan: EventQuote['plan'] = !access.active ? 'none' : access.plan === 'scout' ? 'scout' : 'partner';
  const extra = discounted(EVENT_FEES.memberExtra, mission);

  if (plan === 'none') {
    return {
      plan, missionDiscount: mission,
      standard: { amountCents: discounted(EVENT_FEES.nonMember.standard, mission), included: false, note: 'One-time fee per event' },
      featured: { amountCents: discounted(EVENT_FEES.nonMember.featured, mission), included: false, note: 'One-time fee per event' },
    };
  }

  if (plan === 'scout') {
    const used = await includedUsedThisQuarter(company.id, 'standard');
    return {
      plan, missionDiscount: mission,
      standard: used < 1
        ? { amountCents: 0, included: true, note: 'Included with Scout (1 per quarter)' }
        : { amountCents: extra, included: false, note: 'This quarter’s included listing is used' },
      featured: { amountCents: extra, included: false, note: 'Scout member price' },
    };
  }

  const usedFeatured = await includedUsedThisQuarter(company.id, 'featured');
  return {
    plan, missionDiscount: mission,
    standard: { amountCents: 0, included: true, note: 'Included with your plan' },
    featured: usedFeatured < 1
      ? { amountCents: 0, included: true, note: 'Included with Partner (1 per quarter)' }
      : { amountCents: extra, included: false, note: 'This quarter’s included featured listing is used' },
  };
}
