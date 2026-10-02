/**
 * Public, indexable pages for /sitemap.xml and /llms.txt. Edited by hand.
 * Only list pages a visitor can read without signing in; private pages
 * (dashboards, admin, checkout, auth forms) stay out and are disallowed in
 * robots.txt. Job and event URLs are added to the sitemap at request time.
 */

export interface SeoRoute {
  path: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: number;
  lastmod?: string;
}

export const seoRoutes: SeoRoute[] = [
  { path: "/", changefreq: "weekly", priority: 1.0 },
  { path: "/jobs", changefreq: "daily", priority: 0.9 },
  { path: "/athletes", changefreq: "monthly", priority: 0.9 },
  { path: "/coaches", changefreq: "monthly", priority: 0.9 },
  { path: "/veterans", changefreq: "monthly", priority: 0.9 },
  { path: "/for-companies", changefreq: "monthly", priority: 0.8 },
  { path: "/pricing", changefreq: "monthly", priority: 0.8 },
  { path: "/events", changefreq: "daily", priority: 0.8 },
  { path: "/resources", changefreq: "monthly", priority: 0.7 },
  { path: "/interview-tips", changefreq: "monthly", priority: 0.7 },
  { path: "/about", changefreq: "monthly", priority: 0.7 },
  { path: "/trust", changefreq: "monthly", priority: 0.6 },
  { path: "/community-rules", changefreq: "yearly", priority: 0.4 },
  { path: "/terms", changefreq: "yearly", priority: 0.3 },
  { path: "/privacy", changefreq: "yearly", priority: 0.3 },
];
