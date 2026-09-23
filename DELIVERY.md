# Lumina Hub — delivery report

**Commit:** `21a1ca7` on `origin/main`  
**Production URL:** https://luminahub-lyart.vercel.app/  
**Also:** `lumina` Vercel project (same repo)  
**Do not mark checkout complete** — Shopify Storefront tokens are not configured; checkout returns **503**.

## Latest homepage / storefront pass

| Item | Status |
|------|--------|
| Shop by shape placeholders | Replaced with real `/media/products/…` photos (square crops, `object-cover`) |
| Shop by mood placeholders | Real catalog covers (unique tiles) |
| Design your shade CTA imagery | Real lifestyle/product photos; honest “save / enquire” copy (no add-to-bag claim) |
| Selected pieces mix | 2 lampshades + 2 fabrics + 2 cushions + 2 kits |
| Display titles | Shortened on cards via `shortDisplayTitle`; PDP keeps full title + description |
| Vertical gaps | Reduced `section-pad` + collection/PDP spacing |
| “server-trusted pricing” | Removed |
| Configured shade → bag | Disabled; enquire / save design only |
| Announcement | `Online checkout unavailable until Shopify is connected` |
| Catalog/PDP placeholders | HEIC / demo-asset URLs filtered from shop & gallery |
| Checkout API (valid cart) | **503** `mode: blocked` until Storefront tokens |

Screenshots (this pass): `data/homepage-screenshots/`

| View | Files |
|------|--------|
| Homepage desktop | `desktop-hero-announcement.png`, `desktop-shop-by-shape.png`, `desktop-design-your-shade.png`, `desktop-selected-pieces.png` |
| Homepage mobile | `mobile-home-hero.png`, `mobile-shop-by-shape.png`, `mobile-shop-by-mood.png`, `mobile-selected-pieces.png`, `mobile-hero-announcement.png` |
| Collection | `desktop-collection-lampshades.png`, `mobile-collection-lampshades.png` |
| PDP | `desktop-pdp.png`, `mobile-pdp.png` |
| Cart | `desktop-cart.png`, `mobile-cart.png` |

## Route / media verification (production)

| Check | Result |
|-------|--------|
| `/` | 200 |
| `/shop/lampshades` | 200 · 48 pieces |
| `/product/[slug]` | 200 · gallery images via `/_next/image` → `/media/…` 200 |
| `/cart` | 200 |
| `/design-your-shade` | 200 |
| Sample media JPEG/PNG | 200 (`Content-Type: image/jpeg` / `image/png`) |
| `POST /api/checkout` (real product + shipping) | **503** blocked (Shopify unconfigured) |
| `npm run build` | Passes locally |

## Checkout / commerce (honest)

| Gate | Status |
|------|--------|
| Shopify Storefront configured | **No** |
| Hosted test purchase | **Not run** |
| Checkout available | **No** (503 blocked; no order numbers on failure) |
| Variant ID/price mapping vs catalog | Verified earlier (`data/variant-mapping-evidence.json`) — **not** commerce complete |
| Payment once-paid / cancel / fail helpers | Implemented locally; E2E deferred |

## Remaining blockers

1. `SHOPIFY_STORE_DOMAIN` + `SHOPIFY_STOREFRONT_TOKEN`
2. `SHOPIFY_WEBHOOK_SECRET` + webhooks to `/api/webhooks/shopify`
3. Real Shopify shipping rates (no free-shipping claims until then)
4. Real `RESEND_API_KEY` for contact/newsletter email delivery
5. Owner review of legal pages before public launch
6. Configurator options still not mapped to Shopify variants (studio-only)
7. Some imported product titles remain lowercase / verbose at source (cards shorten; PDP shows full title)

## Commands

```bash
node scripts/update-shape-mood-images.js
node scripts/update-fabric-images.js
node scripts/verify-variant-mapping.js
node scripts/evidence-payment-lifecycle.js
npm run build
```
