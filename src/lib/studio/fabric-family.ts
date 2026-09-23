/** Map fabric material/name into filter families for the design studio. */
export type FabricFamily = "all" | "velvet" | "linen" | "silk" | "wool" | "cotton" | "print";

export const FABRIC_FILTERS: { id: FabricFamily; label: string }[] = [
  { id: "all", label: "All" },
  { id: "velvet", label: "Velvet" },
  { id: "linen", label: "Linen" },
  { id: "silk", label: "Silk" },
  { id: "wool", label: "Wool" },
  { id: "cotton", label: "Cotton" },
  { id: "print", label: "Print / pattern" },
];

export function fabricFamily(material?: string | null, name?: string | null, pattern?: string | null): FabricFamily {
  const hay = `${material || ""} ${name || ""} ${pattern || ""}`.toLowerCase();
  if (/velvet|velour/.test(hay)) return "velvet";
  if (/linen/.test(hay)) return "linen";
  if (/silk|moir[eé]/.test(hay)) return "silk";
  if (/wool|tweed/.test(hay)) return "wool";
  if (/print|pattern|damask|abstract|botanical|foil/.test(hay)) return "print";
  if (/cotton/.test(hay)) return "cotton";
  return "cotton";
}

export function buildStudioSharePath(opts: {
  shapeKey?: string;
  fabricSlug?: string;
  sizeSlug?: string;
  liningSlug?: string;
  fittingSlug?: string;
  step?: number;
}) {
  const p = new URLSearchParams();
  if (opts.shapeKey) p.set("shape", opts.shapeKey);
  if (opts.fabricSlug) p.set("fabric", opts.fabricSlug);
  if (opts.sizeSlug) p.set("size", opts.sizeSlug);
  if (opts.liningSlug) p.set("lining", opts.liningSlug);
  if (opts.fittingSlug) p.set("fitting", opts.fittingSlug);
  if (opts.step != null && opts.step > 0) p.set("step", String(opts.step));
  const q = p.toString();
  return q ? `/design-your-shade?${q}` : "/design-your-shade";
}
