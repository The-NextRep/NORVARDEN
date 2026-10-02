# NORVARDEN

## Project
- Accessible, verified career platform connecting people with disabilities to inclusive employers. Tagline "Another Way Forward". Brand colors: navy #132032, charcoal #3C3E41, gold #C6AC86, off-white #F3F2EE. Logo = two angled pillars with a gold triangle between (`src/components/BrandMark.tsx`). Fonts: Montserrat (headings/labels), Atkinson Hyperlegible (body).
- Status: DRAFT for client review. `IS_DRAFT` in `src/lib/site-meta.ts` makes every page noindex and blocks robots.txt; set to false at launch. No domain yet (links use the placeholder https://www.norvarden.com). Stripe and email not configured yet.
- Started from a copy of The-NextRep/the-board (REP | IV), approved by the owner. Internal member types still use the old enum values (athlete/coach/veteran); the disability-community member model, signup, profile, résumé builder and audience pages are being reworked.
- Stack: React 19 + Vite SSR, Express 5 API (routes registered by hand in `src/server/entry.ts`), Drizzle ORM on MySQL 8, better-auth, Stripe subscriptions, Resend email.
- Product rules: never require proof or disclosure of disability; disability/accommodation fields optional and private by default; contact details shared only after a member accepts a company request; employers verified + sign an accessible-hiring pledge; WCAG 2.2 AA throughout.

## Commands
- `npm run build`, `npm test`, `npm run lint`
- `npm run db:push` — sync schema to MySQL
- `npm run create-admin -- <email>`, `npm run remove-account -- <email>`

## How to work with the owner
- The owner runs three companies: do the work end to end. Build, test, and push to `main` yourself.
- Only ask for things that need their logins (Railway, GitHub, GoDaddy, Stripe, Resend), and give short numbered click-by-click steps.
- Never ask them to paste secret keys into chat.
- After any change to `src/server/db/schema.ts`, tell them to run `npm run db:push` in the Railway service Console.
- Keep replies brief.
