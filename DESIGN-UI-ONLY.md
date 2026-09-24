# Design Your Shade — UI-only redesign

Pure customer-facing visual redesign of `/design-your-shade`.  
**No database, API, pricing, cart, order, admin, Shopify, Stripe, shipping, or email changes.**

## Confirmation — untouched logic

| Area | Status |
|------|--------|
| `compatibility.ts` | Not modified |
| `pricing.ts` | Not modified |
| `orderability` / cart validation / order creation | Not modified |
| Prisma schema / migrations | Not modified |
| API routes / contracts | Not modified |
| `ShadeRenderer` geometry / texture logic | Not modified (presentation CSS wrappers only) |
| Selection, steps, Add to Bag, sticky actions | Behaviour preserved |
| Preview props / mode / room / dimensions | Behaviour preserved |

Documented logic issues (unchanged; out of scope): none introduced by this pass. Existing catalogue eligibility / missing size diameters remain data concerns from v2.1 — not edited here.

## Visual changes (sections 2–19)

- **Desktop layout:** ~58% preview / ~42% config (`1.38fr / 1fr`), shade as hero, sticky preview column.
- **Studio atmosphere:** warm ivory / stone / cream / charcoal / taupe / champagne; solid preview stage with grounding shadow; **no gradients** on studio chrome.
- **Preview controls:** Exterior / Interior / Light On / Room as segmented control (`.cfg-segment`).
- **Right panel:** eyebrow `DESIGN YOUR SHADE`, heading `Create Your Perfect Shade`, supporting copy, then steps.
- **Steps 01–07:** restrained numbered progress (Use → Review); underline active state.
- **Shapes:** silhouette glyph + name; refined selected inset border.
- **Sizes:** compact tiles with measurement primary (`sizeMeasurement`).
- **Fabrics:** search + minimal chips + large swatches in 2–3 column grid (selection unchanged).
- **Linings:** tactile swatch panels (not flat circles); same hex values.
- **Fittings:** icon glyph + name + short explanation; no compatibility changes.
- **YOUR SHADE summary:** compact cream panel; labels only (no technical IDs).
- **Review:** premium card presentation; existing actions only (Save / Share / Ask Studio / Add to bag).
- **Mobile (375–430):** preview-first sticky stage (~35–42vh), steps under intro, options below; fabric 2-col; shapes 2–3; sticky bar visual-only with safe-area padding.
- **Motion:** 150–180ms transitions on options / chips / segments.

## Screenshots

### Before (`data/design-ui-before/`)

Captured from the live page **before** markup/CSS edits (Cursor Glass viewport ≈850px wide):

- `desktop-1440-start.png`
- `mobile-390-start.png`

### After (`data/design-ui-after/`)

Playwright at true viewports (desktop 1440×900, mobile 390×844 @2x):

| File | Viewport / step |
|------|-----------------|
| `desktop-start.png` | 1440 — start |
| `desktop-shape.png` | 1440 — shape |
| `desktop-fabric.png` | 1440 — fabric |
| `desktop-lining.png` | 1440 — lining |
| `desktop-review.png` | 1440 — review |
| `mobile-start.png` | 390 — start |
| `mobile-fabric.png` | 390 — fabric |
| `mobile-review.png` | 390 — review |

Helper scripts (optional re-run): `scripts/capture-design-ui-after.cjs`, `scripts/capture-design-ui-mobile.cjs`.

## Files changed

- `src/app/design-your-shade/page.tsx` — layout / presentation markup only
- `src/app/globals.css` — studio / configurator visual styles
- `src/components/configurator/ConfiguratorPreview.tsx` — segmented control styling
- `src/components/configurator/FabricBrowser.tsx` — fabric grid presentation
- `src/components/configurator/SpecSummary.tsx` — compact summary presentation
- `src/components/configurator/ShapeSilhouette.tsx` — **new** presentational glyph
- `src/components/configurator/FittingGlyph.tsx` — **new** presentational glyph
- `src/lib/configurator/size-label.ts` — **new** display helper
- `src/lib/copy.ts` — design page eyebrow / title / body copy
- `data/design-ui-before/*` — before screenshots
- `data/design-ui-after/*` — after screenshots
- `scripts/capture-design-ui-after.cjs` / `capture-design-ui-mobile.cjs` — screenshot helpers
- `DESIGN-UI-ONLY.md` — this report

## Desktop / mobile results

- **Desktop:** Split studio reads as preview-led; config panel carries brand heading + 01–07 steps; shapes/sizes/fabrics/linings/fittings match the premium tile language.
- **Mobile:** Preview stacks first with constrained height; sticky Continue / Add to bag bar redesigned visually with safe-area inset; option controls remain tappable above the bar.

## Typecheck / build notes

- `npm run typecheck` (`tsc --noEmit`) — **pass**
- Next.js Dev Tools may show a generic **“1 Issue”** badge in local/dev overlays; **no `src/app/global-error.tsx` / `/_global-error` change** was made in this UI pass (unchanged from prior app state). No unrelated dependency upgrades.

## Stop line

Design Your Shade **UI-only** work is complete. Phase 3/4, cart, orders, workshop, admin, Prisma, APIs, pricing, and payment surfaces were not continued.
