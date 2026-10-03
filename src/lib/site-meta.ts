export interface SiteMeta {
	name: string;
	summary: string;
}

export const siteMeta: SiteMeta = {
	name: "NORVARDEN",
	summary: "An accessible, verified career platform connecting people with disabilities to inclusive employers.",
};

/**
 * Draft mode: the site is a client preview. While true, every page is
 * noindex and robots.txt blocks all crawlers. Set to false at launch.
 */
export const IS_DRAFT = true;

/**
 * Paid plans and fees. While false, no prices or plans are shown anywhere and
 * every verified employer gets full access (unlimited jobs, free events).
 * Turn on once the client settles pricing.
 */
export const PRICING_ENABLED = false;
