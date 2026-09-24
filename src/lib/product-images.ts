import path from "path";
import { existsSync } from "fs";
import { isWebImageUrl } from "@/lib/utils";

export type CardImage = {
  url: string;
  alt?: string | null;
  sortOrder?: number;
  isPrimary?: boolean;
  contentHash?: string | null;
};

/** Explicit plan / flat metreage cues in alt or path (word-boundary where needed). */
const PLAN_HINT =
  /\b(plan|metreage|meterage|flat[\s_-]?(view|lay|fabric|shot|swatch)|swatch|detail[\s_-]?(crop|shot|view))\b/i;

/** Explicit drape / lifestyle cues — never prefer these for hover. */
const WRINKLE_HINT =
  /\b(wrinkl|drape|folded|bunch|swirl|lifestyle|interior|room\b|on[\s_-]?lamp|finished[\s_-]?shade)\b/i;

type VisionStats = {
  variance: number;
  centerDarkBias: number;
};

const visionCache = new Map<string, VisionStats | null>();

export function textSuggestsPlan(img: CardImage): boolean | null {
  const hay = `${img.alt || ""} ${img.url}`;
  if (PLAN_HINT.test(hay)) return true;
  if (WRINKLE_HINT.test(hay)) return false;
  return null;
}

function drapeScore(s: VisionStats): number {
  return Math.max(0, s.centerDarkBias) * 12 + s.variance;
}

/** Flat/plan metreage vs draped swirl — absolute gate. */
function looksPlan(s: VisionStats): boolean {
  return s.centerDarkBias < 10 && s.variance < 340;
}

function localPublicPath(url: string): string | null {
  if (!url.startsWith("/media/") && !url.startsWith("/catalog/")) return null;
  const abs = path.join(process.cwd(), "public", url.replace(/^\//, ""));
  return existsSync(abs) ? abs : null;
}

async function analyzeLocalImage(url: string): Promise<VisionStats | null> {
  const cacheKey = url;
  if (visionCache.has(cacheKey)) return visionCache.get(cacheKey) ?? null;

  const abs = localPublicPath(url);
  if (!abs) {
    visionCache.set(cacheKey, null);
    return null;
  }

  try {
    const sharp = (await import("sharp")).default;
    const { data, info } = await sharp(abs)
      .resize(48, 48, { fit: "fill" })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const w = info.width;
    const h = info.height;
    const tiles = 4;
    const tw = (w / tiles) | 0;
    const th = (h / tiles) | 0;
    const means: number[] = [];
    for (let ty = 0; ty < tiles; ty++) {
      for (let tx = 0; tx < tiles; tx++) {
        let sum = 0;
        let n = 0;
        for (let y = ty * th; y < (ty + 1) * th; y++) {
          for (let x = tx * tw; x < (tx + 1) * tw; x++) {
            sum += data[y * w + x];
            n++;
          }
        }
        means.push(sum / n);
      }
    }
    const g = means.reduce((a, b) => a + b, 0) / means.length;
    const variance = means.reduce((a, b) => a + (b - g) ** 2, 0) / means.length;
    const center = [5, 6, 9, 10].reduce((a, i) => a + means[i], 0) / 4;
    const edge =
      [0, 1, 2, 3, 4, 7, 8, 11, 12, 13, 14, 15].reduce((a, i) => a + means[i], 0) /
      12;
    const stats = { variance, centerDarkBias: edge - center };
    visionCache.set(cacheKey, stats);
    return stats;
  } catch {
    visionCache.set(cacheKey, null);
    return null;
  }
}

/**
 * Primary PLP tile image: first usable web image (typically draped fabric hero).
 */
export function pickPrimaryImageUrl(images: CardImage[]): string | null {
  const primary = images.find((i) => i.isPrimary && isWebImageUrl(i.url));
  if (primary) return primary.url;
  return images.find((i) => isWebImageUrl(i.url))?.url || null;
}

/**
 * Hover image: prefer a plan/flat metreage shot when one exists in the gallery.
 * If none is available, returns null (no swap) rather than another wrinkled shot.
 */
export async function pickPlanHoverImageUrl(
  images: CardImage[],
  primaryUrl?: string | null
): Promise<string | null> {
  const web = images.filter((i) => isWebImageUrl(i.url));
  if (web.length < 2) return null;

  const primary =
    (primaryUrl && web.find((i) => i.url === primaryUrl)) ||
    web.find((i) => i.isPrimary) ||
    web[0];
  const others = web.filter((i) => i.url !== primary.url);
  if (!others.length) return null;

  // 1) Structured / text tags
  const taggedPlan = others.find((i) => textSuggestsPlan(i) === true);
  if (taggedPlan) return taggedPlan.url;

  const untagged = others.filter((i) => textSuggestsPlan(i) !== false);

  // 2) Lightweight vision on local media (cached per URL)
  const primaryStats = await analyzeLocalImage(primary.url);
  const scored: { url: string; stats: VisionStats }[] = [];
  await Promise.all(
    untagged.map(async (img) => {
      const stats = await analyzeLocalImage(img.url);
      if (stats && looksPlan(stats)) scored.push({ url: img.url, stats });
    })
  );

  if (!scored.length) return null;

  scored.sort(
    (a, b) =>
      a.stats.variance - b.stats.variance ||
      a.stats.centerDarkBias - b.stats.centerDarkBias
  );

  const best = scored[0];
  if (!primaryStats) return best.url;

  // Must be meaningfully flatter than the primary tile
  if (drapeScore(primaryStats) - drapeScore(best.stats) < 25) return null;
  return best.url;
}

/**
 * Prefer a plan/flat hover when one exists in the gallery.
 * When `strictPlan` is true (fabric PLP), skip legacy second-image hover if no plan.
 * Otherwise fall back to the next usable gallery image.
 */
export async function pickCardHoverImageUrl(
  images: CardImage[],
  opts?: { strictPlan?: boolean; primaryUrl?: string | null }
): Promise<string | undefined> {
  const primaryUrl = opts?.primaryUrl ?? pickPrimaryImageUrl(images);
  if (!primaryUrl) return undefined;

  const plan = await pickPlanHoverImageUrl(images, primaryUrl);
  if (plan) return plan;
  if (opts?.strictPlan) return undefined;

  const hover = images.find(
    (img) => isWebImageUrl(img.url) && img.url !== primaryUrl
  );
  return hover?.url;
}
