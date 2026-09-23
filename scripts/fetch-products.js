const fs = require("fs");
const path = require("path");
const https = require("https");

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "LuminaHubRebuild/1.0" } }, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Parse fail ${url}: ${e.message} len=${data.length}`));
          }
        });
      })
      .on("error", reject);
  });
}

function categorize(title, tags, productType) {
  const t = `${title} ${tags.join(" ")} ${productType || ""}`.toLowerCase();
  if (t.includes("cushion")) return "Cushion Covers";
  if (t.includes("kit")) return "Kits";
  if (
    title.toLowerCase().startsWith("print by order") ||
    (t.includes("fabric") && !t.includes("lamp shade") && !t.includes("lampshade"))
  ) {
    return "Fabric";
  }
  if (t.includes("rectangular") || t.includes("rounded rectangular"))
    return "Rectangular";
  if (t.includes("oval")) return "Oval";
  if (t.includes("square")) return "Square";
  if (t.includes("empire")) return "Empire";
  if (t.includes("coolie")) return "Coolie";
  if (t.includes("drum")) return "Drum";
  return "Lamp Shades";
}

function shortTitle(title) {
  return title
    .replace(/^Handmade by order\s*/i, "")
    .replace(/^handmade by order\s*/i, "")
    .replace(/^Print by order\s*/i, "Fabric: ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 110);
}

async function main() {
  const all = [];
  for (let page = 1; page <= 20; page++) {
    const url = `https://www.luminahub.co.uk/products.json?limit=50&page=${page}`;
    console.log("fetching", page);
    const data = await fetchJson(url);
    const batch = data.products || [];
    if (!batch.length) break;
    all.push(...batch);
    console.log("  got", batch.length, "total", all.length);
    if (batch.length < 50) break;
  }

  const products = all.map((p) => {
    const variant = p.variants?.[0] || {};
    const images = (p.images || []).map((img) => img.src);
    const tags = p.tags || [];
    return {
      shopifyId: String(p.id),
      handle: p.handle,
      title: shortTitle(p.title),
      fullTitle: p.title,
      description: (p.body_html || "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 900),
      category: categorize(p.title, tags, p.product_type),
      tags,
      price: Number(variant.price || 0),
      compareAt: variant.compare_at_price
        ? Number(variant.compare_at_price)
        : null,
      currency: "GBP",
      image: images[0] || null,
      images,
      available: variant.available !== false,
      vendor: p.vendor || "Lumina Hub",
    };
  });

  const outDir = path.join(__dirname, "..", "data");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "products.json"),
    JSON.stringify(products, null, 2)
  );
  fs.writeFileSync(
    path.join(outDir, "products-raw.json"),
    JSON.stringify(all, null, 2)
  );

  const cats = {};
  for (const p of products) cats[p.category] = (cats[p.category] || 0) + 1;
  console.log("DONE products", products.length);
  console.log("with images", products.filter((p) => p.image).length);
  console.log("categories", cats);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
