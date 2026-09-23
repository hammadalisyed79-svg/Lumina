# Lumina Hub — redesigned storefront + full backend

Premium Next.js rebuild of [luminahub.co.uk](https://www.luminahub.co.uk) with all live product images and a complete SQLite-backed API.

## Features

- Full-bleed brand-first homepage with studio imagery
- Shop with categories, search, sort, pagination (179 products seeded from Shopify)
- Product pages with image galleries
- Cart + checkout + order confirmation
- Contact form + newsletter
- Admin dashboard (`/admin`, key: `luminahub-admin`)
- APIs: `/api/products`, `/api/orders`, `/api/contact`, `/api/newsletter`, `/api/admin`

## Run locally

```bash
npm install
npm run seed   # optional — auto-seeds on first request
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run seed` | Reseed SQLite from `data/products.json` |
| `npm run fetch-products` | Re-download catalog from luminahub.co.uk |

## Stack

Next.js App Router · TypeScript · Tailwind CSS · better-sqlite3 · Zod
