import { calculateUnitPrice, roundMoney, toNumber, type Money } from "@/lib/pricing";
import type { ConfigCatalog, ConfigSelection } from "./types";

export type ShadePriceBreakdown = {
  unitPrice: number;
  basePrice: number;
  shapeMod: number;
  sizeMod: number;
  fabricMod: number;
  liningMod: number;
  fittingMod: number;
  quantity: number;
  lineTotal: number;
};

export function calculateShadePrice(
  catalog: ConfigCatalog,
  selection: Pick<
    ConfigSelection,
    "shapeKey" | "sizeId" | "fabricId" | "liningId" | "fittingId" | "quantity"
  >
): ShadePriceBreakdown {
  const shape = catalog.shapes.find((s) => s.key === selection.shapeKey);
  const size = catalog.sizes.find((s) => s.id === selection.sizeId);
  const fabric = catalog.fabrics.find((f) => f.id === selection.fabricId);
  const lining = catalog.linings.find((l) => l.id === selection.liningId);
  const fitting = catalog.fittings.find((f) => f.id === selection.fittingId);

  const basePrice = toNumber((shape?.basePrice ?? 0) as Money);
  const shapeMod = toNumber((shape?.priceMod ?? 0) as Money);
  const sizeMod = toNumber((size?.priceMod ?? 0) as Money);
  const fabricMod = toNumber((fabric?.priceMod ?? 0) as Money);
  const liningMod = toNumber((lining?.priceMod ?? 0) as Money);
  const fittingMod = toNumber((fitting?.priceMod ?? 0) as Money);

  const unitPrice = calculateUnitPrice({
    basePrice: basePrice + shapeMod,
    sizeMod,
    fabricMod,
    liningMod,
    fittingMod,
  });
  const quantity = Math.max(1, selection.quantity || 1);
  return {
    unitPrice,
    basePrice,
    shapeMod,
    sizeMod,
    fabricMod,
    liningMod,
    fittingMod,
    quantity,
    lineTotal: roundMoney(unitPrice * quantity),
  };
}
