import type { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { emailVerifications, companyApplications } from '../../db/schema.js';
import { eq, and, gt, inArray, desc } from 'drizzle-orm';
import { extractDomain, extractWebsiteDomain, isCompanyDomainBlocked } from '../../lib/verify-helpers.js';

export default async function handler(req: Request, res: Response) {
  const body = req.body as {
    contactEmail?: string;
    legalName?: string;
    website?: string;
    linkedinPage?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    mainPhone?: string;
    contactName?: string;
    contactTitle?: string;
    contactPhone?: string;
    contactLinkedin?: string;
    orgType?: string;
    proofData?: unknown;
    staffingClientNames?: string;
    skillbridgePartnerName?: string;
    authorizationConfirmed?: boolean;
  };

  const required = ['contactEmail','legalName','website','contactName','contactTitle','orgType'];
  for (const field of required) {
    if (!body[field as keyof typeof body]) {
      res.status(400).json({ error: `Missing required field: ${field}` });
      return;
    }
  }

  if (!body.authorizationConfirmed) {
    res.status(400).json({ error: 'Authorization confirmation required.' });
    return;
  }

  const email = body.contactEmail!.trim().toLowerCase();
  const emailDomain = extractDomain(email);
  const websiteDomain = extractWebsiteDomain(body.website!);

  // Verify email was confirmed
  const verified = await db.select().from(emailVerifications)
    .where(and(
      eq(emailVerifications.email, email),
      eq(emailVerifications.verified, true),
      gt(emailVerifications.expiresAt, new Date(Date.now() - 1000 * 60 * 60 * 2)), // within 2h
    ))
    .limit(1);

  if (verified.length === 0) {
    res.status(400).json({ error: 'Email not verified. Complete Step 1 first.' });
    return;
  }

  // Check if company domain is blocked
  if (await isCompanyDomainBlocked(websiteDomain)) {
    res.status(400).json({ error: 'This company domain is not eligible to apply.', code: 'DOMAIN_BLOCKED' });
    return;
  }

  // Domain match check
  const domainMatch = emailDomain === websiteDomain || emailDomain.endsWith('.' + websiteDomain);
  const domainMismatchFlag = !domainMatch;

  const validOrgTypes = ['company','staffing_agency','high_school','college_university','club_academy','nonprofit','military_affiliated'];
  if (!validOrgTypes.includes(body.orgType!)) {
    res.status(400).json({ error: 'Invalid organization type.' });
    return;
  }

  // An application still under review (or waiting on more info) from this
  // email is updated in place rather than duplicated.
  const [open] = await db.select({ id: companyApplications.id }).from(companyApplications)
    .where(and(
      eq(companyApplications.contactEmail, email),
      inArray(companyApplications.status, ['pending_review', 'needs_info']),
    ))
    .orderBy(desc(companyApplications.id))
    .limit(1);

  const values = {
    contactEmail: email,
    emailVerified: true,
    legalName: body.legalName,
    website: body.website,
    linkedinPage: body.linkedinPage,
    addressLine1: body.addressLine1,
    addressLine2: body.addressLine2,
    city: body.city,
    state: body.state,
    postalCode: body.postalCode,
    country: body.country ?? 'US',
    mainPhone: body.mainPhone,
    contactName: body.contactName,
    contactTitle: body.contactTitle,
    contactPhone: body.contactPhone,
    contactLinkedin: body.contactLinkedin,
    orgType: body.orgType as 'company' | 'staffing_agency' | 'high_school' | 'college_university' | 'club_academy' | 'nonprofit' | 'military_affiliated',
    proofData: body.proofData as Record<string, unknown> ?? {},
    staffingClientNames: body.staffingClientNames,
    skillbridgePartnerName: body.skillbridgePartnerName,
    authorizationConfirmed: true,
    emailDomain,
    websiteDomain,
    domainMatch,
    domainMismatchFlag,
    status: 'pending_review' as const,
    submittedAt: new Date(),
  };

  let appId: number;
  if (open) {
    await db.update(companyApplications)
      .set({ ...values, needsInfoMessage: null })
      .where(eq(companyApplications.id, open.id));
    appId = open.id;
  } else {
    const result = await db.insert(companyApplications).values(values);
    appId = Number(result[0].insertId);
  }

  res.status(201).json({
    applicationId: appId,
    status: 'pending_review',
    domainMismatch: domainMismatchFlag,
    message: 'Under review. We\'ll email you within 1 business day.',
  });
}
