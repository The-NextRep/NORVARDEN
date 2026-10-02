/**
 * Resolves which verified company a signed-in employer belongs to, and
 * whether that company currently has paid (or admin-granted) access.
 *
 * Identity rule: the user's login email must match the contact email of an
 * APPROVED company application AND the user must have proven they own that
 * inbox (user.emailVerified — set when they complete an emailed sign-in code,
 * a company verification code, or an emailed password reset). This stops
 * someone from claiming a company just by signing up with its email first.
 */
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import {
  companyApplications,
  companySubscriptions,
  memberProfiles,
  user,
  verifiedCompanies,
} from '@/server/db/schema';

export interface EmployerCompany {
  id: number;
  legalName: string;
  postsPaused: boolean | null;
  blocked: boolean | null;
  missionDiscountUnlocked: boolean | null;
  manualAccessUntil: Date | null;
}

export type EmployerResolution =
  | { ok: true; company: EmployerCompany }
  | { ok: false; reason: 'not_employer' | 'email_unverified' | 'not_approved' | 'suspended' };

export async function resolveEmployerForUser(userId: string): Promise<EmployerResolution> {
  const [row] = await db
    .select({
      email: user.email,
      emailVerified: user.emailVerified,
      memberType: memberProfiles.memberType,
    })
    .from(user)
    .leftJoin(memberProfiles, eq(memberProfiles.userId, user.id))
    .where(eq(user.id, userId))
    .limit(1);

  if (!row || row.memberType !== 'employer') return { ok: false, reason: 'not_employer' };

  const [app] = await db
    .select({ id: companyApplications.id })
    .from(companyApplications)
    .where(
      and(
        eq(companyApplications.contactEmail, row.email.toLowerCase()),
        eq(companyApplications.status, 'approved'),
      ),
    )
    .orderBy(desc(companyApplications.id))
    .limit(1);
  if (!app) return { ok: false, reason: 'not_approved' };

  if (!row.emailVerified) return { ok: false, reason: 'email_unverified' };

  const [vc] = await db
    .select({
      id: verifiedCompanies.id,
      legalName: verifiedCompanies.legalName,
      postsPaused: verifiedCompanies.postsPaused,
      blocked: verifiedCompanies.blocked,
      missionDiscountUnlocked: verifiedCompanies.missionDiscountUnlocked,
      manualAccessUntil: verifiedCompanies.manualAccessUntil,
    })
    .from(verifiedCompanies)
    .where(eq(verifiedCompanies.applicationId, app.id))
    .limit(1);
  if (!vc) return { ok: false, reason: 'not_approved' };
  if (vc.blocked) return { ok: false, reason: 'suspended' };

  return { ok: true, company: vc };
}

/** Back-compat wrapper used by the job-posting handlers. */
export async function resolveEmployerCompany(userId: string): Promise<EmployerCompany | null> {
  const r = await resolveEmployerForUser(userId);
  return r.ok ? r.company : null;
}

const ACTIVE_STATUSES = new Set(['active', 'trialing', 'past_due']);

export interface AccessStatus {
  active: boolean;
  source: 'stripe' | 'manual' | null;
  plan: string | null;
  billingCycle: string | null;
  status: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId: string | null;
}

/** Does this company currently have paid access (Stripe subscription or admin-granted)? */
export async function getCompanyAccess(company: Pick<EmployerCompany, 'id' | 'manualAccessUntil'>): Promise<AccessStatus> {
  const now = new Date();
  const subs = await db
    .select()
    .from(companySubscriptions)
    .where(eq(companySubscriptions.companyId, company.id))
    .orderBy(desc(companySubscriptions.updatedAt));

  const live = subs.find(
    (s) => ACTIVE_STATUSES.has(s.status) && (!s.currentPeriodEnd || s.currentPeriodEnd > now),
  );
  if (live) {
    return {
      active: true,
      source: 'stripe',
      plan: live.plan,
      billingCycle: live.billingCycle,
      status: live.status,
      currentPeriodEnd: live.currentPeriodEnd,
      cancelAtPeriodEnd: !!live.cancelAtPeriodEnd,
      stripeSubscriptionId: live.stripeSubscriptionId,
    };
  }
  if (company.manualAccessUntil && company.manualAccessUntil > now) {
    return {
      active: true,
      source: 'manual',
      plan: 'founding',
      billingCycle: null,
      status: 'active',
      currentPeriodEnd: company.manualAccessUntil,
      cancelAtPeriodEnd: false,
      stripeSubscriptionId: null,
    };
  }
  const latest = subs[0];
  return {
    active: false,
    source: null,
    plan: latest?.plan ?? null,
    billingCycle: latest?.billingCycle ?? null,
    status: latest?.status ?? null,
    currentPeriodEnd: latest?.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: !!latest?.cancelAtPeriodEnd,
    stripeSubscriptionId: latest?.stripeSubscriptionId ?? null,
  };
}

export const EMPLOYER_ERRORS: Record<Exclude<EmployerResolution, { ok: true }>['reason'], string> = {
  not_employer: 'Only company accounts can do this.',
  not_approved: 'Your company must be verified before you can do this.',
  email_unverified: 'Please sign out and sign in again to confirm your email address.',
  suspended: 'Your company account has been suspended. Contact info@the-nextrep.com.',
};
