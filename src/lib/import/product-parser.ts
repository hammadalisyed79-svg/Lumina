import type { SourceImage, SourceProduct, SourceVariant } from "./migration-types";
import { BASE, fetchJson, sleep } from "./http";
import { highResShopifyUrl } from "./image-urls";
import {
  cleanDisplayName,
  detectCategory,
  detectMaterial,
  detectPersonalisation,
  detectShapeKey,
  deriveColourTags,
  deriveMoodTags,
  derivePatternTags,
  extractLeadTimeDays,
  polishDescription,
  stripHtml,
} from "./normalizer";

type ShopifyProductJson = {
  product: {
    id: number | string;
    handle: string;
    title: string;
    body_html: string;
    vendor: string;
    product_type: string;
    tags: string | string[];
    options?: { name: string; values: string[] }[];
    images?: {
      id: number | string;
      src: string;
      position?: number;
      width?: number;
      height?: number;
      alt?: string | null;
    }[];
    variants?: {
      id: number | string;
      title: string;
      sku: string | null;
      price: string;
      compare_at_price: string | null;
      available: boolean;
      option1: string | null;
      option2: string | null;
      option3: string | null;
      image_id: number | string | null;
    }[];
  };
};

function tagsOf(raw: string | string[]): string[] {
  if (Array.isArray(raw)) return raw.map((t) => String(t).trim()).filter(Boolean);
  return String(raw || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function fetchProductByHandle(
  handle: string,
  collectionHandles: string[]
): Promise<SourceProduct> {
  const data = await fetchJson<ShopifyProductJson>(
    `${BASE}/products/${encodeURIComponent(handle)}.json`
  );
  const p = data.product;
  if (!p) throw new Error(`No product for ${handle}`);

  const tags = tagsOf(p.tags);
  const originalTitle = p.title;
  const sourceDescription = stripHtml(p.body_html || "");
  const description = polishDescription(sourceDescription);
  const category = detectCategory(originalTitle, tags, p.product_type || "");
  const shapeKey = detectShapeKey(originalTitle, tags, p.product_type || "");
  const colourTags = deriveColourTags(originalTitle);
  const patternTags = derivePatternTags(originalTitle);
  const moodTags = deriveMoodTags(colourTags, patternTags, originalTitle);
  const material = detectMaterial(originalTitle, sourceDescription);

  const options = (p.options || []).map((o) => ({
    name: o.name,
    values: o.values || [],
  }));

  const variants: SourceVariant[] = (p.variants || []).map((v) => ({
    id: String(v.id),
    title: v.title,
    sku: v.sku || null,
    price: v.price,
    compareAtPrice: v.compare_at_price,
    available: v.available !== false,
    option1: v.option1,
    option2: v.option2,
    option3: v.option3,
    imageId: v.image_id != null ? String(v.image_id) : null,
  }));

  const prices = variants.map((v) => Number(v.price)).filter((n) => !Number.isNaN(n));
  const basePrice = prices.length ? Math.min(...prices).toFixed(2) : "0.00";
  const compareAts = variants
    .map((v) => (v.compareAtPrice ? Number(v.compareAtPrice) : NaN))
    .filter((n) => !Number.isNaN(n));
  const compareAtPrice = compareAts.length ? Math.min(...compareAts).toFixed(2) : null;

  const availCount = variants.filter((v) => v.available).length;
  const sourceAvailability =
    availCount === 0 ? "sold_out" : availCount === variants.length ? "available" : "mixed";

  const images: SourceImage[] = (p.images || []).map((img, idx) => ({
    id: String(img.id),
    src: img.src,
    highResSrc: highResShopifyUrl(img.src),
    position: img.position ?? idx + 1,
    width: img.width ?? null,
    height: img.height ?? null,
    alt: img.alt || originalTitle,
  }));

  const reviewReasons: string[] = [];
  if (!images.length) reviewReasons.push("no_images");
  if (sourceAvailability === "sold_out") reviewReasons.push("source_sold_out");
  if (!variants.length) reviewReasons.push("no_variants");
  if (Number(basePrice) <= 0) reviewReasons.push("zero_price");

  const shortDescription =
    description.slice(0, 220).replace(/\s+\S*$/, "") + (description.length > 220 ? "…" : "");

  return {
    sourceWebsite: BASE,
    sourceProductUrl: `${BASE}/products/${p.handle}`,
    sourceHandle: p.handle,
    shopifyId: String(p.id),
    originalTitle,
    displayName: cleanDisplayName(originalTitle),
    bodyHtml: p.body_html || "",
    sourceDescription,
    description,
    shortDescription,
    vendor: p.vendor || "Lumina Hub",
    productType: p.product_type || "",
    tags,
    collectionHandles: [...new Set(collectionHandles)],
    category,
    shapeKey,
    material,
    colourTags,
    patternTags,
    moodTags,
    currency: "GBP",
    basePrice,
    compareAtPrice,
    sourceAvailability,
    options,
    variants,
    images,
    personalisationSupported: detectPersonalisation(options, sourceDescription),
    leadTimeDays: extractLeadTimeDays(sourceDescription) ?? 7,
    migrationStatus: "PARSED",
    needsReview: reviewReasons.length > 0,
    reviewReasons,
    parsedAt: new Date().toISOString(),
  };
}

export async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
      await sleep(120);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return out;
}
