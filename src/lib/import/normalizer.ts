const COLOURS = [
  "navy",
  "blue",
  "gold",
  "golden",
  "teal",
  "orange",
  "grey",
  "gray",
  "charcoal",
  "purple",
  "pink",
  "green",
  "jade",
  "emerald",
  "black",
  "white",
  "ivory",
  "cream",
  "mink",
  "brown",
  "copper",
  "silver",
  "bronze",
  "mustard",
  "yellow",
  "red",
  "rust",
  "multicolour",
  "multicolored",
  "rainbow",
] as const;

const PATTERNS = [
  "abstract",
  "marble",
  "geometric",
  "botanical",
  "floral",
  "peacock",
  "metallic",
  "wave",
  "tile",
  "moroccan",
  "chevron",
  "zigzag",
  "feather",
  "leaf",
  "leaves",
  "leopard",
  "crocodile",
  "stripe",
  "striped",
  "paint",
  "brush",
  "lava",
  "stone",
  "wood",
  "foil",
  "foiled",
] as const;

export function stripHtml(html: string): string {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function cleanDisplayName(originalTitle: string): string {
  let t = originalTitle
    .replace(/^(handmade by order|made by order|handmade by ordee|print by order|circular)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();

  t = t
    .replace(
      /\b(drum|empire|oval|coolie|square|rectangular|rounded rectangular|rounded square)?\s*(lamp\s*shade|lampshade)s?\b/gi,
      ""
    )
    .replace(/\bpendant\s*(light|lamp\s*shade)?\b/gi, "")
    .replace(/\ball shapes?( and sizes?)?\b/gi, "")
    .replace(/\ball sizes?( and shapes?)?\b/gi, "")
    .replace(/\bavailable\b/gi, "")
    .replace(/\bon demand\b/gi, "")
    .replace(/\bcustom size\b/gi, "")
    .replace(/\bsold by (the )?meter\b/gi, "")
    .replace(/\b140cm wide\b/gi, "")
    .replace(/\bvelvet fabric\b/gi, "velvet")
    .replace(/\s{2,}/g, " ")
    .replace(/[·|,/-]+\s*$/g, "")
    .trim();

  // Title-case lightly for display
  if (t.length > 72) {
    const cut = t.slice(0, 72);
    const sp = cut.lastIndexOf(" ");
    t = (sp > 40 ? cut.slice(0, sp) : cut).trim();
  }

  // Capitalise first letter of each word if mostly lowercase
  if (t === t.toLowerCase()) {
    t = t.replace(/\b([a-z])/g, (m) => m.toUpperCase());
  }

  return t || originalTitle.slice(0, 60);
}

export function polishDescription(sourceText: string): string {
  let t = sourceText
    .replace(/\bMade by luminahubdesign\b/gi, "Handmade by Lumina Hub")
    .replace(/\bMade by lumina hub design\b/gi, "Handmade by Lumina Hub")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Drop repeated global policy boilerplate (kept in CMS)
  t = t
    .replace(/Tax and Duties? are not included[\s\S]{0,200}?buyer\.?/gi, "")
    .replace(/Returns?:[\s\S]{0,300}?unusable\.?/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return t;
}

export function detectShapeKey(title: string, tags: string[], productType: string): string | null {
  const t = `${title} ${tags.join(" ")} ${productType}`.toLowerCase();
  if (/\btiered?\b/.test(t) || /\btired\b/.test(t)) return "tiered";
  if (/rounded\s*rectangular|rectangular/.test(t)) return "rectangular";
  if (/rounded\s*square/.test(t)) return "square";
  if (/\bempir/.test(t)) return "empire";
  if (/\boval\b/.test(t)) return "oval";
  if (/\bcoolie\b/.test(t)) return "coolie";
  if (/\bsquare\b/.test(t)) return "square";
  if (/\bdrum\b/.test(t)) return "drum";
  return null;
}

export function detectCategory(
  title: string,
  tags: string[],
  productType: string
): "LAMPSHADE" | "FABRIC" | "CUSHION" | "KIT" | "ACCESSORY" {
  const t = `${title} ${tags.join(" ")} ${productType}`.toLowerCase();
  if (t.includes("cushion")) return "CUSHION";
  if (t.includes("kit")) return "KIT";
  if (
    title.toLowerCase().startsWith("print by order") ||
    (t.includes("fabric") && !t.includes("lamp shade") && !t.includes("lampshade"))
  ) {
    return "FABRIC";
  }
  if (t.includes("lamp") || t.includes("shade")) return "LAMPSHADE";
  return "ACCESSORY";
}

export function detectMaterial(title: string, body: string): string | null {
  const t = `${title} ${body}`.toLowerCase();
  if (t.includes("foiled") || t.includes("foil")) return "Foiled velvet";
  if (t.includes("linen")) return "Linen";
  if (t.includes("silk")) return "Silk";
  if (t.includes("velvet")) return "Velvet";
  if (t.includes("printed")) return "Printed fabric";
  return null;
}

export function deriveColourTags(title: string): string[] {
  const lower = title.toLowerCase();
  const found = new Set<string>();
  for (const c of COLOURS) {
    if (new RegExp(`\\b${c}\\b`, "i").test(lower)) {
      const norm =
        c === "gray"
          ? "grey"
          : c === "golden"
            ? "gold"
            : c === "multicolored" || c === "multicolour"
              ? "multicolour"
              : c;
      found.add(norm);
    }
  }
  return [...found];
}

export function derivePatternTags(title: string): string[] {
  const lower = title.toLowerCase();
  const found = new Set<string>();
  for (const p of PATTERNS) {
    if (new RegExp(`\\b${p}\\b`, "i").test(lower)) {
      const norm = p === "foiled" ? "foil" : p === "leaves" ? "leaf" : p === "striped" ? "stripe" : p;
      found.add(norm);
    }
  }
  return [...found];
}

export function deriveMoodTags(colourTags: string[], patternTags: string[], title: string): string[] {
  const moods = new Set<string>();
  const t = title.toLowerCase();
  if (patternTags.includes("botanical") || patternTags.includes("floral") || patternTags.includes("leaf")) {
    moods.add("botanical");
  }
  if (
    colourTags.some((c) => ["ivory", "cream", "mink", "grey", "white"].includes(c)) ||
    t.includes("linen") ||
    t.includes("calm")
  ) {
    moods.add("linen-calm");
  }
  if (patternTags.includes("metallic") || colourTags.includes("gold") || t.includes("foil")) {
    moods.add("metallic");
  }
  if (colourTags.some((c) => ["black", "charcoal", "navy", "purple"].includes(c))) {
    moods.add("dark-dramatic");
  }
  return [...moods];
}

export function parseDimensionCm(label: string): {
  diameterCm?: number;
  widthCm?: number;
  heightCm?: number;
  depthCm?: number;
} {
  const s = label.toLowerCase().replace(/×/g, "x");
  const nums = [...s.matchAll(/(\d+(?:\.\d+)?)\s*(cm|mm)?/g)].map((m) => {
    const n = Number(m[1]);
    return m[2] === "mm" ? n / 10 : n;
  });
  if (!nums.length) return {};
  if (/diam|ø|diameter|Ø/i.test(label) || /\bd\b.*\bh\b/i.test(s)) {
    if (nums.length >= 2) return { diameterCm: nums[0], heightCm: nums[1] };
    return { diameterCm: nums[0] };
  }
  if (nums.length >= 3) return { widthCm: nums[0], depthCm: nums[1], heightCm: nums[2] };
  if (nums.length === 2) return { widthCm: nums[0], heightCm: nums[1] };
  return { heightCm: nums[0] };
}

export function detectPersonalisation(options: { name: string; values: string[] }[], body: string): boolean {
  const blob = `${options.map((o) => o.name + o.values.join(" ")).join(" ")} ${body}`.toLowerCase();
  return /personali[sz]/.test(blob);
}

export function extractLeadTimeDays(body: string): number | null {
  const m = body.match(/(\d+)\s*[–-]\s*(\d+)\s*(working\s*)?days/i) || body.match(/(\d+)\s*(working\s*)?days/i);
  if (!m) return null;
  if (m[2] && /^\d+$/.test(m[2])) return Number(m[2]);
  return Number(m[1]);
}
