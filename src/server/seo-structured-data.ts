/**
 * Server-side structured data (JSON-LD) and dynamic sitemap URLs.
 *
 * Job and event lists load in the browser, so crawlers would otherwise never
 * see them. Here we read the database at request time and put:
 *   /jobs?job=ID  → a JobPosting (what Google for Jobs reads)
 *   /jobs         → an ItemList of open roles
 *   /events       → an Event for each upcoming event
 * plus the job and event URLs for sitemap.xml.
 *
 * Every function swallows database errors and returns nothing, so SEO extras
 * can never break page rendering.
 */
import { and, asc, desc, eq, gte, isNull, or, sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { events, jobPosts, verifiedCompanies } from '@/server/db/schema';

const EMPLOYMENT_TYPE: Record<string, string> = {
  full_time: 'FULL_TIME',
  part_time: 'PART_TIME',
  contract: 'CONTRACTOR',
  internship: 'INTERN',
  skillbridge: 'INTERN',
};

/** JSON.stringify that is safe inside a <script> tag. */
function ld(data: unknown): string {
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

const activeJob = and(
  eq(jobPosts.status, 'active'),
  or(isNull(verifiedCompanies.blocked), eq(verifiedCompanies.blocked, false)),
  or(isNull(verifiedCompanies.postsPaused), eq(verifiedCompanies.postsPaused, false)),
);

function jobLocation(location: string | null) {
  if (!location) return undefined;
  const [city, region] = location.split(',').map((p) => p.trim());
  return {
    '@type': 'Place',
    address: { '@type': 'PostalAddress', addressLocality: city || location, ...(region ? { addressRegion: region } : {}), addressCountry: 'US' },
  };
}

async function jobPosting(base: string, jobId: number): Promise<{ head: string; title: string } | null> {
  const [row] = await db
    .select({ job: jobPosts, companyName: verifiedCompanies.legalName, website: verifiedCompanies.website })
    .from(jobPosts)
    .innerJoin(verifiedCompanies, eq(verifiedCompanies.id, jobPosts.companyId))
    .where(and(eq(jobPosts.id, jobId), activeJob))
    .limit(1);
  if (!row) return null;
  const { job } = row;
  const posted = job.postedAt ?? new Date();
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description.replace(/\n/g, '<br>'),
    datePosted: new Date(posted).toISOString(),
    employmentType: EMPLOYMENT_TYPE[job.jobType] ?? 'OTHER',
    hiringOrganization: { '@type': 'Organization', name: row.companyName, sameAs: row.website },
    url: `${base}/jobs?job=${job.id}`,
    identifier: { '@type': 'PropertyValue', name: 'REP | IV', value: String(job.id) },
    directApply: false,
  };
  if (job.applicationDeadline) data['validThrough'] = new Date(job.applicationDeadline).toISOString();
  if (job.isRemote) {
    data['jobLocationType'] = 'TELECOMMUTE';
    data['applicantLocationRequirements'] = { '@type': 'Country', name: 'USA' };
  }
  const loc = jobLocation(job.location);
  if (loc) data['jobLocation'] = loc;
  if (job.payRangeMin || job.payRangeMax) {
    data['baseSalary'] = {
      '@type': 'MonetaryAmount',
      currency: job.payCurrency || 'USD',
      value: {
        '@type': 'QuantitativeValue',
        ...(job.payRangeMin ? { minValue: job.payRangeMin } : {}),
        ...(job.payRangeMax ? { maxValue: job.payRangeMax } : {}),
        unitText: 'YEAR',
      },
    };
  }
  if (job.requiredSkills?.length) data['skills'] = job.requiredSkills.join(', ');
  if (job.industry) data['industry'] = job.industry;
  return { head: ld(data), title: `${job.title} at ${row.companyName}` };
}

async function jobListLd(base: string): Promise<string> {
  const rows = await db
    .select({ id: jobPosts.id, title: jobPosts.title })
    .from(jobPosts)
    .innerJoin(verifiedCompanies, eq(verifiedCompanies.id, jobPosts.companyId))
    .where(activeJob)
    .orderBy(desc(jobPosts.postedAt))
    .limit(100);
  if (rows.length === 0) return '';
  return ld({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Open roles on REP | IV',
    itemListElement: rows.map((r, i) => ({ '@type': 'ListItem', position: i + 1, url: `${base}/jobs?job=${r.id}`, name: r.title })),
  });
}

const liveEvent = and(eq(events.published, true), eq(events.status, 'approved'));

async function eventsLd(base: string): Promise<string> {
  const rows = await db
    .select()
    .from(events)
    .where(and(liveEvent, gte(sql`COALESCE(${events.endsAt}, ${events.startsAt})`, new Date())))
    .orderBy(asc(events.startsAt))
    .limit(50);
  return rows.map((ev) => {
    const virtual = { '@type': 'VirtualLocation', url: ev.registrationUrl || `${base}/events` };
    const place = { '@type': 'Place', name: ev.location || 'To be announced', address: ev.location || 'United States' };
    const data: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: ev.title,
      startDate: new Date(ev.startsAt).toISOString(),
      ...(ev.endsAt ? { endDate: new Date(ev.endsAt).toISOString() } : {}),
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: ev.format === 'virtual'
        ? 'https://schema.org/OnlineEventAttendanceMode'
        : ev.format === 'hybrid' ? 'https://schema.org/MixedEventAttendanceMode' : 'https://schema.org/OfflineEventAttendanceMode',
      location: ev.format === 'virtual' ? virtual : ev.format === 'hybrid' ? [place, virtual] : place,
      description: ev.description ?? `${ev.title} on REP | IV.`,
      organizer: { '@type': 'Organization', name: ev.hostName || 'REP | IV by The NextRep', url: base },
      url: `${base}/events`,
    };
    if (ev.registrationUrl) {
      data['offers'] = { '@type': 'Offer', url: ev.registrationUrl, availability: 'https://schema.org/InStock' };
    }
    return ld(data);
  }).join('');
}

/**
 * Extra <head> markup for the requested page, plus a page title override for
 * single-job URLs. Empty when not applicable.
 */
export async function structuredDataFor(base: string, path: string, query: Record<string, unknown>): Promise<{ head: string; title?: string }> {
  try {
    if (path === '/jobs') {
      const jobId = Number(query['job']);
      if (Number.isInteger(jobId) && jobId > 0) return (await jobPosting(base, jobId)) ?? { head: '' };
      return { head: await jobListLd(base) };
    }
    if (path === '/events') return { head: await eventsLd(base) };
  } catch (err) {
    console.error('[seo] structured data failed', err instanceof Error ? err.message : err);
  }
  return { head: '' };
}

/** Job URLs for sitemap.xml (empty on any database error). */
export async function dynamicSitemapUrls(base: string): Promise<{ loc: string; lastmod?: string }[]> {
  try {
    const jobs = await db
      .select({ id: jobPosts.id, updatedAt: jobPosts.updatedAt })
      .from(jobPosts)
      .innerJoin(verifiedCompanies, eq(verifiedCompanies.id, jobPosts.companyId))
      .where(activeJob)
      .orderBy(desc(jobPosts.postedAt))
      .limit(5000);
    return jobs.map((j) => ({
      loc: `${base}/jobs?job=${j.id}`,
      ...(j.updatedAt ? { lastmod: new Date(j.updatedAt).toISOString().slice(0, 10) } : {}),
    }));
  } catch (err) {
    console.error('[seo] sitemap jobs failed', err instanceof Error ? err.message : err);
    return [];
  }
}
