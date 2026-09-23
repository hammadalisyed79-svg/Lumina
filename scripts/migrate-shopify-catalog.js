/**
 * Full Shopify public catalog pull (PRELIMINARY — not Admin API).
 * Paginates until exhausted. Captures all variants + images.
 * Writes data/shopify-catalog.json + data/reconciliation-preliminary.json
 */
const fs = require("fs");
const path = require("path");
const https = require("https");

const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "data");
const BASE = "https://www.luminahub.co.uk";

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "LuminaHubMigration/1.0" } }, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`${url}: ${e.message} len=${data.length}`));
          }
        });
      })
      .on("error", reject);
  });
}

function cleanTitle(title) {
  return title
    .replace(/^Handmade by order\s*/i, "")
    .replace(/^handmade by order\s*/i, "")
    .replace(/^Print by order\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function shortDisplayTitle(title) {
  const t = cleanTitle(title);
  // Prefer first meaningful clause under ~60 chars for cards
  if (t.length <= 56) return t;
  const cut = t.slice(0, 56);
  const sp = cut.lastIndexOf(" ");
  return (sp > 30 ? cut.slice(0, sp) : cut).trim();
}

function categorize(title, tags, productType) {
  const t = `${title} ${tags.join(" ")} ${productType || ""}`.toLowerCase();
  if (t.includes("cushion")) return "cushion-covers";
  if (t.includes("kit")) return "lampshade-kits";
  if (
    title.toLowerCase().startsWith("print by order") ||
    (t.includes("fabric") && !t.includes("lamp shade") && !t.includes("lampshade"))
  ) {
    return "fabrics";
  }
  if (t.includes("foil")) return "foil-lined";
  if (t.includes("linen") && t.includes("lamp")) return "linen-lampshades";
  if (t.includes("rectangular") || t.includes("rounded rectangular"))
    return "rectangular";
  if (t.includes("oval")) return "oval";
  if (t.includes("square")) return "square";
  if (t.includes("empire")) return "empire";
  if (t.includes("coolie")) return "coolie";
  if (t.includes("drum")) return "drum";
  return "lampshades";
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const all = [];
  for (let page = 1; page <= 50; page++) {
    const url = `${BASE}/products.json?limit=250&page=${page}`;
    console.log("fetch page", page);
    const data = await fetchJson(url);
    const batch = data.products || [];
    if (!batch.length) break;
    all.push(...batch);
    console.log("  +", batch.length, "total", all.length);
    if (batch.length < 250) break;
  }

  let imageCount = 0;
  let variantCount = 0;
  const byCategory = {};
  const heicImages = [];
  const products = all.map((p) => {
    const tags = Array.isArray(p.tags)
      ? p.tags
      : String(p.tags || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
    const category = categorize(p.title, tags, p.product_type);
    byCategory[category] = (byCategory[category] || 0) + 1;
    const images = (p.images || []).map((img, idx) => {
      imageCount++;
      const src = img.src;
      if (/\.heic(\?|$)/i.test(src)) heicImages.push(src);
      return {
        id: String(img.id),
        src,
        position: img.position ?? idx + 1,
        width: img.width,
        height: img.height,
        variantIds: (img.variant_ids || []).map(String),
        alt: img.alt || p.title,
      };
    });
    const variants = (p.variants || []).map((v) => {
      variantCount++;
      return {
        id: String(v.id),
        title: v.title,
        sku: v.sku || null,
        price: v.price,
        compareAtPrice: v.compare_at_price,
        available: v.available !== false,
        option1: v.option1,
        option2: v.option2,
        option3: v.option3,
        weight: v.weight,
        weightUnit: v.weight_unit,
        imageId: v.image_id ? String(v.image_id) : null,
        barcode: v.barcode || null,
      };
    });
    return {
      shopifyId: String(p.id),
      handle: p.handle,
      title: p.title,
      displayTitle: shortDisplayTitle(p.title),
      bodyHtml: p.body_html || "",
      vendor: p.vendor,
      productType: p.product_type || "",
      tags,
      category,
      options: p.options || [],
      images,
      variants,
      publishedAt: p.published_at,
      status: "published",
      source: "shopify-public-products.json",
      preliminary: true,
    };
  });

  const catalog = {
    fetchedAt: new Date().toISOString(),
    source: `${BASE}/products.json`,
    authority: "PRELIMINARY — public products.json; Admin API required for authoritative migration",
    counts: {
      products: products.length,
      variants: variantCount,
      images: imageCount,
      heicImages: heicImages.length,
      categories: byCategory,
    },
    products,
  };

  fs.writeFileSync(
    path.join(OUT_DIR, "shopify-catalog.json"),
    JSON.stringify(catalog, null, 2)
  );
  fs.writeFileSync(
    path.join(OUT_DIR, "reconciliation-preliminary.json"),
    JSON.stringify(
      {
        fetchedAt: catalog.fetchedAt,
        sourceCounts: catalog.counts,
        notes: [
          "Public products.json does not include draft/archived products.",
          "Variant option semantics may be incomplete vs Admin API.",
          "HEIC files require conversion before web display.",
          "Etsy unique items not included until authorized export provided.",
        ],
        heicSample: heicImages.slice(0, 20),
      },
      null,
      2
    )
  );

  console.log(JSON.stringify(catalog.counts, null, 2));
  console.log("Wrote data/shopify-catalog.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
