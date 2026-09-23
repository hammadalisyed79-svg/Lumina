# Lumina Hub

Production ecommerce for a premium UK handmade lampshade and interior-textile studio.

## Stack

- Next.js 16 (App Router) · React · TypeScript · Tailwind CSS
- PostgreSQL · Prisma ORM
- Auth.js (NextAuth v5) credentials + Prisma adapter
- Stripe Checkout + webhooks
- Zod validation · Resend-compatible email · Cloudinary/R2 image abstraction
- Vitest

## Features

- Storefront: announcement bar, sticky mega-menu nav, homepage sections, shop filters, PDP configurator, design-your-shade wizard, size guide, search, cart drawer, wishlist (guest + merge on login)
- Checkout with **server-trusted pricing**, coupons, shipping, Stripe (or local paid fallback when Stripe keys are placeholders)
- Customer account: orders, addresses, wishlist, saved designs, profile
- Trade applications & bespoke enquiries (DB + admin)
- Full `/admin` (ADMIN RBAC): dashboard, products/variants, collections, fabrics, sizes, linings, fittings, orders, customers, reviews moderation, coupons, shipping, CMS, SEO, media, trade, bespoke
- SEO: metadata, JSON-LD on PDP, sitemap, robots
- Security: Zod, rate limiting on auth/forms, audit log

## Local database

This repo targets **PostgreSQL**. On Windows without Docker you can run the bundled embedded cluster:

```bash
npm run db:local
```

Default URL (also in `.env.example`):

```
postgresql://lumina:lumina_dev_password@127.0.0.1:55432/lumina?schema=public
```

Or point `DATABASE_URL` at Neon / Supabase / Vercel Postgres / local Postgres 15+.

## Install & run

```bash
# Node 22+ on PATH
npm install
cp .env.example .env   # Windows: copy .env.example .env

# Start Postgres (embedded helper or your own), then:
npx prisma migrate deploy
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest |
| `npm run seed` | Seed catalog + admin |
| `npm run db:migrate` | Prisma migrate |
| `npm run db:local` | Start embedded Postgres on 55432 |

## Admin login

Seeded from env (`ADMIN_EMAIL` / `ADMIN_PASSWORD`):

- Email: `admin@luminahub.co.uk`
- Password: `LuminaAdmin2026!` (change in production)

Demo customer: `customer@example.com` / `Customer123!`

## Stripe

1. Create a Stripe account and get test keys.
2. Set `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
3. Forward webhooks locally: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
4. Set `STRIPE_WEBHOOK_SECRET` from the listen command.
5. When keys are placeholders, checkout marks orders paid in **dev mode** so the flow remains testable.

## Images

- Demo placeholders live under `public/demo-assets/{products,fabrics,shapes,lifestyle}/`
- Set `IMAGE_PROVIDER=local|cloudinary|r2` and provider credentials
- Replace SVG placeholders with studio photography; keep the same filenames or update seed URLs / admin media

## Deploy (Vercel)

1. Create a Postgres database (Vercel Postgres / Neon).
2. Set all env vars from `.env.example`.
3. Build command: `prisma migrate deploy && prisma generate && next build` (or use `npm run build` + migrate in CI).
4. Run seed once against production (`npm run seed`) or create admin manually.
5. Configure Stripe webhook endpoint: `https://YOUR_DOMAIN/api/webhooks/stripe` for `checkout.session.completed`.

## Coupons (seeded)

- `WELCOME10` — 10% off (min £50)
- `SHADE15` — £15 off (min £80)
