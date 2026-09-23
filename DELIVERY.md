# Lumina Hub — delivery report

**Commit:** `b77a33d` on `origin/main`  
**Production URL:** https://luminahub-lyart.vercel.app/  
**Also:** `lumina` Vercel project (same repo)  
**Do not mark checkout complete** — Shopify Storefront tokens are not configured; checkout returns **503**.

## Latest homepage / storefront pass

| Item | Status |
|------|--------|
| Shop by shape placeholders | Replaced with real `/media/products/…` photos |
| Shop by mood placeholders | Real catalog covers (unique tiles) |
| Design your shade CTA imagery | Real lifestyle/product photos; no SVG atelier fallback on homepage |
| Selected pieces mix | 2 lampshades + 2 fabrics + 2 cushions + 2 kits |
| Display titles | Shortened on cards via `shortDisplayTitle`; PDP keeps full title + description |
| Vertical gaps | Reduced `section-pad` + collection/PDP spacing |
| “server-trusted pricing” | Removed |
| Configured shade → bag | Disabled; enquire / save design only |
| Announcement | `Online checkout unavailable until Shopify is connected` |
| Catalog/PDP placeholders | HEIC / demo-asset URLs filtered from shop & gallery |

Screenshots: `data/homepage-screenshots/` (desktop + mobile for hero, shape, design, selected, mood; plus collection/PDP/cart captures from this pass).

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

## Commands

```bash
node scripts/update-shape-mood-images.js
node scripts/update-fabric-images.js
node scripts/verify-variant-mapping.js
node scripts/evidence-payment-lifecycle.js
npm run build
```
