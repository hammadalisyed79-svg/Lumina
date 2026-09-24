# Phase 2 — Complete Catalogue Migration + Full Catalogue Admin

Source: https://www.luminahub.co.uk/ (data + imagery only; design not copied)

## Summary

Fresh crawl of every collection page **plus** global `/products.json` confirms the public catalogue is fully processed: **15 collections**, **179 unique products**, **0 products outside collections**, **1,231 local product images**, **0 zero-image products**.

## Discovery

| Metric | Value |
|--------|-------|
| Collections discovered | 15 |
| Collection + products.json pages crawled | 25 |
| Product links found (with duplicates) | 646 |
| Unique products | **179** |
| Added only via `/products.json` | 0 |
| Reports | `data/migration/luminahub-discovery.json` |

Commands: `npx tsx scripts/import-luminahub.ts discover|parse|images|import|all`

## Import

| Metric | Value |
|--------|-------|
| Products in database | 179 |
| Published (non-archived) | 179 |
| Product images | 1,231 |
| Collections (source + storefront helpers) | 34 |
| Failed product imports | 0 |
| Products with zero images | 0 |
| Fabric catalogue rows (after sync) | 35 |
| Reports | `data/migration/luminahub-import-report.json`, `luminahub-products.csv`, `luminahub-image-report.json` |

Idempotent upsert keyed by `sourceHandle`. Customer-facing fields are preserved when `adminFieldsLocked` is set (set automatically on admin edit).

Raw source fields retained: `sourceTitle`, `sourceUrl`, `sourceHandle`, `sourceOriginalDescription`, `sourceAvailability`, `sourceWebsite`, `sourceImportedAt`.  
Display title stored as `Product.title` (cleaned); original SEO title kept in `sourceTitle`.

## Manual review

Admin queue: `/admin/migration-review`

Includes:

- Products with `NEEDS_REVIEW` / missing images
- Unscoped sizes (`shapeId` null)
- Sizes missing Empire/Coolie `topDiameterCm` / `bottomDiameterCm`
- Fabric audit “confirm mapping” items
- Configurator eligibility relationships flagged `needsReview`

## Admin routes completed

| Route | Status |
|-------|--------|
| `/admin/products` | List + publish/archive + migration status |
| `/admin/products/new` | Create |
| `/admin/products/[id]` | Edit (images, variants, SEO, lead time, lock, source title) |
| `/admin/collections` | List |
| `/admin/collections/new` | Create |
| `/admin/collections/[id]` | Full edit + hero/SEO + product assignment |
| `/admin/fabrics` | CRUD + V2.1 texture preview |
| `/admin/shapes` | CRUD + eligibility editor |
| `/admin/sizes` | CRUD |
| `/admin/linings` | CRUD |
| `/admin/fittings` | CRUD |
| `/admin/migration-review` | Review queue |

## Storefront

- `/shop`, collection PLPs, search, homepage product sections use Prisma catalogue (`published` + not `archived`)
- PDP H1 uses cleaned `title` (not long `sourceTitle`)
- Images served from `/media/products/{handle}/` (local; not hotlinked)

## Configurator data cleanup

- Synced **27** imported fabric products into `Fabric` rows for Design Your Shade (`scripts/sync-fabrics-from-products.ts`)
- Preserves existing V2.1 texture calibration when already set
- Eligibility NEEDS_REVIEW items surfaced in migration review (not silently cleared)

## Validation samples

Checked live DB samples for Drum, Empire, Square, Oval, Coolie, Rectangular, Fabric, Cushion, Kit — each has cleaned title, price, images, collections, and source title retained.

## Database changes

- Migration `20260924140000_product_admin_locks`: `Product.archived`, `Product.adminFieldsLocked`

## Quality

| Check | Result |
|-------|--------|
| Sample validation | **Pass** (Drum/Empire/Square/Oval/Coolie/Rectangular/Fabric/Cushion/Kit) |
| Typecheck | **Pass** (`tsc --noEmit`) |
| Lint | **Pass** (eslint on Phase 2 paths) |
| Build | **Pass** (`next build`) |

## Remaining blockers

- Empire/Coolie size rows still need real top/bottom diameters entered in admin
- Open fabric×shape eligibility matrix still NEEDS_REVIEW (studio should tighten)
- Some cleaned display titles still verbose — optional human polish in product admin
- Checkout / Shopify / Stripe / domain **out of scope** for this phase (per brief)
