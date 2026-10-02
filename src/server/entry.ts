import express, { type Express, type NextFunction, type Request, type Response } from "express";
import { fileURLToPath } from "node:url";
import { dirname, extname, join } from "node:path";
import { readFileSync } from "node:fs";

// <api-imports>
import admin__company_applications__get from "./api/admin/company-applications/GET";
import admin__company_applications__id__approve__post from "./api/admin/company-applications/[id]/approve/POST";
import admin__company_applications__id__ask_info__post from "./api/admin/company-applications/[id]/ask-info/POST";
import admin__company_applications__id__reject__post from "./api/admin/company-applications/[id]/reject/POST";
import { requireAdmin, requireAuth } from "./middleware/auth-guards";
import profile__userId__get from "./api/profile/[userId]/GET";
import profile__me__put from "./api/profile/me/PUT";
import profile__me__photo__post from "./api/profile/me/photo/POST";
import profile__me__resume__post from "./api/profile/me/resume/POST";
import profile__me__resume__download__get from "./api/profile/me/resume/download/GET";
import connections__request__post from "./api/connections/request/POST";
import messages__get from "./api/messages/GET";
import messages__post from "./api/messages/POST";
import messages__unread__get from "./api/messages/unread/GET";
import messages__convId__get from "./api/messages/[conversationId]/GET";
import messages__convId__report__post from "./api/messages/[conversationId]/report/POST";
import messages__convId__block__post from "./api/messages/[conversationId]/block/POST";
import settings__message_notifications__get from "./api/settings/message-notifications/GET";
import settings__message_notifications__put from "./api/settings/message-notifications/PUT";
import admin__reported_conversations__get from "./api/admin/reported-conversations/GET";
import admin__reported_conversations__id__dismiss__post from "./api/admin/reported-conversations/[id]/dismiss/POST";
import admin__delete_test_data__post from "./api/admin/delete-test-data/POST";
import admin__send_reset__post from "./api/admin/send-reset/POST";
import connections__pending__get from "./api/connections/pending/GET";
import connections__id__accept__post from "./api/connections/[id]/accept/POST";
import connections__id__decline__post from "./api/connections/[id]/decline/POST";
import connections__id__delete from "./api/connections/[id]/DELETE";
import dashboard__summary__get from "./api/dashboard/summary/GET";
import company__dashboard__summary__get from "./api/company/dashboard/summary/GET";
import company__jobs__get from "./api/company/jobs/GET";
import company__candidates__get from "./api/company/candidates/GET";
import company__jobs__post from "./api/company/jobs/POST";
import company__jobs__id__put from "./api/company/jobs/[id]/PUT";
import company__jobs__id__delete from "./api/company/jobs/[id]/DELETE";
import connections__status__recipientId__get from "./api/connections/status/[recipientId]/GET";
import auth__action__get from "./api/auth/[action]/GET";
import auth__action__post from "./api/auth/[action]/POST";
import auth__action__detail__get from "./api/auth/[action]/[detail]/GET";
import auth__action__detail__post from "./api/auth/[action]/[detail]/POST";
import company__subscription__get from "./api/company/subscription/GET";
import stripe__portal__post from "./api/stripe/portal/POST";
import profile__userId__resume__get from "./api/profile/[userId]/resume/GET";
import { serveProfilePhoto } from "./lib/storage";
import admin__overview__get from "./api/admin/overview/GET";
import admin__companies__get from "./api/admin/companies/GET";
import admin__companies__id__suspend__post from "./api/admin/companies/[id]/suspend/POST";
import admin__companies__id__reinstate__post from "./api/admin/companies/[id]/reinstate/POST";
import admin__companies__id__access__post from "./api/admin/companies/[id]/access/POST";
import admin__members__get from "./api/admin/members/GET";
import admin__members__id__suspend__post from "./api/admin/members/[id]/suspend/POST";
import admin__members__id__reinstate__post from "./api/admin/members/[id]/reinstate/POST";
import admin__company_reports__get from "./api/admin/company-reports/GET";
import admin__company_reports__id__resolve__post from "./api/admin/company-reports/[id]/resolve/POST";
import admin__activity__get from "./api/admin/activity/GET";
import { listPublicEvents, listAdminEvents, createEvent, updateEvent, deleteEvent, approveEvent, rejectEvent, sendFeaturedEmail } from "./api/events/handlers";
import { listCompanyEvents, submitCompanyEvent, updateCompanyEvent, payCompanyEvent, confirmCompanyEventPayment, deleteCompanyEvent } from "./api/company/events/handlers";
import company_applications__post from "./api/company-applications/POST";
import company_reports__post from "./api/company-reports/POST";
import health__get from "./api/health/GET";
import jobs__get from "./api/jobs/GET";
import jobs__id__get from "./api/jobs/[id]/GET";
import { listSavedJobs, listSavedJobIds, saveJob, unsaveJob } from "./api/saved-jobs/handlers";
import { getMyResume, saveMyResume } from "./api/resume-builder/handlers";
import scam_check__post from "./api/scam-check/POST";
import stripe__create_checkout_session__post from "./api/stripe/create-checkout-session/POST";
import stripe__session__sessionId__get from "./api/stripe/session/[sessionId]/GET";
import stripe__switch_to_yearly__post from "./api/stripe/switch-to-yearly/POST";
import stripe__webhook__post from "./api/stripe/webhook/POST";
import verify__confirm_code__post from "./api/verify/confirm-code/POST";
import verify__send_code__post from "./api/verify/send-code/POST";
import signup_profile__post from "./api/auth/signup-profile/POST";
import auth__me__get from "./api/auth/me/GET";
import auth__login__post from "./api/auth/login/POST";
import auth__verify_2fa__post from "./api/auth/verify-2fa/POST";
import auth__resend_2fa__post from "./api/auth/resend-2fa/POST";
import auth__forgot_password__post from "./api/auth/forgot-password/POST";
import auth__reset_password__post from "./api/auth/reset-password/POST";
// </api-imports>
import { seoRoutes } from "../lib/seo-routes";
import { IS_DRAFT } from "../lib/site-meta";
import { structuredDataFor, dynamicSitemapUrls } from "./seo-structured-data";
import {
	loadAdSenseRuntimeConfig,
	resolveAdSenseTextFile,
	type AdSenseRuntimeConfig,
} from "./adsense-manifest";
import { loadIndexNowKey } from "./indexnow-key";
import { isSystemHost } from "./seo-host";
import { llmsTxtHandler } from "./llms-txt";

export interface SsrRenderResult {
	html: string;
	head: string;
	status: number;
	redirect?: string;
}

export function registerAdSenseTextRoutes(app: Express, config: AdSenseRuntimeConfig): void {
	app.get("/ads.txt", (_req, res) => {
		const content = resolveAdSenseTextFile(config, "adsTxt");
		if (content === null) {
			res
				.status(404)
				.type("text/plain")
				.set("Cache-Control", "no-cache")
				.send("Not found\n");
			return;
		}
		res.type("text/plain").set("Cache-Control", "no-cache").send(content);
	});

	app.get("/app-ads.txt", (_req, res) => {
		const content = resolveAdSenseTextFile(config, "appAdsTxt");
		if (content === null) {
			res
				.status(404)
				.type("text/plain")
				.set("Cache-Control", "no-cache")
				.send("Not found\n");
			return;
		}
		res.type("text/plain").set("Cache-Control", "no-cache").send(content);
	});
}

export function renderSsrDocument(
	template: string,
	result: Pick<SsrRenderResult, "head" | "html">,
	adSenseConfig: Pick<AdSenseRuntimeConfig, "scriptHtml">,
): string {
	const head = [result.head, adSenseConfig.scriptHtml].filter(Boolean).join("\n");
	return template
		.replace("<!--app-head-->", () => head)
		.replace("<!--app-html-->", () => result.html);
}


const app = express();

// Honour x-forwarded-* from the load balancer so req.protocol/req.hostname
// reflect the public-facing values. Express-maintained parsing respects the
// existing trust-proxy config; direct header reads would let a client spoof
// the sitemap origin in robots.txt.
app.set("trust proxy", true);

app.disable("x-powered-by");

// Permanent redirect from old/alternate domains to the main one, set with
// CANONICAL_HOST (e.g. www.nextrep.jobs). Railway's own *.up.railway.app host,
// localhost and /api/* (Stripe webhooks, health checks) are never redirected.
app.use((req, res, next) => {
	const canonical = process.env.CANONICAL_HOST?.trim().toLowerCase();
	if (!canonical || req.path.startsWith("/api/") || isSystemHost(req)) return next();
	if (req.hostname.toLowerCase() === canonical) return next();
	res.redirect(301, `https://${canonical}${req.originalUrl}`);
});

// Basic security headers for every response.
app.use((_req, res, next) => {
	res.set("X-Content-Type-Options", "nosniff");
	res.set("X-Frame-Options", "SAMEORIGIN");
	res.set("Referrer-Policy", "strict-origin-when-cross-origin");
	res.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
	if (process.env.NODE_ENV === "production") {
		res.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
	}
	next();
});

// Stripe needs the raw request body to verify webhook signatures, so this
// route is registered before the JSON body parser.
app.post("/api/stripe/webhook", express.raw({ type: "application/json", limit: "1mb" }), stripe__webhook__post);

// Profile photos uploaded by members (stored under UPLOAD_DIR).
app.get("/uploads/profile-photos/:file", serveProfilePhoto);

// Photo (5 MB) and résumé (10 MB) uploads arrive base64-encoded in JSON.
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// <api-registrations>
app.get("/api/admin/company-applications", requireAdmin, admin__company_applications__get);
app.post("/api/admin/company-applications/:id/approve", requireAdmin, admin__company_applications__id__approve__post);
app.post("/api/admin/company-applications/:id/ask-info", requireAdmin, admin__company_applications__id__ask_info__post);
app.post("/api/admin/company-applications/:id/reject", requireAdmin, admin__company_applications__id__reject__post);
// Specific /api/auth/* routes must come before the :action wildcard
app.get("/api/auth/me", auth__me__get);
app.post("/api/auth/login", auth__login__post);
app.post("/api/auth/verify-2fa", auth__verify_2fa__post);
app.post("/api/auth/resend-2fa", auth__resend_2fa__post);
app.post("/api/auth/forgot-password", auth__forgot_password__post);
app.post("/api/auth/reset-password", auth__reset_password__post);
app.post("/api/auth/signup-profile", signup_profile__post);
app.get("/api/auth/:action", auth__action__get);
app.post("/api/auth/:action", auth__action__post);
app.get("/api/auth/:action/:detail", auth__action__detail__get);
app.post("/api/auth/:action/:detail", auth__action__detail__post);
app.get("/api/company/subscription", company__subscription__get);
app.post("/api/company-applications", company_applications__post);
app.post("/api/company-reports", requireAuth, company_reports__post);
app.get("/api/health", health__get);
app.get("/api/jobs", jobs__get);
app.get("/api/jobs/:id", jobs__id__get);
// Saved jobs (members only; /ids before /:jobId)
app.get("/api/saved-jobs", requireAuth, listSavedJobs);
app.get("/api/saved-jobs/ids", requireAuth, listSavedJobIds);
app.post("/api/saved-jobs/:jobId", requireAuth, saveJob);
app.delete("/api/saved-jobs/:jobId", requireAuth, unsaveJob);
// Résumé builder (members only)
app.get("/api/resume-builder", requireAuth, getMyResume);
app.put("/api/resume-builder", requireAuth, saveMyResume);
app.post("/api/scam-check", scam_check__post);
app.post("/api/stripe/create-checkout-session", requireAuth, stripe__create_checkout_session__post);
app.get("/api/stripe/session/:sessionId", requireAuth, stripe__session__sessionId__get);
app.post("/api/stripe/switch-to-yearly", requireAuth, stripe__switch_to_yearly__post);
app.post("/api/stripe/portal", requireAuth, stripe__portal__post);
app.post("/api/verify/confirm-code", verify__confirm_code__post);
app.post("/api/verify/send-code", verify__send_code__post);
// Profile routes (me before :userId to avoid wildcard collision)
app.put("/api/profile/me", requireAuth, profile__me__put);
app.post("/api/profile/me/photo", requireAuth, profile__me__photo__post);
app.get("/api/profile/me/resume/download", requireAuth, profile__me__resume__download__get);
app.post("/api/profile/me/resume", requireAuth, profile__me__resume__post);
app.get("/api/profile/:userId/resume", requireAuth, profile__userId__resume__get);
app.get("/api/profile/:userId", profile__userId__get);
// Dashboard
app.get("/api/dashboard/summary", requireAuth, dashboard__summary__get);
app.get("/api/company/dashboard/summary", requireAuth, company__dashboard__summary__get);
app.get("/api/company/jobs", requireAuth, company__jobs__get);
app.get("/api/company/candidates", requireAuth, company__candidates__get);
app.post("/api/company/jobs", requireAuth, company__jobs__post);
app.put("/api/company/jobs/:id", requireAuth, company__jobs__id__put);
app.delete("/api/company/jobs/:id", requireAuth, company__jobs__id__delete);
// Messaging routes (unread before :conversationId wildcard)
app.get("/api/messages", requireAuth, messages__get);
app.post("/api/messages", requireAuth, messages__post);
app.get("/api/messages/unread", requireAuth, messages__unread__get);
app.get("/api/messages/:conversationId", requireAuth, messages__convId__get);
app.post("/api/messages/:conversationId/report", requireAuth, messages__convId__report__post);
app.post("/api/messages/:conversationId/block", requireAuth, messages__convId__block__post);
// Settings
app.get("/api/settings/message-notifications", requireAuth, settings__message_notifications__get);
app.put("/api/settings/message-notifications", requireAuth, settings__message_notifications__put);
// Admin reported conversations
app.get("/api/admin/reported-conversations", requireAdmin, admin__reported_conversations__get);
app.post("/api/admin/reported-conversations/:id/dismiss", requireAdmin, admin__reported_conversations__id__dismiss__post);
app.post("/api/admin/delete-test-data", requireAdmin, admin__delete_test_data__post);
app.post("/api/admin/send-reset", requireAdmin, admin__send_reset__post);
app.get("/api/admin/overview", requireAdmin, admin__overview__get);
app.get("/api/admin/companies", requireAdmin, admin__companies__get);
app.post("/api/admin/companies/:id/suspend", requireAdmin, admin__companies__id__suspend__post);
app.post("/api/admin/companies/:id/reinstate", requireAdmin, admin__companies__id__reinstate__post);
app.post("/api/admin/companies/:id/access", requireAdmin, admin__companies__id__access__post);
app.get("/api/admin/members", requireAdmin, admin__members__get);
app.post("/api/admin/members/:id/suspend", requireAdmin, admin__members__id__suspend__post);
app.post("/api/admin/members/:id/reinstate", requireAdmin, admin__members__id__reinstate__post);
app.get("/api/admin/company-reports", requireAdmin, admin__company_reports__get);
app.post("/api/admin/company-reports/:id/resolve", requireAdmin, admin__company_reports__id__resolve__post);
app.get("/api/admin/activity", requireAdmin, admin__activity__get);
app.get("/api/events", listPublicEvents);
app.get("/api/admin/events", requireAdmin, listAdminEvents);
app.post("/api/admin/events", requireAdmin, createEvent);
app.put("/api/admin/events/:id", requireAdmin, updateEvent);
app.delete("/api/admin/events/:id", requireAdmin, deleteEvent);
app.post("/api/admin/events/:id/approve", requireAdmin, approveEvent);
app.post("/api/admin/events/:id/reject", requireAdmin, rejectEvent);
app.post("/api/admin/events/:id/send-featured-email", requireAdmin, sendFeaturedEmail);
app.get("/api/company/events", requireAuth, listCompanyEvents);
app.post("/api/company/events", requireAuth, submitCompanyEvent);
app.put("/api/company/events/:id", requireAuth, updateCompanyEvent);
app.post("/api/company/events/:id/pay", requireAuth, payCompanyEvent);
app.post("/api/company/events/:id/confirm", requireAuth, confirmCompanyEventPayment);
app.delete("/api/company/events/:id", requireAuth, deleteCompanyEvent);
// Connection routes
app.post("/api/connections/request", requireAuth, connections__request__post);
app.get("/api/connections/pending", requireAuth, connections__pending__get);
app.post("/api/connections/:id/accept", requireAuth, connections__id__accept__post);
app.post("/api/connections/:id/decline", requireAuth, connections__id__decline__post);
app.delete("/api/connections/:id", requireAuth, connections__id__delete);
app.get("/api/connections/status/:recipientId", requireAuth, connections__status__recipientId__get);
// </api-registrations>

// Error middleware must be registered AFTER the routes it protects; Express
// only passes errors to middleware defined later in the stack.
app.use("/api", (err: unknown, req: Request, res: Response, _next: NextFunction) => {
	// Always respond JSON on /api so clients parsing response.json() don't
	// receive Express's default HTML error page for non-Error throws.
	console.error("ssr.api.error", {
		url: req.url,
		error: err instanceof Error ? err.stack : String(err),
	});
	res.status(500).json({ error: "Internal server error" });
});

function baseUrl(req: Request): string {
	return `${req.protocol}://${req.hostname}`;
}

function escapeXml(s: string): string {
	return s.replace(/[&<>"']/g, (c) =>
		({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!,
	);
}

app.get("/robots.txt", (req, res) => {
	if (IS_DRAFT || isSystemHost(req)) {
		res
			.type("text/plain")
			.set("Cache-Control", "public, max-age=60, must-revalidate").set("Vary", "Host")
			.send("User-agent: *\nDisallow: /\n");
		return;
	}
	const base = baseUrl(req);
	const body = [
		"User-agent: *",
		"Allow: /",
		// Private and account pages: nothing useful for search, and noindexed anyway.
		"Disallow: /api/",
		"Disallow: /admin",
		"Disallow: /dashboard",
		"Disallow: /company/",
		"Disallow: /messages",
		"Disallow: /settings",
		"Disallow: /profile/",
		"Disallow: /checkout/",
		"Disallow: /saved-jobs",
		"Disallow: /resume-builder",
		"Disallow: /reset-password",
		"Disallow: /verify-company/details",
		"",
		`Sitemap: ${base}/sitemap.xml`,
		"",
	].join("\n");
	res.type("text/plain").set("Cache-Control", "public, max-age=60, must-revalidate").set("Vary", "Host").send(body);
});

app.get("/sitemap.xml", async (req, res) => {
	if (isSystemHost(req)) {
		const empty = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>\n`;
		res.type("application/xml").set("Cache-Control", "public, max-age=60, must-revalidate").set("Vary", "Host").send(empty);
		return;
	}
	const base = baseUrl(req);
	const urls = seoRoutes
		.filter((r) => typeof r.path === "string" && r.path.startsWith("/"))
		.map((r) => {
			const loc = `${base}${r.path}`;
			const parts = [`    <loc>${escapeXml(loc)}</loc>`];
			if (r.lastmod) parts.push(`    <lastmod>${escapeXml(r.lastmod)}</lastmod>`);
			if (r.changefreq) parts.push(`    <changefreq>${r.changefreq}</changefreq>`);
			if (r.priority !== undefined)
				parts.push(`    <priority>${r.priority.toFixed(1)}</priority>`);
			return `  <url>\n${parts.join("\n")}\n  </url>`;
		})
		.join("\n");
	const dynamic = (await dynamicSitemapUrls(base))
		.map((u) => `  <url>\n    <loc>${escapeXml(u.loc)}</loc>${u.lastmod ? `\n    <lastmod>${escapeXml(u.lastmod)}</lastmod>` : ""}\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`)
		.join("\n");
	const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}${dynamic ? `\n${dynamic}` : ""}\n</urlset>\n`;
	res.type("application/xml").set("Cache-Control", "public, max-age=60, must-revalidate").set("Vary", "Host").send(body);
});

app.get("/llms.txt", llmsTxtHandler);

if (import.meta.env.PROD) {
	const __dirname = dirname(fileURLToPath(import.meta.url));
	const clientDir = join(__dirname, "client");
	const adSenseRuntimeConfig = loadAdSenseRuntimeConfig(__dirname);
	const indexNowKey = loadIndexNowKey(__dirname);

	registerAdSenseTextRoutes(app, adSenseRuntimeConfig);

	if (indexNowKey !== null) {
		app.get(`/${indexNowKey}.txt`, (_req, res) => {
			res.type("text/plain").set("Cache-Control", "public, max-age=86400").send(indexNowKey);
		});
	}

	app.use(
		express.static(clientDir, {
			index: false,
			setHeaders(res, filePath) {
				res.set(
					"Cache-Control",
					filePath.includes("/assets/")
						? "public, max-age=31536000, immutable"
						: "no-cache",
				);
			},
		}),
	);

	app.use((_req, res, next) => {
		res.set("Cache-Control", "no-cache");
		next();
	});

	let template: string;
	try {
		template = readFileSync(join(clientDir, "index.html"), "utf-8");
	} catch (err) {
		console.error("ssr.template.load-failed", {
			path: join(clientDir, "index.html"),
			error: err instanceof Error ? err.message : String(err),
		});
		process.exit(1);
	}
	if (!template.includes("<!--app-head-->") || !template.includes("<!--app-html-->")) {
		// Fail fast at boot, same as a template load failure above: without
		// markers, every .replace() call on the render path is a no-op and we
		// would serve a shell with no <head> content and no rendered body on
		// every request. Preferring process.exit over a degraded mode ensures
		// an operator notices and fixes the build rather than serving broken
		// SEO-invisible pages indefinitely.
		console.error("ssr.template.markers-missing", {
			hasHead: template.includes("<!--app-head-->"),
			hasHtml: template.includes("<!--app-html-->"),
		});
		process.exit(1);
	}
	const fallbackShell = template
		.replace("<!--app-head-->", "")
		.replace("<!--app-html-->", "");

	// Resolve the SSR module once into a stable render function. A failed
	// load is unrecoverable at runtime - exiting lets the container
	// scheduler restart with a clean slate rather than leaving the server
	// to serve silent 503s indefinitely against a single startup log.
	let renderFn: ((url: string, siteOrigin?: string) => Promise<SsrRenderResult>) | null = null;
	const SSR_MODULE_LOAD_TIMEOUT_MS = 30_000;
	const loadTimeout = setTimeout(() => {
		if (renderFn !== null) return;
		console.error("ssr.module.load-timeout", {
			timeoutMs: SSR_MODULE_LOAD_TIMEOUT_MS,
		});
		process.exit(1);
	}, SSR_MODULE_LOAD_TIMEOUT_MS);
	loadTimeout.unref();
	import("../entry-server").then(
		(mod) => {
			clearTimeout(loadTimeout);
			renderFn = mod.render;
		},
		(err) => {
			clearTimeout(loadTimeout);
			console.error("ssr.module.load-failed", {
				error: err instanceof Error ? err.stack : String(err),
			});
			process.exit(1);
		},
	);

	app.get(/.*/, async (req, res, next) => {
		if (req.method !== "GET") return next();
		if (req.path.startsWith("/api")) return next();
		if (extname(req.path)) return next();
		const sendFallback = () =>
			res
				.status(503)
				.set("Content-Type", "text/html; charset=utf-8")
				.set("Cache-Control", "no-store")
				.send(fallbackShell);
		if (renderFn === null) {
			// Module not yet resolved; fall back without logging to avoid startup
			// noise before the first render is even possible. A terminal load
			// failure (import reject or 30s timeout) process.exit(1)s from the
			// loader above, so this branch is only the brief warmup window.
			return sendFallback();
		}
		try {
			const result = await renderFn(
				req.url,
				`${req.protocol}://${req.hostname}`,
			);
			if (result.redirect) {
				// Redirect thrown from a loader/action surfaces as a Response.
				// Forward it so the browser actually navigates to the new URL
				// instead of seeing an empty shell with a stale status.
				res.redirect(result.status, result.redirect);
				return;
			}
			if (!result.html) {
				// A non-redirect Response was thrown from a loader (e.g.
				// `throw new Response(null, { status: 404 })`). renderToString
				// produced no markup, so we have a real status but no body.
				// Log so the case is observable in ops dashboards, and mark
				// no-store so CDNs don't cache an empty page as a valid hit.
				// User-visible 404 / error pages should come from a route
				// errorElement, not from this fallback path.
				console.error("ssr.render.error-response", {
					url: req.url,
					status: result.status,
				});
				res
					.status(result.status)
					.set("Content-Type", "text/html; charset=utf-8")
					.set("Cache-Control", "no-store")
					.send(fallbackShell);
				return;
			}
			// Per-host SEO injection. System URLs get a noindex meta so
			// crawlers drop them from the index over time; customer-attached
			// hosts get a self-canonical link so search engines treat them
			// as authoritative for the rendered content.
			// Pages that set their own canonical (via Helmet) keep it; a second
			// canonical tag makes search engines ignore both. Production is
			// always https even if the proxy hop reports http.
			const origin = `${process.env.NODE_ENV === "production" ? "https" : req.protocol}://${req.hostname}`;
			const jobId = req.path === "/jobs" && typeof req.query["job"] === "string" && /^\d{1,10}$/.test(req.query["job"]) ? req.query["job"] : null;
			const canonicalUrl = `${origin}${req.path}${jobId ? `?job=${jobId}` : ""}`;
			let pageHead = result.head;
			if (jobId) {
				// Each job gets its own canonical URL so Google for Jobs can index it.
				pageHead = pageHead.replace(/<link[^>]*rel="canonical"[^>]*>/g, "");
			}
			const hasCanonical = /rel="canonical"/.test(pageHead);
			const extra = isSystemHost(req)
				? { head: "" }
				: await structuredDataFor(origin, req.path, req.query as Record<string, unknown>);
			if (extra.title) {
				// e.g. "Sales Associate at Acme — NORVARDEN" instead of the generic jobs title.
				const t = escapeXml(`${extra.title} — NORVARDEN`);
				pageHead = pageHead
					.replace(/<title[^>]*>[\s\S]*?<\/title>/, `<title>${t}</title>`)
					.replace(/(<meta[^>]*property="og:title"[^>]*content=")[^"]*(")/, `$1${t}$2`);
			}
			const seoHead = isSystemHost(req)
				? `<meta name="robots" content="noindex,nofollow">`
				: (hasCanonical ? "" : `<link rel="canonical" href="${escapeXml(canonicalUrl)}">`) + extra.head;
			// Function replacements disable String.replace's $-special sequences
			// ($&, $', $`, $$) so user-authored titles / JSON-LD like
			// "Save $& today" insert literally instead of being interpolated.
			const out = renderSsrDocument(
				template,
				{ ...result, head: seoHead + pageHead },
				adSenseRuntimeConfig,
			);
			res
				.status(result.status)
				.set("Content-Type", "text/html; charset=utf-8")
				.set("Cache-Control", "no-cache")
				.send(out);
		} catch (err) {
			// 503 surfaces the failure in CDN/monitoring without caching a broken
			// page as success. console.error (not warn) puts it at the right log
			// level for the observability pipeline to alert on.
			console.error("ssr.render.failed", {
				url: req.url,
				// Log the full stack — React's renderToString annotates it with
				// the failing component's call tree, which the message alone
				// discards.
				error: err instanceof Error ? err.stack : String(err),
			});
			sendFallback();
		}
	});

	const shutdown = async (signal: string) => {
		console.log(`Got ${signal}, shutting down gracefully...`);
		// Scope the ERR_MODULE_NOT_FOUND suppression to the import() only.
		// A closeConnection() failure that happens to carry the same code
		// (unlikely but possible for wrapped errors) must not be silently
		// swallowed - it indicates a real db-close failure worth logging.
		let mod: { closeConnection?: () => Promise<void> | void } | null = null;
		try {
			const dbClient = "./db/client" + ".js";
			// Source-literal optional module path; no request, environment, or user input reaches import().
			// eslint-disable-next-line no-unsanitized/method
			mod = await import(/* @vite-ignore */ dbClient);
		} catch (error: unknown) {
			const code = (error as { code?: string } | null)?.code;
			if (code !== "ERR_MODULE_NOT_FOUND") {
				console.error("ssr.shutdown.db-import-failed", {
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}
		if (mod && typeof mod.closeConnection === "function") {
			try {
				await mod.closeConnection();
				console.log("Database connections closed");
			} catch (error: unknown) {
				console.error("ssr.shutdown.db-close-failed", {
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}
		process.exit(0);
	};

	(["SIGTERM", "SIGINT"] as const).forEach((signal) => {
		process.once(signal, () => {
			void shutdown(signal);
		});
	});

	const rawPort = process.env.PORT || "3000";
	const port = parseInt(rawPort, 10);
	if (!Number.isInteger(port) || port <= 0 || port > 65535) {
		// parseInt("abc") returns NaN; passing that to app.listen throws
		// synchronously before the server.on("error") handler below can catch
		// it. Fail fast with an actionable log rather than a cryptic crash.
		console.error("ssr.server.invalid-port", { rawPort });
		process.exit(1);
	}
	const host = process.env.HOST || "0.0.0.0";
	const server = app.listen(port, host, () => {
		console.log(`Server listening on http://${host}:${port}`);
	});
	server.on("error", (err: NodeJS.ErrnoException) => {
		console.error("ssr.server.listen-failed", {
			port,
			host,
			code: err.code,
			error: err.message,
		});
		process.exit(1);
	});
}

export default app;
