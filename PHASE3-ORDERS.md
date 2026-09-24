# Phase 3 — Cart + Order Architecture + Workshop / Manufacturing Workflow

**Date:** 2026-09-24  
**Status:** Complete (payment still not live — Stripe/Shopify blocked by design)

## Acceptance chain

| Step | Result |
|------|--------|
| DESIGN YOUR SHADE → ADD TO BAG | Server `/api/cart/validate` prices + snapshots before bag insert; blocked configs surface errors (no silent swap) |
| EDIT BAG CONFIGURATION | Cart link → `/design-your-shade?…&editCart=<lineId>` round-trip; replace line on re-add |
| CREATE TEST ORDER | `POST /api/orders/test` (dev / `ALLOW_TEST_ORDERS`) — `paymentStatus=UNPAID`, never fake PAID |
| ADMIN ORDER | `/admin/orders` + detail with statuses, timeline, notes |
| WORKSHOP SHEET | `/admin/orders/[id]/workshop` pack + `/workshop/[itemId]` manufacturing sheet |
| CUSTOMER ORDER HISTORY | `/account/orders` + `/account/orders/[orderNumber]` retain config snapshot |

## 0. Pre-phase / migration-review blockers

Orderability rules (never invent measurements):

- Empire/Coolie sizes missing `topDiameterCm` / `bottomDiameterCm` → **not orderable**
- `Shape*` eligibility with `needsReview=true` → **excluded from storefront catalog links + blocked on validate**
- Unscoped sizes (no confirmed ShapeSize) → **not orderable**

Surfaced in `/admin/migration-review` copy and enforced in `src/lib/cart/orderability.ts` + `sizeOrderableForShape`.

## 1–7. Cart architecture

| Deliverable | Implementation |
|-------------|----------------|
| Single cart for standard + configured | `CartProvider` kinds `product` \| `configured` |
| Structured IDs | `src/lib/cart/ids.ts` — `cfg:…` / `prd:…` (`lineKey`) |
| Server-generated snapshot | `ConfiguredSnapshot` / `ProductSnapshot` via `validateCartLine` |
| Server-trusted pricing | Client unit prices ignored; `calculateUnitPrice` on server |
| Add to Bag | Design Your Shade validates then `addConfigured` with snapshot |
| Cart display / edit | `CartLineItem` + `editConfiguredHref` |
| Persistence + guest/user merge | localStorage `lumina_cart_v2` + `POST /api/cart/merge` + `Cart` model |
| Validation without silent swaps | Failed lines get `validationError`; options not auto-replaced |

## 8–12. Orders

| Deliverable | Implementation |
|-------------|----------------|
| DB snapshots | `OrderItem.configJson` stores full server snapshot |
| LH-###### numbering | `OrderSequence` + `nextOrderNumber()` → `LH-000001` |
| Order ≠ payment | `createOrderFromCart` with `paymentIndependent` |
| Separate statuses | `status` / `paymentStatus` / `productionStatus` unchanged enums |

## 13–20. Admin + customer + workshop

- Admin list/detail with `orders.view`
- Workshop pack + per-item sheets
- Internal notes API `orders.notes` + status history (`OrderEvent`)
- Customer account order list/detail + tracking fields
- Packing note retained at `/print`

## 21–26. Summary / shipping / emails / test orders

- Order summary labelled (not VAT invoice)
- Shipping placeholder architecture (`src/lib/shipping/placeholder.ts`) — no invented free shipping
- Discount/tax total fields on orders + cart summary
- Email stubs: `email_stub:*` OrderEvents (`src/lib/orders/emails.ts`)
- TEST ORDER API — never marks payment success
- Live Stripe checkout still 503 when keys missing; when keys present uses same validation + LH numbering

## 27–29. Security

- Permissions: `orders.view`, `orders.edit`, `orders.fulfil`, `orders.notes`
- Admin PATCH enforces fulfil/edit/notes
- Audit log on order update, notes, test create

## 30–35. QA

- Configurator taper / eligibility orderability covered in tests
- Mobile: cart sticky actions + account order history unchanged layout patterns
- No Stripe/Shopify live payment connected in this phase
- Automated: `tests/phase3-orders.test.ts` (+ existing pricing/configurator)

## 36. Quality gates

| Check | Result |
|-------|--------|
| `prisma migrate deploy` | **Pass** — applied `20260924160000_phase3_orders` |
| `tsc --noEmit` | **Pass** |
| Automated Phase 3 assertions | **Pass** — `node --import tsx scripts/phase3-selftest.ts` (6 checks) |
| `tests/phase3-orders.test.ts` | Present; vitest under Cursor helper node reports empty suites (env issue) — selftest covers same contracts |
| eslint | Blocked in this environment (`@rushstack/eslint-patch` vs Cursor node) |
| `next build` | **Blocked** by Next.js 16.3.6 `Invariant: Expected workStore to be initialized` on `/_global-error` (reproduced with minimal root layout; not Phase 3-specific). Typecheck within build passes. |

## Key files

- `src/lib/cart/{ids,orderability,snapshot,validate,types,display}.ts`
- `src/lib/orders/{create,numbering,emails,workshop}.ts`
- `src/app/api/cart/{validate,merge}/route.ts`
- `src/app/api/orders/test/route.ts`
- `src/app/admin/orders/[id]/workshop/**`
- `prisma/migrations/20260924160000_phase3_orders/`

## Known limitations

- Empire/Coolie catalogue sizes still lack real taper diameters → correctly **blocked** until admin fills them
- Open fabric×shape NEEDS_REVIEW matrix correctly non-orderable until confirmed
- Live payment / Shopify checkout still out of scope (Phase 3)
- Email delivery is stubbed only (no Resend send)
- Shipping rates depend on admin `ShippingMethod` rows
- Test orders require signed-in email + `NODE_ENV=development` or `ALLOW_TEST_ORDERS=true` / `NEXT_PUBLIC_ALLOW_TEST_ORDERS=true`
- Local `next build` currently fails on Next 16.3.6 `/_global-error` workStore invariant (pre-existing platform issue)
- Vitest CLI under Cursor’s bundled Node reports “No test suite found”; use `scripts/phase3-selftest.ts`

## Commit

See git history on `main` after Phase 3 push.
