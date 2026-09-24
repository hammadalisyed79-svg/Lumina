import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";
import { shapePath } from "@/lib/studio/preview";
import { liningSwatchHex } from "@/lib/studio/images";
import { normalizeImageSrc } from "@/lib/image";

const W = 800;
const H = 1000;
const CACHE_MAX = 48;

type CacheEntry = { buf: Buffer; at: number };
const cache = new Map<string, CacheEntry>();

export type ComposeInput = {
  shapeKey: string;
  fabricUrl: string;
  liningName?: string | null;
  liningColour?: string | null;
  diameterCm?: number | null;
};

function sizeScale(diameterCm?: number | null): number {
  if (diameterCm == null || !Number.isFinite(diameterCm)) return 0.92;
  return Math.min(1.05, Math.max(0.78, diameterCm / 38));
}

async function loadImageBuffer(src: string): Promise<Buffer> {
  const url = normalizeImageSrc(src);
  if (url.startsWith("/")) {
    const file = path.join(process.cwd(), "public", url.replace(/^\//, ""));
    return fs.readFile(file);
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch fabric image (${res.status})`);
    return Buffer.from(await res.arrayBuffer());
  }
  throw new Error("Unsupported fabric image URL");
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

/**
 * Generate a single finished-shade preview PNG for a shape + fabric + lining combo.
 * Uses Sharp + SVG mask — one image, no client-side overlays.
 */
export async function composeStudioPreview(input: ComposeInput): Promise<Buffer> {
  const shapeKey = input.shapeKey || "drum";
  const liningHex = liningSwatchHex(input.liningName, input.liningColour);
  const scale = sizeScale(input.diameterCm);
  const cacheKey = [
    shapeKey,
    normalizeImageSrc(input.fabricUrl),
    liningHex,
    scale.toFixed(3),
  ].join("|");

  const hit = cache.get(cacheKey);
  if (hit) {
    hit.at = Date.now();
    return hit.buf;
  }

  const fabricRaw = await loadImageBuffer(input.fabricUrl);
  const fabricJpeg = await sharp(fabricRaw)
    .rotate()
    .resize(W, H, { fit: "cover", position: "centre" })
    .jpeg({ quality: 88 })
    .toBuffer();
  const fabricData = `data:image/jpeg;base64,${fabricJpeg.toString("base64")}`;
  const d = shapePath(shapeKey);

  // viewBox 100×120 mapped into the frame with padding; size scales the shade.
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f4f0e6"/>
      <stop offset="55%" stop-color="#e6dfd2"/>
      <stop offset="100%" stop-color="#d4ccc0"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="28%" r="55%">
      <stop offset="0%" stop-color="#fffdf8" stop-opacity="0.75"/>
      <stop offset="100%" stop-color="#fffdf8" stop-opacity="0"/>
    </radialGradient>
    <mask id="shadeMask" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="120">
      <rect width="100" height="120" fill="black"/>
      <path d="${d}" fill="white"/>
    </mask>
    <linearGradient id="cyl" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#000" stop-opacity="0.38"/>
      <stop offset="18%" stop-color="#000" stop-opacity="0.08"/>
      <stop offset="48%" stop-color="#fff" stop-opacity="0.14"/>
      <stop offset="82%" stop-color="#000" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.38"/>
    </linearGradient>
    <linearGradient id="vert" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fff" stop-opacity="0.22"/>
      <stop offset="40%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.3"/>
    </linearGradient>
    <radialGradient id="lining" cx="50%" cy="94%" r="48%">
      <stop offset="0%" stop-color="${liningHex}" stop-opacity="0.9"/>
      <stop offset="50%" stop-color="${liningHex}" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="${liningHex}" stop-opacity="0"/>
    </radialGradient>
    <filter id="soft" x="-12%" y="-12%" width="124%" height="124%">
      <feDropShadow dx="0" dy="2.2" stdDeviation="1.6" flood-color="#14110e" flood-opacity="0.32"/>
    </filter>
  </defs>

  <rect width="100" height="120" fill="url(#bg)"/>
  <rect width="100" height="120" fill="url(#glow)"/>

  <line x1="50" y1="2" x2="50" y2="11" stroke="#8a8174" stroke-width="0.55" opacity="0.55"/>

  <g transform="translate(50 62) scale(${scale.toFixed(4)}) translate(-50 -62)" filter="url(#soft)">
    <image width="100" height="120" href="${fabricData}" xlink:href="${fabricData}" preserveAspectRatio="xMidYMid slice" mask="url(#shadeMask)"/>
    <path d="${d}" fill="url(#cyl)" style="mix-blend-mode:multiply"/>
    <path d="${d}" fill="url(#vert)"/>
    <path d="${d}" fill="url(#lining)"/>
    <path d="${d}" fill="none" stroke="#ffffff" stroke-opacity="0.22" stroke-width="0.35"/>
  </g>
</svg>`;

  const png = await sharp(Buffer.from(svg))
    .png({ compressionLevel: 8 })
    .toBuffer();

  remember(cacheKey, png);
  return png;
}
