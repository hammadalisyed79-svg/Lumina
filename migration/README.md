# Lumina Hub catalogue migration

Source: https://www.luminahub.co.uk/

## Commands

```bash
npx tsx scripts/import-luminahub.ts discover   # collections + pagination
npx tsx scripts/import-luminahub.ts parse      # every product JSON
npx tsx scripts/retry-parse-failures.ts        # if rate-limited
npx tsx scripts/import-luminahub.ts images     # → public/catalog/products/
npx tsx scripts/import-luminahub.ts import     # upsert Prisma
npx tsx scripts/import-luminahub.ts all        # full pipeline
```

## Outputs

| Path | Contents |
|------|----------|
| `migration/luminahub-discovery-report.json` | Collections, pages, unique handles |
| `migration/luminahub-parsed-products.json` | Normalized product records |
| `migration/luminahub-import-report.json` | Final counts + DB result |
| `migration/luminahub-image-audit.json` | Image success/fail audit |
| `migration/luminahub-products.csv` | Spreadsheet list |
| `public/catalog/products/{handle}/` | Local high-res images |

## Modules

`src/lib/import/` — crawler helpers, parsers, normalizer, image downloader, DB importer, reports.
