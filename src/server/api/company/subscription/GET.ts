/**
 * GET /api/company/subscription
 *
 * Billing status for the signed-in user's company. Returns 401 (with signedIn:false)
 * when not signed in, otherwise 200 with:
 *   { signedIn, isEmployer, verification, company, access }
 */
import type { Request, Response } from 'express';
import { getSessionUser, type SessionUser } from '@/server/middleware/auth-guards';
import { getCompanyAccess, resolveEmployerForUser } from '@/server/lib/company-access';

export default async function handler(req: Request, res: Response) {
  const user = (res.locals['sessionUser'] as SessionUser | undefined) ?? (await getSessionUser(req));
  if (!user) {
    res.status(401).json({
      signedIn: false,
      isEmployer: false,
      verification: 'not_employer',
      company: null,
      access: null,
    });
    return;
  }

  try {
    const r = await resolveEmployerForUser(user.id);
    if (!r.ok) {
      res.json({
        signedIn: true,
        isEmployer: r.reason !== 'not_employer',
        verification: r.reason,
        company: null,
        access: null,
      });
      return;
    }

    const access = await getCompanyAccess(r.company);
    res.json({
      signedIn: true,
      isEmployer: true,
      verification: 'approved',
      company: {
        id: r.company.id,
        legalName: r.company.legalName,
        missionDiscountUnlocked: !!r.company.missionDiscountUnlocked,
      },
      access,
    });
  } catch (err) {
    console.error('company subscription status error:', err);
    res.status(500).json({ error: 'Could not load billing status.' });
  }
}
