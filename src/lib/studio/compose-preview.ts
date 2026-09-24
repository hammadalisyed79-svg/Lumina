import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";
import { liningSwatchHex } from "@/lib/studio/images";
import { normalizeImageSrc } from "@/lib/image";

const W = 900;
const H = 1125;
const CACHE_MAX = 64;
const RENDER_VERSION = "shade-v3";

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

type ShadeGeom = {
  /** Closed path for fabric-covered outer surface (viewBox 0 0 100 120). */
  body: string;
  topCx: number;
  topCy: number;
  topRx: number;
  topRy: number;
  botCx: number;
  botCy: number;
  botRx: number;
  botRy: number;
  /** Inner opening slightly inset for lining. */
  innerRx: number;
  innerRy: number;
  cordTo: number;
  label: string;
};

function geomFor(shapeKey: string): ShadeGeom {
  switch (shapeKey) {
    case "empire":
      return {
        body: "M34 26 A16 5.5 0 0 1 66 26 L86 96 A36 9 0 0 1 14 96 Z",
        topCx: 50,
        topCy: 26,
        topRx: 16,
        topRy: 5.5,
        botCx: 50,
        botCy: 96,
        botRx: 36,
        botRy: 9,
        innerRx: 32,
        innerRy: 7.5,
        cordTo: 20,
        label: "Empire lampshade",
      };
    case "coolie":
      return {
        body: "M38 22 A12 4.5 0 0 1 62 22 L92 98 A42 10 0 0 1 8 98 Z",
        topCx: 50,
        topCy: 22,
        topRx: 12,
        topRy: 4.5,
        botCx: 50,
        botCy: 98,
        botRx: 42,
        botRy: 10,
        innerRx: 37,
        innerRy: 8,
        cordTo: 17,
        label: "Coolie lampshade",
      };
    case "oval":
      return {
        body: "M18 30 A32 8 0 0 1 82 30 L82 94 A32 9 0 0 1 18 94 Z",
        topCx: 50,
        topCy: 30,
        topRx: 32,
        topRy: 8,
        botCx: 50,
        botCy: 94,
        botRx: 32,
        botRy: 9,
        innerRx: 28,
        innerRy: 7,
        cordTo: 22,
        label: "Oval lampshade",
      };
    case "square":
      return {
        body: "M30 24 H70 Q76 24 76 30 V92 Q76 98 70 98 H30 Q24 98 24 92 V30 Q24 24 30 24 Z",
        topCx: 50,
        topCy: 28,
        topRx: 22,
        topRy: 4,
        botCx: 50,
        botCy: 96,
        botRx: 24,
        botRy: 5,
        innerRx: 20,
        innerRy: 4,
        cordTo: 18,
        label: "Square lampshade",
      };
    case "rectangular":
      return {
        body: "M12 32 H88 Q94 32 94 38 V88 Q94 94 88 94 H12 Q6 94 6 88 V38 Q6 32 12 32 Z",
        topCx: 50,
        topCy: 36,
        topRx: 40,
        topRy: 5,
        botCx: 50,
        botCy: 90,
        botRx: 40,
        botRy: 6,
        innerRx: 36,
        innerRy: 4.5,
        cordTo: 26,
        label: "Rectangular lampshade",
      };
    case "tiered":
      return {
        body:
          "M36 16 H64 Q68 16 68 20 V32 Q68 36 64 36 H36 Q32 36 32 32 V20 Q32 16 36 16 Z M28 40 H72 Q76 40 76 44 V58 Q76 62 72 62 H28 Q24 62 24 58 V44 Q24 40 28 40 Z M18 66 H82 Q88 66 88 70 V100 Q88 106 82 106 H18 Q12 106 12 100 V70 Q12 66 18 66 Z",
        topCx: 50,
        topCy: 18,
        topRx: 16,
        topRy: 3.5,
        botCx: 50,
        botCy: 104,
        botRx: 34,
        botRy: 7,
        innerRx: 30,
        innerRy: 5.5,
        cordTo: 12,
        label: "Tiered pendant",
      };
    case "drum":
    default:
      return {
        body: "M28 28 A22 6.5 0 0 1 72 28 L72 96 A22 7.5 0 0 1 28 96 Z",
        topCx: 50,
        topCy: 28,
        topRx: 22,
        topRy: 6.5,
        botCx: 50,
        botCy: 96,
        botRx: 22,
        botRy: 7.5,
        innerRx: 18.5,
        innerRy: 5.8,
        cordTo: 21,
        label: "Drum lampshade",
      };
  }
}

function sizeScale(diameterCm?: number | null): number {
  if (diameterCm == null || !Number.isFinite(diameterCm)) return 0.94;
  return Math.min(1.08, Math.max(0.76, diameterCm / 38));
}

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

/**
 * Product-style lampshade preview for the selected combination —
 * elliptical rims, fabric body, lining glow — reads as the lampshade category.
 */
export async function composeStudioPreview(input: ComposeInput): Promise<Buffer> {
  const shapeKey = (input.shapeKey || "drum").toLowerCase();
  const g = geomFor(shapeKey);
  const liningHex = liningSwatchHex(input.liningName, input.liningColour);
  const scale = sizeScale(input.diameterCm);
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
    <filter id="ground" x="-30%" y="-50%" width="160%" height="200%">
      <feGaussianBlur stdDeviation="1.4"/>
    </filter>
  </defs>

  <!-- Atelier backdrop -->
  <rect width="100" height="120" fill="url(#studio)"/>
  <rect width="100" height="120" fill="url(#spot)"/>

  <!-- Category caption -->
  <text x="50" y="8.2" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="2.6" fill="#6b6358" letter-spacing="0.35">${esc(
    "LAMPSHADES · HANDMADE IN BRITAIN"
  )}</text>

  <!-- Pendant cord + fitting ring -->
  <line x1="50" y1="10" x2="50" y2="${g.cordTo}" stroke="#7a7268" stroke-width="0.45" opacity="0.65"/>
  <ellipse cx="50" cy="${g.cordTo}" rx="1.6" ry="0.7" fill="url(#rimMetal)" opacity="0.9"/>

  <!-- Ground shadow -->
  <ellipse cx="50" cy="110" rx="${(g.botRx * 0.95).toFixed(2)}" ry="3.2" fill="#14110e" opacity="0.16" filter="url(#ground)" transform="translate(50 110) scale(${scale.toFixed(
    4
  )}) translate(-50 -110)"/>

  <g transform="translate(50 60) scale(${scale.toFixed(4)}) translate(-50 -60)" filter="url(#soft)">
    <!-- Fabric on shade body -->
    <image width="100" height="120" href="${fabricData}" xlink:href="${fabricData}" preserveAspectRatio="xMidYMid slice" mask="url(#bodyMask)"/>
    <path d="${g.body}" fill="url(#cyl)"/>
    <path d="${g.body}" fill="url(#falloff)"/>

    <!-- Top rim (ellipse catches light) -->
    <ellipse cx="${g.topCx}" cy="${g.topCy}" rx="${g.topRx}" ry="${g.topRy}" fill="#2a241c" opacity="0.35"/>
    <ellipse cx="${g.topCx}" cy="${g.topCy}" rx="${g.topRx}" ry="${g.topRy}" fill="none" stroke="url(#rimMetal)" stroke-width="0.55"/>
    <ellipse cx="${g.topCx}" cy="${(g.topCy - 0.4).toFixed(2)}" rx="${(g.topRx * 0.92).toFixed(
      2
    )}" ry="${(g.topRy * 0.75).toFixed(2)}" fill="none" stroke="#fff8e8" stroke-opacity="0.35" stroke-width="0.25"/>

    <!-- Inner lining through open base -->
    <ellipse cx="${g.botCx}" cy="${g.botCy}" rx="${g.innerRx}" ry="${g.innerRy}" fill="url(#liningGlow)"/>
    <ellipse cx="${g.botCx}" cy="${g.botCy}" rx="${g.botRx}" ry="${g.botRy}" fill="none" stroke="url(#rimMetal)" stroke-width="0.5" opacity="0.85"/>
    <ellipse cx="${g.botCx}" cy="${(g.botCy + 0.5).toFixed(2)}" rx="${(g.innerRx * 0.7).toFixed(
      2
    )}" ry="${(g.innerRy * 0.55).toFixed(2)}" fill="${liningHex}" opacity="0.35"/>
  </g>

  <!-- Spec strip -->
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
