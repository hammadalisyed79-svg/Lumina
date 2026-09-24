/** Shared types for Design Your Shade v2 configurator. */

export type UseType = "table" | "floor" | "ceiling";

export const USE_TYPES: { id: UseType; label: string; hint: string }[] = [
  {
    id: "table",
    label: "Table lamp",
    hint: "Proportion to the base and tabletop.",
  },
  {
    id: "floor",
    label: "Floor lamp",
    hint: "Larger diameters read well at standing height.",
  },
  {
    id: "ceiling",
    label: "Ceiling pendant",
    hint: "Spider or Uno fittings for hanging shades.",
  },
];

export const CONFIG_STEPS = [
  { id: "use", label: "Use" },
  { id: "shape", label: "Shape" },
  { id: "size", label: "Size" },
  { id: "fabric", label: "Fabric" },
  { id: "lining", label: "Lining" },
  { id: "fitting", label: "Fitting" },
  { id: "review", label: "Review" },
] as const;

export type ConfigStepId = (typeof CONFIG_STEPS)[number]["id"];

export type ShapeOpt = {
  id: string;
  key: string;
  name: string;
  basePrice: number;
  priceMod: number;
  imageUrl?: string | null;
  description?: string | null;
};

export type SizeOpt = {
  id: string;
  slug: string;
  name: string;
  priceMod: number;
  diameterCm: number | null;
  heightCm: number | null;
  widthCm: number | null;
  depthCm: number | null;
  shapeKey: string | null;
};

export type FabricOpt = {
  id: string;
  slug: string;
  name: string;
  priceMod: number;
  imageUrl?: string | null;
  swatchUrl?: string | null;
  material?: string | null;
  colour?: string | null;
  pattern?: string | null;
  description?: string | null;
  /** Relative pattern scale; 1 = default. */
  patternScale: number;
};

export type LiningOpt = {
  id: string;
  slug: string;
  name: string;
  priceMod: number;
  colour?: string | null;
  swatchUrl?: string | null;
  description?: string | null;
};

export type FittingOpt = {
  id: string;
  slug: string;
  name: string;
  priceMod: number;
  description?: string | null;
  imageUrl?: string | null;
  compatibility?: string | null;
  /** Parsed use types this fitting suits; empty = all. */
  useTypes: UseType[];
};

export type ConfigSelection = {
  useType: UseType | null;
  shapeKey: string | null;
  sizeId: string | null;
  fabricId: string | null;
  liningId: string | null;
  fittingId: string | null;
  personalisation: string;
  quantity: number;
  step: ConfigStepId;
};

export type ConfigCatalog = {
  shapes: ShapeOpt[];
  sizes: SizeOpt[];
  fabrics: FabricOpt[];
  linings: LiningOpt[];
  fittings: FittingOpt[];
};

export type OptionAvailability<T> = {
  option: T;
  available: boolean;
  reason?: string;
};

export type PreviewMode = "exterior" | "interior" | "light" | "room";

export type RoomContext = "studio" | "table" | "floor" | "ceiling";

export type ConfigWarnings = string[];
