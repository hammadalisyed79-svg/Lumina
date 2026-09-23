# Lumina Hub — delivery report (preview)

**Preview URL:** https://luminahub-lyart.vercel.app/  
**Authority note:** Catalog import is **preliminary**. Variant mapping ≠ commerce complete. **Do not describe checkout as working** until a Shopify hosted test purchase succeeds end to end (cart → pay → webhook marks PAID once).

## Commerce status (honest)

| Gate | Status |
|------|--------|
| Shopify Storefront configured | **No** (`SHOPIFY_STORE_DOMAIN` / `SHOPIFY_STOREFRONT_TOKEN` absent) |
| Hosted test purchase | **Not run** — blocked on credentials |
| Checkout available to customers | **No** — API returns 503 |
| Commerce complete | **No** |

Announcement (live): *Handmade to order in Britain · Online checkout unavailable until Shopify is connected*

## Payment lifecycle (local evidence)

Script: `node scripts/evidence-payment-lifecycle.js` → `data/payment-lifecycle-evidence.json`

| Check | Result |
|-------|--------|
| Cart/order create leaves `AWAITING_PAYMENT` / `PENDING` (not PAID) | Pass (simulated) |
| `markOrderPaidOnce` first call updates; second is no-op; one `paid` event | Pass |
| Cancellation leaves order unpaid (`CANCELLED`) | Pass |
| Failed payment → `FAILED`, not `PAID` | Pass |
| Hosted Shopify E2E | **Deferred** — tokens missing |

Implementation:

- Checkout requires Shopify only (Stripe is not a substitute while Shopify is unconfigured).
- Cart attributes carry `lumina_order_number`; local order stores `shopifyCartId` with `paymentStatus: PENDING`.
- `POST /api/webhooks/shopify` confirms paid via `orders/paid` (HMAC + idempotent webhook rows + `updateMany` not already PAID).
- `POST /api/checkout/cancel` records cancel/fail without clearing a PAID order.

## Variant mapping (not sufficient for commerce complete)

Report: `data/variant-mapping-evidence.json` — 25,468/25,468 IDs + prices match catalog (`pass: true`). This proves catalog wiring only.

## Blocked checkout evidence

Without tokens: `POST /api/checkout` → **503**, `mode: "blocked"`, **no** `orderNumber`, no Order row. See `data/checkout-blocked-prod-evidence.json`.

## Free-shipping claims

Removed from cart, PDP, seed, and Neon shipping methods until Shopify rates are configured.

## Contact / newsletter

DB destinations verified; email skipped while Resend is placeholder (`data/form-and-checkout-evidence.json`).

## Owner must provide

1. `SHOPIFY_STORE_DOMAIN` + `SHOPIFY_STOREFRONT_TOKEN`
2. `SHOPIFY_WEBHOOK_SECRET` + webhook subscription (`orders/paid`, `orders/cancelled`, `orders/updated`) to `/api/webhooks/shopify`
3. Real shipping rates in Shopify
4. Real `RESEND_API_KEY` for outbound mail

After credentials are set, re-run: hosted test purchase, cancel return, declined payment, and webhook duplicate delivery — then update this file with E2E evidence before calling commerce complete.

## Commands

```bash
node scripts/verify-variant-mapping.js
node scripts/evidence-payment-lifecycle.js
node scripts/evidence-forms-checkout.js
```
