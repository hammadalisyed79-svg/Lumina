/** Catalog matching helpers for Design Your Shade live preview. */

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
  /\b(room|sofa|interior|lifestyle|living|bedroom|wall|cushion|table setting|armchair)\b/i;

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

/** Best catalog photo for shape + fabric tokens; null if no strong match. */
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
  if (best && bestScore >= 4) return best.imageUrl;
  return null;
}

/** Curated shape hero, then a non-lifestyle catalog shot. */
export function pickShapeReference(
  candidates: PreviewCandidate[],
  shapeImage?: string | null
): string | null {
  if (shapeImage) return shapeImage;
  const productOnly = candidates.find(
    (c) => !isLifestyleShot(c.title, c.imageUrl)
  );
  return productOnly?.imageUrl || candidates[0]?.imageUrl || null;
}

/**
 * Review / cart thumbnail: fabric-matched catalog photo, else shape hero.
 */
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

export function shadeTitle(shapeName?: string | null): string {
  if (!shapeName) return "Lampshade";
  if (/lampshade|pendant/i.test(shapeName)) return shapeName;
  return `${shapeName} lampshade`;
}

export function sizePreviewScale(diameterCm?: number | null): number {
  if (diameterCm == null || !Number.isFinite(diameterCm)) return 1;
  return Math.min(1.06, Math.max(0.88, diameterCm / 38));
}
