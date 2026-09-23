const fs = require("fs");
const path = require("path");

const src =
  "C:/Users/Tahir/.cursor/projects/c-HUB/agent-tools/73d9b2e6-b018-42ea-b925-b5092260b044.txt";
const raw = fs.readFileSync(src, "utf8");
const data = JSON.parse(raw);

function categorize(title, tags, productType) {
  const t = `${title} ${tags.join(" ")} ${productType || ""}`.toLowerCase();
  if (t.includes("cushion")) return "Cushion Covers";
  if (t.includes("kit")) return "Kits";
  if (
    (t.includes("fabric") && !t.includes("lamp")) ||
    t.includes("velvet fabric") ||
    title.toLowerCase().startsWith("print by order")
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
    .slice(0, 100);
}

const products = data.products.map((p) => {
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

const cats = {};
for (const p of products) cats[p.category] = (cats[p.category] || 0) + 1;
console.log("products", products.length);
console.log("with images", products.filter((p) => p.image).length);
console.log("categories", cats);
console.log(
  "price",
  Math.min(...products.map((p) => p.price)),
  "-",
  Math.max(...products.map((p) => p.price))
);
