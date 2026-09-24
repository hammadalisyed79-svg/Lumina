/** Shape silhouettes for the studio live preview (CSS clip-path polygons). */
export const SHAPE_CLIP: Record<string, string> = {
  drum: "polygon(22% 12%, 78% 12%, 82% 88%, 18% 88%)",
  empire: "polygon(30% 10%, 70% 10%, 88% 90%, 12% 90%)",
  coolie: "polygon(34% 8%, 66% 8%, 92% 92%, 8% 92%)",
  oval: "ellipse(38% 42% at 50% 50%)",
  square: "polygon(24% 14%, 76% 14%, 76% 86%, 24% 86%)",
  rectangular: "polygon(12% 22%, 88% 22%, 88% 78%, 12% 78%)",
  tiered:
    "polygon(28% 8%, 72% 8%, 76% 32%, 24% 32%, 20% 36%, 80% 36%, 84% 62%, 16% 62%, 12% 66%, 88% 66%, 92% 92%, 8% 92%)",
};

export function shapeClipPath(shapeKey?: string | null): string {
  if (!shapeKey) return SHAPE_CLIP.drum;
  return SHAPE_CLIP[shapeKey] || SHAPE_CLIP.drum;
}

/** Soft size scale relative to a mid diameter (~35cm). */
export function sizePreviewScale(diameterCm?: number | null): number {
  if (diameterCm == null || !Number.isFinite(diameterCm)) return 1;
  const t = diameterCm / 35;
  return Math.min(1.12, Math.max(0.78, t));
}

export type PreviewCandidate = {
  imageUrl: string;
  title: string;
  colourTags: string[];
  patternTags: string[];
  material: string | null;
};

function tokens(...parts: (string | null | undefined)[]): string[] {
  return parts
    .flatMap((p) => (p || "").toLowerCase().split(/[^a-z0-9]+/))
    .filter((t) => t.length > 2);
}

/** Score a catalog product against the selected fabric for live preview. */
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
  const needles = tokens(
    fabric.name,
    fabric.colour,
    fabric.material,
    fabric.pattern,
    fabric.slug
  );
  let score = 0;
  for (const n of needles) {
    if (hay.includes(n)) score += n.length > 5 ? 3 : 2;
  }
  return score;
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
  let best: PreviewCandidate | null = null;
  let bestScore = 0;
  for (const c of candidates) {
    const s = scorePreviewMatch(c, fabric);
    if (s > bestScore) {
      bestScore = s;
      best = c;
    }
  }
  if (best && bestScore >= 2) return best.imageUrl;
  if (best) return best.imageUrl;
  for (const f of fallbacks) {
    if (f) return f;
  }
  return null;
}
