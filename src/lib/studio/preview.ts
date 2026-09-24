/** Studio live-preview silhouettes (SVG path `d` in a 100×120 viewBox). */

export const SHAPE_PATHS: Record<string, string> = {
  drum: "M28 14 H72 Q78 14 78 20 V100 Q78 106 72 106 H28 Q22 106 22 100 V20 Q22 14 28 14 Z",
  empire:
    "M36 12 H64 Q68 12 70 18 L88 102 Q90 108 84 108 H16 Q10 108 12 102 L30 18 Q32 12 36 12 Z",
  coolie:
    "M38 10 H62 Q66 10 68 16 L94 104 Q96 110 90 110 H10 Q4 110 6 104 L32 16 Q34 10 38 10 Z",
  oval: "M50 12 C72 12 86 36 86 60 C86 84 72 108 50 108 C28 108 14 84 14 60 C14 36 28 12 50 12 Z",
  square:
    "M26 16 H74 Q80 16 80 22 V98 Q80 104 74 104 H26 Q20 104 20 98 V22 Q20 16 26 16 Z",
  rectangular:
    "M12 28 H88 Q94 28 94 34 V86 Q94 92 88 92 H12 Q6 92 6 86 V34 Q6 28 12 28 Z",
  tiered:
    "M34 8 H66 Q70 8 70 12 V28 Q70 32 66 32 H34 Q30 32 30 28 V12 Q30 8 34 8 Z M26 36 H74 Q78 36 78 40 V58 Q78 62 74 62 H26 Q22 62 22 58 V40 Q22 36 26 36 Z M16 66 H84 Q90 66 90 70 V102 Q90 108 84 108 H16 Q10 108 10 102 V70 Q10 66 16 66 Z",
};

export function shapePath(shapeKey?: string | null): string {
  if (!shapeKey) return SHAPE_PATHS.drum;
  return SHAPE_PATHS[shapeKey] || SHAPE_PATHS.drum;
}

/** Soft size scale relative to a mid diameter (~35cm). */
export function sizePreviewScale(diameterCm?: number | null): number {
  if (diameterCm == null || !Number.isFinite(diameterCm)) return 1;
  return Math.min(1.1, Math.max(0.82, diameterCm / 35));
}

export type PreviewCandidate = {
  imageUrl: string;
  title: string;
  colourTags: string[];
  patternTags: string[];
  material: string | null;
};

const GENERIC = new Set([
  "velvet",
  "linen",
  "silk",
  "cotton",
  "wool",
  "blend",
  "print",
  "pattern",
  "fabric",
  "shade",
  "lamp",
  "lampshade",
  "pendant",
  "luxury",
  "handmade",
  "order",
  "meter",
  "wide",
  "effect",
  "abstract",
  "design",
  "art",
  "multi",
  "colour",
  "colored",
  "coloured",
]);

function tokens(...parts: (string | null | undefined)[]): string[] {
  return parts
    .flatMap((p) => (p || "").toLowerCase().split(/[^a-z0-9]+/))
    .filter((t) => t.length > 2 && !GENERIC.has(t));
}

const LIFESTYLE_HINT =
  /\b(room|sofa|interior|lifestyle|living|bedroom|wall|cushion|table setting)\b/i;

/** Prefer product-only shots over room lifestyle photos for form matching. */
export function isLifestyleShot(title: string, url: string): boolean {
  return LIFESTYLE_HINT.test(title) || /lifestyle|room|interior/i.test(url);
}

export function scorePreviewMatch(
  candidate: PreviewCandidate,
  fabric: {
    name?: string | null;
    colour?: string | null;
    material?: string | null;
    pattern?: string | null;
    slug?: string | null;
  } | null
): number {
  if (!fabric) return 0;
  const hay = tokens(
    candidate.title,
    candidate.material,
    ...candidate.colourTags,
    ...candidate.patternTags
  );
  const needles = new Set(
    tokens(fabric.name, fabric.colour, fabric.material, fabric.pattern, fabric.slug)
  );
  let score = 0;
  for (const n of needles) {
    if (hay.includes(n)) score += n.length > 5 ? 3 : 2;
  }
  if (isLifestyleShot(candidate.title, candidate.imageUrl)) score -= 4;
  return score;
}

/**
 * Strong fabric↑shape catalog match → use that photo alone (no fabric overlay).
 * Otherwise return null so the UI renders an SVG silhouette composite.
 */
export function pickCatalogMatch(
  candidates: PreviewCandidate[],
  fabric: {
    name?: string | null;
    colour?: string | null;
    material?: string | null;
    pattern?: string | null;
    slug?: string | null;
  } | null
): string | null {
  let best: PreviewCandidate | null = null;
  let bestScore = 0;
  for (const c of candidates) {
    const s = scorePreviewMatch(c, fabric);
    if (s > bestScore) {
      bestScore = s;
      best = c;
    }
  }
  if (best && bestScore >= 6) return best.imageUrl;
  return null;
}

/** Shape reference photo — avoid lifestyle frames. */
export function pickShapeReference(
  candidates: PreviewCandidate[],
  shapeImage?: string | null
): string | null {
  const productOnly = candidates.find(
    (c) => !isLifestyleShot(c.title, c.imageUrl)
  );
  return productOnly?.imageUrl || shapeImage || null;
}

export function pickPreviewImage(
  candidates: PreviewCandidate[],
  fabric: {
    name?: string | null;
    colour?: string | null;
    material?: string | null;
    pattern?: string | null;
    slug?: string | null;
  } | null,
  fallbacks: (string | null | undefined)[]
): string | null {
  const match = pickCatalogMatch(candidates, fabric);
  if (match) return match;
  const ref = pickShapeReference(candidates, fallbacks[0] || null);
  if (ref) return ref;
  for (const f of fallbacks) {
    if (f) return f;
  }
  return null;
}

/** Client-safe URL for the server-generated combination preview image. */
export function studioPreviewApiPath(params: {
  shape: string;
  fabric: string;
  lining?: string | null;
  diameter?: number | null;
}): string {
  const q = new URLSearchParams();
  q.set("shape", params.shape);
  q.set("fabric", params.fabric);
  if (params.lining) q.set("lining", params.lining);
  if (params.diameter != null && Number.isFinite(params.diameter)) {
    q.set("diameter", String(params.diameter));
  }
  return `/api/studio-preview?${q.toString()}`;
}
