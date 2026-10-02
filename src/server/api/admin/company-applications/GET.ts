import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { companyApplications } from '../../../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { requireAdmin } from '../../../middleware/auth-guards.js';

export { requireAdmin as middleware };

export default async function handler(req: Request, res: Response) {

  const STATUSES = ['pending_review', 'needs_info', 'approved', 'rejected', 'draft', 'pending_email'] as const;
  const rawStatus = typeof req.query['status'] === 'string' ? req.query['status'] : '';
  const status = (STATUSES as readonly string[]).includes(rawStatus) ? (rawStatus as typeof STATUSES[number]) : null;

  const rows = await db.select().from(companyApplications)
    .where(status ? eq(companyApplications.status, status) : undefined)
    .orderBy(desc(companyApplications.submittedAt));

  // Build admin-friendly rows with lookup links
  const enriched = rows.map((app: typeof rows[number]) => ({
    ...app,
    lookupLinks: buildLookupLinks(app),
  }));

  res.json({ applications: enriched, total: enriched.length });
}

function buildLookupLinks(app: {
  orgType: string | null;
  website: string | null;
  linkedinPage: string | null;
  proofData: unknown;
  websiteDomain: string | null;
}) {
  const links: { label: string; url: string }[] = [];

  if (app.website) links.push({ label: 'Company website', url: app.website });
  if (app.linkedinPage) links.push({ label: 'LinkedIn page', url: app.linkedinPage });

  const proof = app.proofData as Record<string, string> | null ?? {};

  switch (app.orgType) {
    case 'company':
    case 'staffing_agency': {
      if (proof['registrationState']) {
        links.push({ label: 'State business search', url: `https://www.google.com/search?q=${encodeURIComponent(app.websiteDomain + ' business registration ' + proof['registrationState'])}` });
      }
      if (proof['uei']) {
        links.push({ label: 'SAM.gov UEI lookup', url: `https://sam.gov/entity/${proof['uei']}` });
      }
      break;
    }
    case 'nonprofit': {
      if (proof['ein']) {
        links.push({ label: 'IRS Tax Exempt Search', url: `https://apps.irs.gov/app/eos/` });
      }
      break;
    }
    case 'high_school': {
      if (proof['ncesId']) {
        links.push({ label: 'NCES School Search', url: `https://nces.ed.gov/ccd/schoolsearch/` });
      }
      break;
    }
    case 'club_academy': {
      if (proof['governingBodyUrl']) {
        links.push({ label: 'Governing body listing', url: proof['governingBodyUrl'] });
      }
      break;
    }
  }

  return links;
}
