import type { UseType } from "@/lib/configurator/types";

/** Map fitting.compatibility text / slug heuristics into useTypes for the API. */
export function deriveUseTypes(
  slug: string,
  compatibility?: string | null
): UseType[] {
  const hay = `${slug} ${compatibility || ""}`.toLowerCase();
  const found: UseType[] = [];
  if (/ceiling|pendant|uno|hanging/.test(hay)) found.push("ceiling");
  if (/table|clip|candle|harp/.test(hay)) found.push("table");
  if (/floor/.test(hay)) found.push("floor");
  if (found.length) return [...new Set(found)];
  if (slug === "candle-clip") return ["table"];
  if (slug === "e27-uno" || slug === "uno") return ["ceiling"];
  if (slug === "spider") return ["table", "floor", "ceiling"];
  return [];
}

/** Default pattern scale from material/pattern heuristics. */
export function derivePatternScale(
  material?: string | null,
  pattern?: string | null,
  name?: string | null
): number {
  const hay = `${material || ""} ${pattern || ""} ${name || ""}`.toLowerCase();
  if (/floral|botanical|leaf|peacock|large/.test(hay)) return 0.85;
  if (/geometric|tile|check|stripe/.test(hay)) return 1.1;
  if (/marble|abstract|wave/.test(hay)) return 1;
  if (/linen|plain|solid/.test(hay)) return 1.25;
  return 1;
}
