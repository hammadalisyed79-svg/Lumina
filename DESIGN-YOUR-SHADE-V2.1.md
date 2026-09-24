# Design Your Shade v2.1 — Exact Data + Visual Accuracy

## 1. Heuristics removed/reduced

Runtime compatibility no longer guesses from size names/`×` characters or open unscoped sizes.  
`getValidSizes` / Fabrics / Linings / Fittings consume explicit `eligibleShapeKeys` from junction tables.  
Empty eligibility → option unavailable (not “allow everything”).

Seed heuristics only populate DB once (with `needsReview` / confidence report); admins then own the links.

## 2. Explicit compatibility models added

Prisma:

- `ShapeSize`, `ShapeFabric`, `ShapeLining`, `ShapeFitting`
- `Shape.useTypes`, `Fitting.useTypes`
- Fabric: `textureImage`, `patternScale`, `patternOffsetX/Y`, `patternRotation`, `repeatMode`, `usableAsTexture`
- Size: `topDiameterCm`, `bottomDiameterCm`
- Lining: `rendererHex`, `reflectivityHint`

Migration: `prisma/migrations/20260924120000_configurator_eligibility/`

## 3. Relationships populated

Script: `scripts/seed-configurator-eligibility.ts`  
Report: `data/configurator/eligibility-seed-report.json`

- High confidence: `Size.shapeId` → ShapeSize  
- Low confidence + NEEDS_REVIEW: unscoped sizes by dimension kind  
- Open ShapeFabric (all×all) flagged for review  
- ShapeLining all×all (medium)  
- ShapeFitting via use-type intersection  

Counts (seed): 67 relationships written; 45 flagged `needsReview`.

## 4. Relationships needing manual review

See `eligibility-seed-report.json` (`needsReview: true`).  
Especially: unscoped size links and open fabric×shape matrix.

Empire/Coolie sizes still lack stored `topDiameterCm` / `bottomDiameterCm` on catalogue rows — renderer falls back to a documented taper ratio until admin fills real fields (**NEEDS_REVIEW**).

Admin UI: Shapes → **Compatibility** checklist per shape (`ShapeEligibilityEditor` + `PUT /api/admin/shapes/[id]/eligibility`).

## 5. Fabric audit result

`data/configurator/fabric-audit.json` — 8 active fabrics audited.

## 6. Fabrics with proper texture

Audit marked all 8 as `usableAsTexture` because paths contain `velvet-fabric` / material keywords (flat metreage shots).  
**Still verify** name↔image mapping in admin (e.g. “Ivory Linen” may point at a different print).

## 7. Fabrics still missing proper texture

None forced off by audit; several need **manual confirmation** of flat crop vs finished product.  
Renderer refuses wrapping when `usableAsTexture === false` (neutral body fill + swatch in browser).

## 8. Pattern-scale implementation

Stored on Fabric; seeded from prior heuristics then editable.  
Renderer supports scale, X/Y offset %, rotation, REPEAT/COVER/CONTAIN without distortion.

## 9. Admin texture controls

Fabric edit includes **Configurator Preview** (`FabricTexturePreview`) with live SVG shade + texture knobs.

## 10. Geometry validation

Empire/Coolie use `topDiameterCm` / `bottomDiameterCm` when present; otherwise taper ratio fallback.  
Tests: 40×20 drum wider aspect than 30×30; empire taper ratio follows top/bottom.

## 11. Lining accuracy

Linings seeded with distinct `rendererHex` (white / gold / silver / copper) and `reflectivityHint`.  
Light On glow uses lining colour + reflectivity.

## 12. Mobile sticky-bar fix

Compact status + price bar; safer bottom padding (`calc(5.25rem + safe-area)`); lower z-index so options stay tappable.

## 13. Acceptance-test result

| Step | Configuration | Result |
|------|---------------|--------|
| A | Table · Drum · 40 cm · Ivory Linen · Gold · Spider | £111 — captured |
| B | Only fabric → Stone Herringbone | £119 (+£8 fabric) — exterior texture changed; other fields held |
| C | Only lining → White | £105 (−£14 gold) — interior/light changed; fabric held |
| D | Shape → Empire (same size/fabric/gold/spider) | Geometry tapered; compatible options preserved |
| E | Reload `?design=cmuf9fno70001u5o0xgoesynn` | Empire + Stone Herringbone + Gold + 40 cm + Spider reconstructed |

Automated eligibility/invalidation/pricing/geometry tests: **14 passed**.

## 14. Screenshot paths

- `data/configurator-v21-screenshots/A-drum-fabricA-gold.png`
- `data/configurator-v21-screenshots/B-fabricB-only.png`
- `data/configurator-v21-screenshots/C-white-lining-only.png`
- `data/configurator-v21-screenshots/D-empire-geometry.png`

## 15. Test result

`vitest run tests/configurator.test.ts` — **14 passed**

## 16. Typecheck result

`tsc --noEmit` — **pass**

## 17. Lint result

eslint on touched configurator/admin paths — **pass**

## 18. Build result

`next build` — **pass**

## 19. Remaining limitations

- Open fabric×shape seed still NEEDS_REVIEW until studio restricts per silhouette  
- Fabric name↔media mismatches need human confirmation in admin preview  
- Shape+Size→lining/fitting overrides not modeled (shape-level links only)  
- Empire/Coolie top/bottom diameters often null — taper uses ratio fallback until admin data filled  
- Light preview remains illustrative  
- Room mode is tonal context only  
