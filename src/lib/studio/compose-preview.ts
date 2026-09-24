import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";
import { liningSwatchHex } from "@/lib/studio/images";
import { normalizeImageSrc } from "@/lib/image";

const W = 900;
const H = 1125;
const CACHE_MAX = 64;
const RENDER_VERSION = "photo-fabric-v4";

type CacheEntry = { buf: Buffer; at: number };
const cache = new Map<string, CacheEntry>();

export type ComposeInput = {
  shapeImageUrl: string;
  fabricUrl: string;
  liningName?: string | null;
  liningColour?: string | null;
};

async function loadImageBuffer(src: string): Promise<Buffer> {
  const url = normalizeImageSrc(src);
  if (url.startsWith("/")) {
    const file = path.join(process.cwd(), "public", url.replace(/^\//, ""));
    return fs.readFile(file);
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch image (${res.status})`);
    return Buffer.from(await res.arrayBuffer());
  }
  throw new Error("Unsupported image URL");
}

function remember(key: string, buf: Buffer) {
  cache.set(key, { buf, at: Date.now() });
  if (cache.size <= CACHE_MAX) return;
  let oldestKey = "";
  let oldestAt = Infinity;
  for (const [k, v] of cache) {
    if (v.at < oldestAt) {
      oldestAt = v.at;
      oldestKey = k;
    }
  }
  if (oldestKey) cache.delete(oldestKey);
}

function clamp(n: number): number {
  return n < 0 ? 0 : n > 255 ? 255 : n | 0;
}

/**
 * Exact shape-step photo with the selected fabric’s colour character applied.
 * Composition, lighting and backdrop stay the same — only the cloth colours move.
 */
export async function composeStudioPreview(input: ComposeInput): Promise<Buffer> {
  const liningHex = liningSwatchHex(input.liningName, input.liningColour);
  const cacheKey = [
    RENDER_VERSION,
    normalizeImageSrc(input.shapeImageUrl),
    normalizeImageSrc(input.fabricUrl),
    liningHex,
  ].join("|");

  const hit = cache.get(cacheKey);
  if (hit) {
    hit.at = Date.now();
    return hit.buf;
  }

  const [shapeRaw, fabricRaw] = await Promise.all([
    loadImageBuffer(input.shapeImageUrl),
    loadImageBuffer(input.fabricUrl),
  ]);

  const baseBuf = await sharp(shapeRaw)
    .rotate()
    .resize(W, H, { fit: "cover", position: "centre" })
    .ensureAlpha()
    .png()
    .toBuffer();

  // Fabric layer at ~55% alpha so the original photo still reads clearly
  const fabricOpaque = await sharp(fabricRaw)
    .rotate()
    .resize(W, H, { fit: "cover", position: "centre" })
    .ensureAlpha()
    .modulate({ saturation: 1.2 })
    .raw()
    .toBuffer();

  for (let i = 3; i < fabricOpaque.length; i += 4) {
    fabricOpaque[i] = 150;
  }

  const fabricSoft = await sharp(fabricOpaque, {
    raw: { width: W, height: H, channels: 4 },
  })
    .png()
    .toBuffer();

  // Soft-light: same picture, fabric colours bleed into the cloth areas
  let png = await sharp(baseBuf)
    .composite([{ input: fabricSoft, blend: "soft-light" }])
    .png()
    .toBuffer();

  // Second gentle colour pass (multiply of desaturated fabric × photo luma feel)
  const fabricTint = await sharp(fabricRaw)
    .rotate()
    .resize(W, H, { fit: "cover", position: "centre" })
    .ensureAlpha()
    .modulate({ saturation: 1.35, brightness: 1.05 })
    .raw()
    .toBuffer();
  for (let i = 3; i < fabricTint.length; i += 4) {
    fabricTint[i] = 90;
  }
  const fabricTintPng = await sharp(fabricTint, {
    raw: { width: W, height: H, channels: 4 },
  })
    .png()
    .toBuffer();

  png = await sharp(png)
    .composite([{ input: fabricTintPng, blend: "soft-light" }])
    .png()
    .toBuffer();

  // Pull slightly back toward the original so it stays “the same photo”
  const base = await sharp(baseBuf).raw().ensureAlpha().toBuffer();
  const cur = await sharp(png).raw().ensureAlpha().toBuffer();
  const out = Buffer.alloc(W * H * 4);
  const keep = 0.28; // 28% original → recognisably the first picture

  for (let i = 0; i < out.length; i += 4) {
    out[i] = clamp(cur[i] * (1 - keep) + base[i] * keep);
    out[i + 1] = clamp(cur[i + 1] * (1 - keep) + base[i + 1] * keep);
    out[i + 2] = clamp(cur[i + 2] * (1 - keep) + base[i + 2] * keep);
    out[i + 3] = base[i + 3];
  }

  png = await sharp(out, { raw: { width: W, height: H, channels: 4 } })
    .png()
    .toBuffer();

  const liningWash = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="g" cx="50%" cy="72%" r="36%">
          <stop offset="0%" stop-color="${liningHex}" stop-opacity="0.28"/>
          <stop offset="70%" stop-color="${liningHex}" stop-opacity="0.08"/>
          <stop offset="100%" stop-color="${liningHex}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
    </svg>`
  );

  png = await sharp(png)
    .composite([{ input: liningWash, blend: "soft-light" }])
    .png({ compressionLevel: 8 })
    .toBuffer();

  remember(cacheKey, png);
  return png;
}
