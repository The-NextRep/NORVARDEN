# REP | IV (by The NextRep)

## Project
- Live: https://jobs.the-nextrep.com (also https://the-board-production-ffa8.up.railway.app). Brand: REP | IV (split-badge logo: REP in gold, IV on gold block — `src/components/BrandMark.tsx`), tagline "Built For The NextRep" (capital N and R). Formerly "The Board". DNS: CNAME `jobs` → Railway in GoDaddy.
- Stack: React 19 + Vite SSR, Express 5 API (routes registered by hand in `src/server/entry.ts`), Drizzle ORM on MySQL 8, better-auth, Stripe subscriptions, Resend email. See README.md.
- Hosting: Railway project "House Of IRL" → services `the-board` (web, auto-deploys on every push to `main`, volume at `/data`) and `MySQL`. Pushing to `main` publishes the site.
- Stripe is LIVE (The NextRep account, a DBA of C2A Defense Strategies, LLC). Plans: Scout / Partner, quarterly + annual. Coupons: FOUNDING10 (50% off first year, first 10), MISSION30. Webhook: `/api/stripe/webhook`.
- Users: members (athletes — current/former pro only — coaches, veterans) are free; employers are verified companies that pay. Contact details are shared only after a member accepts a company's request.
- Admin sign-in: emailed 6-digit code to info@the-nextrep.com.
- Recent features: saved jobs, résumé builder, interview tips, navy/gold pricing page, Terms (Texas law; cancel anytime, no partial refunds), candidate search, Resources, About (founder bio), Events (admin + company-hosted with Stripe one-time fees: no plan $750 standard / $1,500 featured; Scout 1 standard/quarter then $500, featured $500; Partner unlimited standard + 1 featured/quarter then $500; MISSION30 applies), job post limits (Scout 5 active, Partner 20, Founding unlimited), server-side SEO (JobPosting/Event JSON-LD, sitemap with jobs).

## Commands
- `npm run build`, `npm test`, `npm run lint`
- `npm run db:push` — sync schema to MySQL
- `npm run create-admin -- <email>`, `npm run remove-account -- <email>`

## How to work with the owner
- The owner runs three companies: do the work end to end. Build, test, and push to `main` yourself.
- Only ask for things that need their logins (Stripe, Railway, GoDaddy, Resend), and give short numbered click-by-click steps.
- Never ask them to paste secret keys into chat.
- After any change to `src/server/db/schema.ts`, tell them to run `npm run db:push` in Railway → the-board → Console (the pre-deploy hook may not run it).
- Keep replies brief.
