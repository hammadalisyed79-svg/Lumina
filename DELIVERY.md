# Lumina Hub — delivery report (preview)

**Preview URL:** https://luminahub-lyart.vercel.app/  
**Commit:** `311c3c8` on `origin/main` (prod deploy READY)  
**Authority note:** Catalog import is **preliminary** (public `products.json`). Shopify Admin API + Storefront token required before calling commerce “complete”. Not 100% complete without Storefront checkout tokens.

## 1. Reconciliation (source → target)

| Metric | Source (public feed) | Imported to Neon | Delta |
|--------|----------------------|------------------|-------|
| Products | 179 | 179 | 0 |
| Variants | 25,468 | 25,468 | 0 |
| Images | 1,243 | 1,243 local files + DB rows | 0 failures |
| HEIC | 3 | archived; web UI prefers non-HEIC | review |
| Categories/collections | 12 shape/material + mood collections | seeded | — |
| Etsy | 403 / not included | 0 | owner export needed |

Reports: `data/reconciliation-preliminary.json`, `data/reconciliation-import.json`, `data/image-migration-report.json`.

Owner zip `LUMINA_CATALOG_FOR_CURSOR.zip` matched the same 179 / 25,468 / 1,243 — **ignored for re-import** (no extra products).

## 2. Feature checklist

| Area | Status |
|------|--------|
| Homepage + real product photography | Working (local `/media`) |
| Shop by type/collection + filters | Working (`/shop/lampshades` etc.) |
| PDP + galleries | Working |
| Design-your-shade / size guide | Working (studio tools; not Shopify SoT) |
| Cart drawer | Working |
| **Shopify hosted checkout** | **Blocked** — needs `SHOPIFY_STORE_DOMAIN` + `SHOPIFY_STOREFRONT_TOKEN` |
| Stripe checkout | Optional legacy only if keys set |
| Fake paid_dev orders | **Removed** — returns 503 with blockers |
| Account / admin / reviews / trade / bespoke | Present (Prisma) |
| FAQ, Care, Shipping, Refunds, Privacy, Terms | Present (sourced from luminahub.co.uk; verify before launch) |
| Contact / newsletter | Persist to DB; email needs Resend |

## 3. Checkout test evidence

Prod smoke (2026-09-23), real published product + variant, valid shipping:

- `POST https://luminahub-lyart.vercel.app/api/checkout` → **503**
- Body includes `mode: "blocked"`, `orderNumber: "LH-20260923-PO5KK"`, blockers:
  `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_TOKEN`, `Verified shipping rates in Shopify`
- Order is **not** marked paid (`paid_dev` path removed)

With tokens: creates Shopify cart via Storefront API and redirects to `checkoutUrl` (`mode: "shopify"`).

Route smoke: `/`, `/shop`, `/shop/lampshades`, `/shipping`, `/faq` → **200**.

## 4. Credentials / settings the owner must provide

1. **Shopify Storefront API** — store domain + storefront access token (live checkout).  
2. **Shopify Admin API** (recommended) — authoritative catalog, inventory, unpublished products.  
3. **Authorized Etsy export** — unique listings / extra photos (feed returned 403).  
4. Confirm **shipping rates, free-delivery rules, taxes, returns** against business settings (do not trust UI defaults).  
5. **Resend** (or email provider) for contact/order mail.  
6. Optional: Cloudinary/R2 if moving off `public/media` (~475MB).  
7. Domain + DNS when ready (after approval).

## 5. Incomplete (honest)

- Not Admin-authenticated migration; public feed only.  
- No live Shopify checkout until tokens are set.  
- No Etsy inventory.  
- Legal pages need owner counsel/approval before public launch.  
- Free-shipping announcement thresholds are provisional UI defaults.  
- Design-your-shade configurator is internal pricing, not Shopify variant SoT until mapped.  
- Media repo size is large; prefer CDN for long-term.

## 6. Commands

```bash
npm install
# set DATABASE_URL + Auth secrets
npx prisma db push   # or migrate deploy
node scripts/migrate-shopify-catalog.js
node scripts/download-catalog-images.js
npx tsx scripts/import-shopify-catalog.ts
node scripts/seed-mood-collections.js
npm run build && npm run start
```
