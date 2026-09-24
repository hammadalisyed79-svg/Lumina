import { isWebImageUrl } from "@/lib/utils";

/** Prefer real catalog/media photos; never serve demo SVG placeholders. */
export function catalogImageUrl(
  ...candidates: (string | null | undefined)[]
): string | null {
  for (const c of candidates) {
    if (isWebImageUrl(c)) return c!;
  }
  return null;
}

/** Approximate lining colour for chips when no swatch photo exists. */
export function liningSwatchHex(name?: string | null, colour?: string | null): string {
  const hay = `${name || ""} ${colour || ""}`.toLowerCase();
  if (/copper/.test(hay)) return "#b87333";
  if (/champagne/.test(hay)) return "#d4c4a8";
  if (/gold|golden/.test(hay)) return "#c5a572";
  if (/silver/.test(hay)) return "#c8c8c8";
  if (/ivory/.test(hay)) return "#f5f0e6";
  if (/white|plain/.test(hay)) return "#f7f7f5";
  if (/brush/.test(hay) && /gold/.test(hay)) return "#c9a227";
  return "#e8e4dc";
}
