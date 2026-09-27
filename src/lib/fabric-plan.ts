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

/**
 * Penalise scissors / props / tools in fabric photos.
 * Detect elongated low-sat chrome blobs (blade-like), not fabric print colour.
 */
export async function propPenalty(buf: Buffer): Promise<number> {
  const sharp = (await import("sharp")).default;
  const { data, info } = await sharp(buf)
    .resize(128, 128, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const ch = info.channels;
  const N = w * h;
  const mask = new Uint8Array(N);

  for (let i = 0; i < N; i++) {
    const p = i * ch;
    const r = data[p];
    const g = data[p + 1];
    const b = data[p + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    const val = max / 255;
    const greyish =
      Math.abs(r - g) < 22 && Math.abs(g - b) < 22 && Math.abs(r - b) < 22;
    // Steel/chrome blade — not cream print lines (those are warmer / less grey-balanced)
    mask[i] = sat < 0.12 && val > 0.58 && greyish ? 1 : 0;
  }

  const seen = new Uint8Array(N);
  let penalty = 0;
  let elongated = 0;
  let chromePixels = 0;

  for (let i = 0; i < N; i++) {
    if (!mask[i] || seen[i]) continue;
    const stack = [i];
    seen[i] = 1;
    let count = 0;
    let minX = w;
    let maxX = 0;
    let minY = h;
    let maxY = 0;
    while (stack.length) {
      const cur = stack.pop()!;
      count++;
      chromePixels++;
      const x = cur % w;
      const y = (cur / w) | 0;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const ni = ny * w + nx;
        if (!mask[ni] || seen[ni]) continue;
        seen[ni] = 1;
        stack.push(ni);
      }
    }
    if (count < 18) continue;
    const bw = maxX - minX + 1;
    const bh = maxY - minY + 1;
    const aspect = Math.max(bw, bh) / Math.max(1, Math.min(bw, bh));
    const fill = count / (bw * bh);
    if (aspect >= 2.4 && fill > 0.12 && count >= 28) {
      elongated++;
      penalty += 180 + Math.min(120, Math.floor(aspect * 20));
    }
  }

  if (elongated >= 1 && chromePixels / N > 0.008) penalty += 120;
  if (elongated >= 2) penalty += 100;

  if (elongated >= 1) {
    let darkNear = 0;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        if (!mask[i]) continue;
        for (const [dx, dy] of [
          [2, 0],
          [-2, 0],
          [0, 2],
          [0, -2],
          [3, 3],
          [-3, -3],
        ] as const) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const p = (ny * w + nx) * ch;
          const r = data[p];
          const g = data[p + 1];
          const b = data[p + 2];
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const sat = max === 0 ? 0 : (max - min) / max;
          const val = max / 255;
          if (sat < 0.25 && val < 0.2 && val > 0.03) darkNear++;
        }
      }
    }
    if (darkNear > 40) penalty += 100;
  }

  return penalty;
}

/** True when the frame is unsafe to wrap as a shade texture (tools/props visible). */
export async function hasUnsafeProps(url: string): Promise<boolean> {
  const abs = localPublicPath(url);
  if (!abs) return false;
  try {
    const sharp = (await import("sharp")).default;
    const buf = await sharp(abs).jpeg().toBuffer();
    return (await propPenalty(buf)) >= 100;
  } catch {
    return false;
  }
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
): Promise<{
  url: string;
  stats: PlanVisionStats | null;
  tagged: boolean;
  propScore: number;
} | null> {
  const web = images.filter((i) => isWebImageUrl(i.url));
  if (!web.length) return null;

  type Scored = {
    url: string;
    stats: PlanVisionStats | null;
    tagged: boolean;
    propScore: number;
    rank: number;
  };
  const scored: Scored[] = [];

  for (const img of web) {
    if (textSuggestsPlan(img) === false) continue;
    const abs = localPublicPath(img.url);
    let propScore = 0;
    if (abs) {
      try {
        const sharp = (await import("sharp")).default;
        const buf = await sharp(abs).jpeg().toBuffer();
        propScore = await propPenalty(buf);
      } catch {
        propScore = 0;
      }
    }
    const stats = await analyzeLocalFabricImage(img.url);
    const tagged = textSuggestsPlan(img) === true;
    const fold = stats?.foldScore ?? 80;
    // Prefer low fold + low props; heavily demote scissors/tools
    const rank = fold + propScore * 0.85 + (tagged ? -8 : 0);
    scored.push({ url: img.url, stats, tagged, propScore, rank });
  }

  if (!scored.length) {
    return { url: web[0].url, stats: null, tagged: false, propScore: 999 };
  }

  scored.sort((a, b) => a.rank - b.rank);
  const best = scored[0];
  return {
    url: best.url,
    stats: best.stats,
    tagged: best.tagged,
    propScore: best.propScore,
  };
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
  const propsUnsafe = best.propScore >= 100;
  const galleryCount = images.filter((i) => !i.url.includes("/media/plan/")).length;
  // Multi-image fabric packs often pair a flat swatch with scissors/props in-frame.
  // Never wrap the full lifestyle flat — always derive a clean corner crop.
  const mustDerive =
    propsUnsafe ||
    (opts.writeDerived && galleryCount >= 2 && !best.url.includes("/media/plan/"));

  if (!mustDerive && stats && looksPlanFold(stats)) {
    return {
      url: best.url,
      source: best.tagged || stats.foldScore < 30 ? "gallery_plan" : "already_plan",
      foldScore: stats.foldScore,
      fromUrl: best.url,
    };
  }

  if (
    !mustDerive &&
    stats &&
    stats.centerDarkBias < 4 &&
    stats.foldScore < DERIVE_FOLD_MIN
  ) {
    return {
      url: best.url,
      source: "already_plan",
      foldScore: stats.foldScore,
      fromUrl: best.url,
    };
  }

  if (!opts.writeDerived) {
    if (propsUnsafe) {
      for (const img of images) {
        if (img.url === best.url) continue;
        if (!(await hasUnsafeProps(img.url))) {
          const s = await analyzeLocalFabricImage(img.url);
          if (s && looksPlanFold(s)) {
            return {
              url: img.url,
              source: "gallery_plan",
              foldScore: s.foldScore,
              fromUrl: img.url,
            };
          }
        }
      }
    }
    return {
      url: best.url,
      source: "already_plan",
      foldScore: stats?.foldScore ?? 999,
      fromUrl: best.url,
    };
  }

  // Prefer deriving from a prop-free wrinkled frame when scissors fill the flat shot.
  // For multi-image flats, still derive from the flat frame but corner-crop away from centre props.
  let deriveFrom = best.url;
  if (propsUnsafe) {
    for (const img of images) {
      if (img.url === best.url) continue;
      if (img.url.includes("/media/plan/")) continue;
      if (!(await hasUnsafeProps(img.url))) {
        deriveFrom = img.url;
        break;
      }
    }
  } else if (mustDerive && stats && looksPlanFold(stats)) {
    deriveFrom = best.url;
  }

  const abs = localPublicPath(deriveFrom);
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
    .update(deriveFrom)
    .update("no-props-v2")
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
    fromUrl: deriveFrom,
  };
}
