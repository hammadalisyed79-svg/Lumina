/** Fabric browser filters backed by real catalogue tags. */

export type FabricFilterId =
  | "all"
  | "velvet"
  | "linen"
  | "abstract"
  | "botanical"
  | "geometric"
  | "floral"
  | "neutral"
  | "blue"
  | "green"
  | "gold"
  | "dark";

export const FABRIC_BROWSER_FILTERS: { id: FabricFilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "velvet", label: "Velvet" },
  { id: "linen", label: "Linen" },
  { id: "abstract", label: "Abstract" },
  { id: "botanical", label: "Botanical" },
  { id: "geometric", label: "Geometric" },
  { id: "floral", label: "Floral" },
  { id: "neutral", label: "Neutral" },
  { id: "blue", label: "Blue" },
  { id: "green", label: "Green" },
  { id: "gold", label: "Gold" },
  { id: "dark", label: "Dark" },
];

export function fabricMatchesFilter(
  fabric: {
    name?: string | null;
    material?: string | null;
    colour?: string | null;
    pattern?: string | null;
  },
  filter: FabricFilterId
): boolean {
  if (filter === "all") return true;
  const hay = `${fabric.material || ""} ${fabric.name || ""} ${fabric.pattern || ""} ${fabric.colour || ""}`.toLowerCase();
  switch (filter) {
    case "velvet":
      return /velvet|velour/.test(hay);
    case "linen":
      return /linen/.test(hay);
    case "abstract":
      return /abstract|marble|wave|ink/.test(hay);
    case "botanical":
      return /botanical|leaf|foliage|jungle|palm/.test(hay);
    case "geometric":
      return /geometric|geo|check|stripe|tile|diamond/.test(hay);
    case "floral":
      return /floral|flower|rose|bloom|peony/.test(hay);
    case "neutral":
      return /neutral|cream|ivory|beige|taupe|stone|natural|ecru|sand/.test(hay);
    case "blue":
      return /blue|azure|navy|indigo|teal/.test(hay);
    case "green":
      return /green|emerald|olive|sage|forest/.test(hay);
    case "gold":
      return /gold|golden|brass|champagne|mustard/.test(hay);
    case "dark":
      return /dark|black|charcoal|midnight|ink|noir/.test(hay);
    default:
      return true;
  }
}
