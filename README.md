# REP | IV — by The NextRep

Career board for current and former pro athletes, coaches and military
veterans. Verified companies pay (Stripe) to post jobs and connect.

Stack: React 19 + Vite (server-side rendered), Express 5 API, MySQL 8 via
Drizzle ORM, better-auth sessions, Resend email, Stripe subscriptions.

## Run locally

```bash
cp env.example .env        # fill in DATABASE_URL and BETTER_AUTH_SECRET at minimum
npm ci
npm run db:push            # create/update tables
npm run build && npm start # http://localhost:3000
```

Without `RESEND_API_KEY` (and with `NODE_ENV` not set to production) emails —
sign-in codes, reset links — are printed to the server log instead of sent.

## Deploy (Railway)

1. New project → Deploy from GitHub repo → add a **MySQL** database.
2. Add a **volume** to the web service mounted at `/data` (profile photos and résumés).
3. Set the variables from `env.example` on the web service
   (`DATABASE_URL=${{MySQL.MYSQL_URL}}`, `UPLOAD_DIR=/data/uploads`, …).
4. `railway.json` builds with `npm run build`, runs `npm run db:push` before each
   deploy, starts with `npm start`, and health-checks `/api/health`.
5. Custom domain: add `jobs.the-nextrep.com` in Railway → add the CNAME it shows
   in GoDaddy DNS.
6. Stripe → Developers → Webhooks → endpoint `https://jobs.the-nextrep.com/api/stripe/webhook`,
   events: `checkout.session.completed`, `customer.subscription.created`,
   `customer.subscription.updated`, `customer.subscription.deleted`,
   `invoice.paid`, `invoice.payment_failed`. Put its signing secret in
   `STRIPE_WEBHOOK_SECRET`.
7. Resend → add domain `the-nextrep.com` → add the DNS records it shows in GoDaddy
   → create an API key → `RESEND_API_KEY`.

## First admin

Sign up on the site normally, then run once (with the production `DATABASE_URL`):

```bash
npm run create-admin -- you@example.com
```

Admins sign in with an emailed 6-digit code. `SKIP_ADMIN_2FA=true` turns that
off temporarily — leave it unset in production.

## How access works

- **Members** (athlete / coach / veteran) join free.
- **Companies** sign up as employers, verify their work email by code, apply,
  and are approved by an admin. A company account is tied to the approved
  application's contact email, and the user must have proven they own that
  inbox (emailed sign-in code, verification code or reset link).
- Posting jobs and sending connection requests require an **active plan**:
  a live Stripe subscription, or admin-granted access (Admin → Companies →
  access date, for Founding partners billed by invoice).
- Member contact details (email, phone, résumé) are shown to a company only
  after the member accepts its connection request. Declines show as
  "Not available"; re-requests are blocked for 30 days.
- Discounts: `FOUNDING10` = 50% off the first 12 months, first 10 companies
  (Stripe coupon `FOUNDING10`). Mission discount = 30% forever for companies an
  admin marks eligible (coupon `MISSION30`). One discount per subscription.

## Useful scripts

| Command | What it does |
|---|---|
| `npm run db:push` | Sync database tables with `src/server/db/schema.ts` |
| `npm run create-admin -- email` | Make an existing account an admin |
| `npm run type-check` | TypeScript check |
| `npx tsx src/scripts/stripe-register-products.ts` | Create Stripe products/prices (prints the env lines) |
