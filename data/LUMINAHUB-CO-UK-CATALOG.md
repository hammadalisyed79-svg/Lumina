# Lumina Hub catalog pull — luminahub.co.uk

**Source:** https://www.luminahub.co.uk/products.json (Shopify public catalog)  
**Fetched:** see `data/luminahub-co-uk-catalog-summary.json`

## Totals

| Item | Count |
|------|------:|
| Products | 179 |
| Variants | 25,468 |
| Images | 1,243 (all stored locally) |
| HEIC (archive only) | 3 |

## Categories

| Category | Products |
|----------|--------:|
| Drum | 95 |
| Fabrics | 27 |
| Cushion covers | 23 |
| Rectangular | 12 |
| Foil-lined | 6 |
| Lampshade kits | 4 |
| Square / Oval / Linen / Empire / Coolie / other | remainder |

## Collections (15)

coolie-lampshades, cushion-covers, drum-lampshades, empire-lampshades, fabrics, foil-lined-lampshades, lamp-shade-kits, linen-lampshades, oval-lampshades, printed-lampshades, rectangular-lampshades, square-lampshades, velvet-lampshades, tired-pendant-lampshade, our-collections

## Files

| File | Purpose |
|------|---------|
| `data/shopify-catalog.json` | Full catalog (titles, variants, image URLs + local paths) |
| `data/products.json` | Simplified product list |
| `data/luminahub-co-uk-product-list.csv` | Spreadsheet-friendly list |
| `data/luminahub-co-uk-collections.json` | Collection list from site |
| `data/luminahub-co-uk-catalog-summary.json` | Counts summary |
| `data/image-migration-report.json` | Image download status |
| `public/media/products/{handle}/` | Local product images (no hotlinking) |

## Refresh commands

```bash
node scripts/migrate-shopify-catalog.js
node scripts/fetch-products.js
node scripts/download-catalog-images.js
node scripts/download-site-images.js
```

Images are already on disk under `public/media/products` — re-run download skips existing files.
