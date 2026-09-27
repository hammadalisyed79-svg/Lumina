# Design Your Shade — polish notes

British bespoke studio presentation for `/design-your-shade`. Presentational only — selection, compatibility, pricing, and cart behaviour unchanged.

## Flat / plan fabrics

- **Goal:** Swatches and shade preview use straight/flat fabric images (same print — no wrinkles, drapes, or prop lifestyle shots).
- **Approach:**
  1. Score gallery images with fold heuristics (center swirl bias + excess low-frequency variance), reusing plan cues from `product-images.ts`.
  2. Prefer an existing plan/flat gallery frame when one scores cleanly.
  3. Otherwise derive a plan crop: scan edge-biased windows, skip prop-heavy corners, flatten soft fold lighting, write `/media/plan/<slug>-<hash>.jpg`.
  4. Store on `Fabric.textureImage` + `swatchUrl`; keep wrinkled primary on `imageUrl` for shop PDP.
- **Wiring:** `FabricBrowser`, lightbox, and `fabricTextureUrl` prefer `textureImage`. Config options API serves plan URLs for swatch/texture.
- **Regen:** `npm run fabrics:plan-crops` → `scripts/generate-fabric-plan-crops.ts`.
- **Batch result (this pass):** 35 active fabrics — **13** already had / picked a gallery plan frame, **4** scored already-plan on primary, **18** received derived `/media/plan/*.jpg` crops (incl. teal jade gold geometric).

## UX polish

| Area | Change |
|------|--------|
| **Review incomplete** | Guided “almost there” card with progress list (set vs pending) + CTA to the next missing step — no bare “Choose a size to continue”. |
| **Preview frame** | Extra top padding + taller SVG viewBox so cord/shade aren’t clipped. |
| **Fitting tiles** | Display typography for names; clearer selected vs disabled (muted ground, no washed-out opacity); dedicated unavailable line. |
| **Rhythm** | `cfg-options-stack` spacing; step chip letter-spacing; section rule weight; sticky bar shadow softened. |
| **Disabled options** | Soft stone fill instead of 45% opacity “broken” look. |

## Out of scope

- No Phase 4 payments / Shopify.
- No invented Empire/Coolie diameters.
- No renderer geometry rewrite (framing/viewBox only).
- Product gallery lifestyle shots on PDP left intact.
