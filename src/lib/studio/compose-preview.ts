import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";
import { liningSwatchHex } from "@/lib/studio/images";
import { normalizeImageSrc } from "@/lib/image";
import { shadeGeom, shadeSizeScale } from "@/lib/studio/shade-geom";

const W = 900;
const H = 1125;
const CACHE_MAX = 64;
const RENDER_VERSION = "shade-v4";

type CacheEntry = { buf: Buffer; at: number };
const cache = new Map<string, CacheEntry>();

export type ComposeInput = {
  shapeKey: string;
  shapeName?: string | null;
  fabricUrl: string;
  fabricName?: string | null;
  liningName?: string | null;
  liningColour?: string | null;
  diameterCm?: number | null;
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

export async function composeStudioPreview(input: ComposeInput): Promise<Buffer> {
  const shapeKey = (input.shapeKey || "drum").toLowerCase();
  const g = shadeGeom(shapeKey);
  const liningHex = liningSwatchHex(input.liningName, input.liningColour);
  const scale = shadeSizeScale(input.diameterCm);
  const title = input.shapeName?.trim() || g.label;
  const fabricLabel = input.fabricName?.trim() || "Selected fabric";
  const sizeLabel =
    input.diameterCm != null && Number.isFinite(input.diameterCm)
      ? `Ø ${Math.round(input.diameterCm)} cm`
      : "Made to order";
  const liningLabel = input.liningName?.trim() || "Lining";

  const cacheKey = [
    RENDER_VERSION,
    shapeKey,
    normalizeImageSrc(input.fabricUrl),
    liningHex,
    scale.toFixed(3),
    title,
    fabricLabel,
    sizeLabel,
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
    .modulate({ saturation: 1.05 })
    .jpeg({ quality: 90 })
    .toBuffer();
  const fabricData = `data:image/jpeg;base64,${fabricJpeg.toString("base64")}`;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="studio" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f7f3ea"/>
      <stop offset="45%" stop-color="#ebe4d7"/>
      <stop offset="100%" stop-color="#d8d0c2"/>
    </linearGradient>
    <radialGradient id="spot" cx="50%" cy="22%" r="48%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <mask id="bodyMask" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="120">
      <rect width="100" height="120" fill="black"/>
      <path d="${g.body}" fill="white"/>
    </mask>
    <linearGradient id="cyl" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#1a1510" stop-opacity="0.45"/>
      <stop offset="16%" stop-color="#1a1510" stop-opacity="0.12"/>
      <stop offset="48%" stop-color="#ffffff" stop-opacity="0.2"/>
      <stop offset="84%" stop-color="#1a1510" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#1a1510" stop-opacity="0.45"/>
    </linearGradient>
    <linearGradient id="falloff" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.18"/>
      <stop offset="55%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.22"/>
    </linearGradient>
    <radialGradient id="liningGlow" cx="50%" cy="50%" r="65%">
      <stop offset="0%" stop-color="${liningHex}" stop-opacity="1"/>
      <stop offset="55%" stop-color="${liningHex}" stop-opacity="0.75"/>
      <stop offset="100%" stop-color="#2a2018" stop-opacity="0.9"/>
    </radialGradient>
    <linearGradient id="rimMetal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#e8d9b8"/>
      <stop offset="45%" stop-color="#c4a574"/>
      <stop offset="100%" stop-color="#8a7348"/>
    </linearGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2.4" stdDeviation="1.8" flood-color="#14110e" flood-opacity="0.35"/>
    </filter>
  </defs>

  <rect width="100" height="120" fill="url(#studio)"/>
  <rect width="100" height="120" fill="url(#spot)"/>
  <text x="50" y="8.2" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="2.6" fill="#6b6358" letter-spacing="0.35">${esc(
    "LAMPSHADES · HANDMADE IN BRITAIN"
  )}</text>
  <line x1="50" y1="10" x2="50" y2="${g.cordTo}" stroke="#7a7268" stroke-width="0.45" opacity="0.65"/>
  <ellipse cx="50" cy="${g.cordTo}" rx="1.6" ry="0.7" fill="url(#rimMetal)" opacity="0.9"/>
  <ellipse cx="50" cy="110" rx="${(g.botRx * 0.95).toFixed(2)}" ry="3.2" fill="#14110e" opacity="0.16" transform="translate(50 110) scale(${scale.toFixed(
    4
  )}) translate(-50 -110)"/>

  <g transform="translate(50 60) scale(${scale.toFixed(4)}) translate(-50 -60)" filter="url(#soft)">
    <image width="100" height="120" href="${fabricData}" xlink:href="${fabricData}" preserveAspectRatio="xMidYMid slice" mask="url(#bodyMask)"/>
    <path d="${g.body}" fill="url(#cyl)"/>
    <path d="${g.body}" fill="url(#falloff)"/>
    <ellipse cx="${g.topCx}" cy="${g.topCy}" rx="${g.topRx}" ry="${g.topRy}" fill="#2a241c" opacity="0.35"/>
    <ellipse cx="${g.topCx}" cy="${g.topCy}" rx="${g.topRx}" ry="${g.topRy}" fill="none" stroke="url(#rimMetal)" stroke-width="0.55"/>
    <ellipse cx="${g.botCx}" cy="${g.botCy}" rx="${g.innerRx}" ry="${g.innerRy}" fill="url(#liningGlow)"/>
    <ellipse cx="${g.botCx}" cy="${g.botCy}" rx="${g.botRx}" ry="${g.botRy}" fill="none" stroke="url(#rimMetal)" stroke-width="0.5" opacity="0.85"/>
    <ellipse cx="${g.botCx}" cy="${(g.botCy + 0.5).toFixed(2)}" rx="${(g.innerRx * 0.7).toFixed(
      2
    )}" ry="${(g.innerRy * 0.55).toFixed(2)}" fill="${liningHex}" opacity="0.35"/>
  </g>

  <text x="50" y="114.5" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="2.35" fill="#5c554c">${esc(
    `${title}  ·  ${fabricLabel}  ·  ${sizeLabel}  ·  ${liningLabel}`
  )}</text>
</svg>`;

  const png = await sharp(Buffer.from(svg))
    .png({ compressionLevel: 8 })
    .toBuffer();

  remember(cacheKey, png);
  return png;
}
