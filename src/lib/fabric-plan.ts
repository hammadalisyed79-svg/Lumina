/**
 * Plan / flat fabric texture helpers for Design Your Shade.
 * Reuses the same fold-vs-plan vision cues as product-images hover picking,
 * plus illumination flattening when only a wrinkled photo exists.
 */
import path from "path";
import { existsSync, mkdirSync } from "fs";
import { createHash } from "crypto";
import { isWebImageUrl } from "@/lib/utils";
import {
  textSuggestsPlan,
  type CardImage,
} from "@/lib/product-images";

export type PlanVisionStats = {
  variance: number;
  centerDarkBias: number;
  mean: number;
  /** Higher = more draped / swirled. */
  foldScore: number;
};

export type PlanResolveResult = {
  url: string;
  source: "gallery_plan" | "already_plan" | "derived_crop";
  foldScore: number;
  fromUrl: string;
};

const PLAN_FOLD_MAX = 48;
const DERIVE_FOLD_MIN = 55;

function localPublicPath(url: string): string | null {
  if (!url.startsWith("/media/") && !url.startsWith("/catalog/")) return null;
  const abs = path.join(process.cwd(), "public", url.replace(/^\//, ""));
  return existsSync(abs) ? abs : null;
}

/** Fold proxy: soft center swirl + excess low-freq variance (not pattern colour). */
export function foldScoreFromStats(s: {
  variance: number;
  centerDarkBias: number;
}): number {
  return (
    Math.max(0, s.centerDarkBias) * 20 + Math.max(0, s.variance - 200) * 0.2
  );
}

export function looksPlanFold(s: PlanVisionStats): boolean {
  return s.foldScore < PLAN_FOLD_MAX && s.centerDarkBias < 8;
}

async function analyzeBuffer(buf: Buffer): Promise<PlanVisionStats> {
  const sharp = (await import("sharp")).default;
  const { data, info } = await sharp(buf)
    .resize(48, 48, { fit: "fill" })
    .grayscale()
    .blur(1.6)
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
  const centerDarkBias = edge - center;
  return {
    variance,
    centerDarkBias,
    mean: g,
    foldScore: foldScoreFromStats({ variance, centerDarkBias }),
  };
}

export async function analyzeLocalFabricImage(
  url: string
): Promise<PlanVisionStats | null> {
  const abs = localPublicPath(url);
  if (!abs) return null;
  try {
    const sharp = (await import("sharp")).default;
    const buf = await sharp(abs).jpeg().toBuffer();
    return analyzeBuffer(buf);
  } catch {
    return null;
  }
}

/**
 * Remove soft fold lighting while preserving print colours.
 * Divides by a heavy blur of luminance (homomorphic-style flatten).
 */
export async function flattenIllumination(
  input: Buffer,
  size = 960
): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  const { data, info } = await sharp(input)
    .resize(size, size, { fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const gray = Buffer.alloc(width * height);
  for (let i = 0, p = 0; i < gray.length; i++, p += channels) {
    gray[i] = Math.round(
      0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2]
    );
  }
  const blurredGray = await sharp(gray, {
    raw: { width, height, channels: 1 },
  })
    .blur(48)
    .raw()
    .toBuffer();

  const out = Buffer.alloc(data.length);
  const mid = 142;
  for (let i = 0, p = 0; i < blurredGray.length; i++, p += channels) {
    const illum = Math.max(24, blurredGray[i]);
    // Soften correction so deep folds compress without crushing colour
    const rawScale = mid / illum;
    const scale = 1 + (rawScale - 1) * 0.92;
    out[p] = Math.min(255, Math.max(0, Math.round(data[p] * scale)));
    out[p + 1] = Math.min(255, Math.max(0, Math.round(data[p + 1] * scale)));
    out[p + 2] = Math.min(255, Math.max(0, Math.round(data[p + 2] * scale)));
  }

  // Second pass: gentler residual shadow lift
  const pass1 = await sharp(out, { raw: { width, height, channels } })
    .jpeg({ quality: 95 })
    .toBuffer();
  const { data: d2, info: i2 } = await sharp(pass1)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const gray2 = Buffer.alloc(i2.width * i2.height);
  for (let i = 0, p = 0; i < gray2.length; i++, p += i2.channels) {
    gray2[i] = Math.round(
      0.299 * d2[p] + 0.587 * d2[p + 1] + 0.114 * d2[p + 2]
    );
  }
  const blur2 = await sharp(gray2, {
    raw: { width: i2.width, height: i2.height, channels: 1 },
  })
    .blur(22)
    .raw()
    .toBuffer();
  const out2 = Buffer.alloc(d2.length);
  for (let i = 0, p = 0; i < blur2.length; i++, p += i2.channels) {
    const illum = Math.max(28, blur2[i]);
    const scale = 1 + (140 / illum - 1) * 0.55;
    out2[p] = Math.min(255, Math.max(0, Math.round(d2[p] * scale)));
    out2[p + 1] = Math.min(255, Math.max(0, Math.round(d2[p + 1] * scale)));
    out2[p + 2] = Math.min(255, Math.max(0, Math.round(d2[p + 2] * scale)));
  }

  return sharp(out2, {
    raw: { width: i2.width, height: i2.height, channels: i2.channels },
  })
    .modulate({ saturation: 1.06 })
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
}

/** Penalise dark corner blobs (scissors / props). */
async function propPenalty(buf: Buffer): Promise<number> {
  const sharp = (await import("sharp")).default;
  const { data, info } = await sharp(buf)
    .resize(64, 64, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const corners = [
    [0, 0, 14, 14],
    [w - 14, 0, w, 14],
    [0, h - 14, 14, h],
    [w - 14, h - 14, w, h],
  ];
  let penalty = 0;
  for (const [x0, y0, x1, y1] of corners) {
    let dark = 0;
    let n = 0;
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const v = data[y * w + x];
        n++;
        if (v < 42) dark++;
      }
    }
    if (n && dark / n > 0.22) penalty += 80;
  }
  return penalty;
}

export async function derivePlanCropBuffer(
  absPath: string
): Promise<{ buffer: Buffer; foldScore: number } | null> {
  const sharp = (await import("sharp")).default;
  try {
    const meta = await sharp(absPath).metadata();
    const W = meta.width || 800;
    const H = meta.height || 800;
    const cropSize = Math.floor(Math.min(W, H) * 0.42);

    type Cand = { score: number; buf: Buffer };
    const cands: Cand[] = [];
    // Bias toward edges/corners — center swirls are common in fabric lifestyle shots
    const positions = [0.02, 0.08, 0.18, 0.32, 0.48, 0.58];

    for (const fy of positions) {
      for (const fx of positions) {
        const left = Math.max(0, Math.min(W - cropSize, Math.floor(W * fx)));
        const top = Math.max(0, Math.min(H - cropSize, Math.floor(H * fy)));
        const cropBuf = await sharp(absPath)
          .extract({ left, top, width: cropSize, height: cropSize })
          .jpeg()
          .toBuffer();
        const stats = await analyzeBuffer(cropBuf);
        const prop = await propPenalty(cropBuf);
        cands.push({ score: stats.foldScore + prop, buf: cropBuf });
      }
    }

    cands.sort((a, b) => a.score - b.score);
    const best = cands[0];
    if (!best) return null;

    const flat = await flattenIllumination(best.buf, 960);
    const after = await analyzeBuffer(flat);
    return { buffer: flat, foldScore: after.foldScore };
  } catch {
    return null;
  }
}

/**
 * Pick the flattest gallery image when one exists (text tags + fold score).
 */
export async function pickBestPlanSource(
  images: CardImage[]
): Promise<{ url: string; stats: PlanVisionStats | null; tagged: boolean } | null> {
  const web = images.filter((i) => isWebImageUrl(i.url));
  if (!web.length) return null;

  const tagged = web.find((i) => textSuggestsPlan(i) === true);
  if (tagged) {
    const stats = await analyzeLocalFabricImage(tagged.url);
    return { url: tagged.url, stats, tagged: true };
  }

  const scored: { url: string; stats: PlanVisionStats }[] = [];
  for (const img of web) {
    if (textSuggestsPlan(img) === false) continue;
    const stats = await analyzeLocalFabricImage(img.url);
    if (!stats) continue;
    scored.push({ url: img.url, stats });
  }
  if (!scored.length) {
    return { url: web[0].url, stats: null, tagged: false };
  }

  scored.sort(
    (a, b) =>
      a.stats.foldScore - b.stats.foldScore ||
      a.stats.centerDarkBias - b.stats.centerDarkBias
  );
  return { url: scored[0].url, stats: scored[0].stats, tagged: false };
}

/**
 * Resolve a configurator plan/texture URL for a fabric.
 * Writes derived crops under public/media/plan/<slug>.jpg when needed.
 */
export async function resolveFabricPlanTexture(opts: {
  slug: string;
  images: CardImage[];
  fallbackUrls?: (string | null | undefined)[];
  writeDerived?: boolean;
}): Promise<PlanResolveResult | null> {
  const extras: CardImage[] = (opts.fallbackUrls || [])
    .filter((u): u is string => !!u && isWebImageUrl(u))
    .map((url) => ({ url }));

  const gallery = [...opts.images, ...extras];
  // Dedupe by url
  const seen = new Set<string>();
  const images = gallery.filter((i) => {
    if (seen.has(i.url)) return false;
    seen.add(i.url);
    return true;
  });

  const best = await pickBestPlanSource(images);
  if (!best) return null;

  const stats = best.stats;
  if (stats && looksPlanFold(stats)) {
    return {
      url: best.url,
      source: best.tagged || stats.foldScore < 30 ? "gallery_plan" : "already_plan",
      foldScore: stats.foldScore,
      fromUrl: best.url,
    };
  }

  // Already-flat digital patterns can have high colour variance but low bias
  if (stats && stats.centerDarkBias < 4 && stats.foldScore < DERIVE_FOLD_MIN) {
    return {
      url: best.url,
      source: "already_plan",
      foldScore: stats.foldScore,
      fromUrl: best.url,
    };
  }

  if (!opts.writeDerived) {
    return {
      url: best.url,
      source: "already_plan",
      foldScore: stats?.foldScore ?? 999,
      fromUrl: best.url,
    };
  }

  const abs = localPublicPath(best.url);
  if (!abs) {
    return {
      url: best.url,
      source: "already_plan",
      foldScore: stats?.foldScore ?? 999,
      fromUrl: best.url,
    };
  }

  const derived = await derivePlanCropBuffer(abs);
  if (!derived) {
    return {
      url: best.url,
      source: "already_plan",
      foldScore: stats?.foldScore ?? 999,
      fromUrl: best.url,
    };
  }

  const outDir = path.join(process.cwd(), "public", "media", "plan");
  mkdirSync(outDir, { recursive: true });
  const hash = createHash("sha1")
    .update(opts.slug)
    .update(best.url)
    .digest("hex")
    .slice(0, 8);
  const fileName = `${opts.slug.slice(0, 48)}-${hash}.jpg`;
  const outAbs = path.join(outDir, fileName);
  const sharp = (await import("sharp")).default;
  await sharp(derived.buffer).toFile(outAbs);
  const url = `/media/plan/${fileName}`;

  return {
    url,
    source: "derived_crop",
    foldScore: derived.foldScore,
    fromUrl: best.url,
  };
}
