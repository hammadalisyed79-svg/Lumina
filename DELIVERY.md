# Lumina Hub — delivery report (preview)

**Preview URL:** https://luminahub-lyart.vercel.app/  
**Commit:** `c9592be` on `origin/main`  
**Authority note:** Catalog import is **preliminary** (public `products.json` → `data/shopify-catalog.json`). Shopify Admin API + Storefront token required before calling commerce complete. **Do not describe checkout as working** until a Shopify hosted test checkout succeeds end to end.

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

## 2. Variant ↔ price mapping evidence

Script: `node scripts/verify-variant-mapping.js`  
Report: `data/variant-mapping-evidence.json` (run 2026-09-23)

| Check | Result |
|-------|--------|
| Catalog variants | 25,468 |
| DB variants | 25,468 |
| Missing `shopifyVariantId` | **0** |
| Orphan DB variant IDs | **0** |
| Price mismatches (display vs catalog) | **0** |
| Option label mismatches | **0** |
| Catalog variants not in DB | **0** |
| UI purchasable options (active + id + price) | 25,217 |
| **pass** | **true** |

PDP `ProductConfigurator` only offers variants with `shopifyVariantId` + `priceOverride`. Cart lines send that `variantId`; checkout resolves `merchandiseId` via `gid://shopify/ProductVariant/{shopifyVariantId}`. Studio “configured” lines are rejected (409) until mapped.

## 3. Checkout — blocked responses (no order numbers)

**Change:** Orders are created only after Shopify cart creation succeeds (or legacy Stripe session). Blocked / failed JSON **omits** `orderNumber` and `orderId`.

Evidence script: `node scripts/evidence-forms-checkout.js` → `data/form-and-checkout-evidence.json`  
HTTP local: `data/checkout-blocked-http-evidence.json`  
Prod smoke (`https://luminahub-lyart.vercel.app/api/checkout`): `data/checkout-blocked-prod-evidence.json`

Observed without Storefront tokens:

- `POST /api/checkout` → **503**
- Body: `mode: "blocked"`, `error`, `blockers` — **no** `orderNumber`
- No new `Order` row for the blocked attempt

**Shopify hosted checkout:** still **not proven**. Missing `SHOPIFY_STORE_DOMAIN` + `SHOPIFY_STOREFRONT_TOKEN`. Do not claim checkout works until an end-to-end Shopify test checkout succeeds.

## 4. Free-shipping claims removed

Until Shopify shipping rules are configured:

- Cart no longer shows complimentary / £75 threshold estimates
- PDP accordion no longer claims “complimentary over £75”
- `SITE.freeShippingFrom` / `defaultShipping` removed
- Seed + live Neon shipping methods cleared of `FREE_ABOVE` / £75
- Announcement: “Handmade to order in Britain · Delivery options confirmed at checkout”
- Pricing helpers no longer invent free shipping when no method is set

## 5. Contact & newsletter destinations

| Form | Intended destinations | Evidence |
|------|----------------------|----------|
| Contact | `bespokeEnquiry` row + email to studio (`CONTACT_TO` / `EMAIL_FROM` / `Sales@luminahub.co.uk`) | DB write OK; email **skipped** while `RESEND_API_KEY` is placeholder |
| Newsletter | `newsletterSubscriber` upsert + studio notification email | DB write OK; email **skipped** same reason |

API responses now include `destination` (`database`, `emailTo`, `emailDelivered` / `emailSkipped`). With a real Resend key, `emailDelivered: true` is expected.

## 6. Feature checklist

| Area | Status |
|------|--------|
| Homepage + real product photography | Working (local `/media`) |
| Shop + PDP + galleries | Working |
| Option/price → Shopify variant mapping | **Verified** (see §2) |
| Design-your-shade | Studio tool only — not Shopify SoT / not purchasable via checkout |
| Cart | Working |
| **Shopify hosted checkout** | **Blocked / unproven** — needs tokens + E2E test |
| Fake paid_dev / order numbers on failure | **Removed** |
| Contact / newsletter | DB destinations verified; email awaits real Resend |
| Policies (Shipping, FAQ, etc.) | Present; shipping page does not promise free delivery |

## 7. Credentials the owner must provide

1. **Shopify Storefront API** — domain + storefront access token (required for live checkout).  
2. **Shopify Admin API** — authoritative catalog / inventory.  
3. **Configure real shipping rates** in Shopify (then re-enable any free-shipping messaging).  
4. **Resend** (or equivalent) — real `RESEND_API_KEY` so contact/newsletter emails leave the server.  
5. Optional: authorized Etsy export; CDN for `public/media`; domain after approval.

## 8. Incomplete (honest)

- No Admin-authenticated migration.  
- **No successful Shopify test checkout yet** — checkout is not “working”.  
- Email delivery not live (placeholder Resend).  
- Legal pages need owner approval.  
- Configurator remains non-purchasable until each option maps to a Shopify variant.

## 9. Commands

```bash
npm install
# set DATABASE_URL + Auth secrets
npx prisma db push
node scripts/migrate-shopify-catalog.js
node scripts/download-catalog-images.js
npx tsx scripts/import-shopify-catalog.ts
node scripts/seed-mood-collections.js
node scripts/verify-variant-mapping.js
node scripts/clear-provisional-shipping.js
node scripts/evidence-forms-checkout.js
npm run build && npm run start
```
