/** Shared lampshade geometry for studio live preview (viewBox 0 0 100 120). */

export type ShadeGeom = {
  body: string;
  topCx: number;
  topCy: number;
  topRx: number;
  topRy: number;
  botCx: number;
  botCy: number;
  botRx: number;
  botRy: number;
  innerRx: number;
  innerRy: number;
  cordTo: number;
  label: string;
};

export function shadeGeom(shapeKey?: string | null): ShadeGeom {
  switch ((shapeKey || "drum").toLowerCase()) {
    case "empire":
      return {
        body: "M34 26 A16 5.5 0 0 1 66 26 L86 96 A36 9 0 0 1 14 96 Z",
        topCx: 50,
        topCy: 26,
        topRx: 16,
        topRy: 5.5,
        botCx: 50,
        botCy: 96,
        botRx: 36,
        botRy: 9,
        innerRx: 32,
        innerRy: 7.5,
        cordTo: 20,
        label: "Empire lampshade",
      };
    case "coolie":
      return {
        body: "M38 22 A12 4.5 0 0 1 62 22 L92 98 A42 10 0 0 1 8 98 Z",
        topCx: 50,
        topCy: 22,
        topRx: 12,
        topRy: 4.5,
        botCx: 50,
        botCy: 98,
        botRx: 42,
        botRy: 10,
        innerRx: 37,
        innerRy: 8,
        cordTo: 17,
        label: "Coolie lampshade",
      };
    case "oval":
      return {
        body: "M18 30 A32 8 0 0 1 82 30 L82 94 A32 9 0 0 1 18 94 Z",
        topCx: 50,
        topCy: 30,
        topRx: 32,
        topRy: 8,
        botCx: 50,
        botCy: 94,
        botRx: 32,
        botRy: 9,
        innerRx: 28,
        innerRy: 7,
        cordTo: 22,
        label: "Oval lampshade",
      };
    case "square":
      return {
        body: "M30 24 H70 Q76 24 76 30 V92 Q76 98 70 98 H30 Q24 98 24 92 V30 Q24 24 30 24 Z",
        topCx: 50,
        topCy: 28,
        topRx: 22,
        topRy: 4,
        botCx: 50,
        botCy: 96,
        botRx: 24,
        botRy: 5,
        innerRx: 20,
        innerRy: 4,
        cordTo: 18,
        label: "Square lampshade",
      };
    case "rectangular":
      return {
        body: "M12 32 H88 Q94 32 94 38 V88 Q94 94 88 94 H12 Q6 94 6 88 V38 Q6 32 12 32 Z",
        topCx: 50,
        topCy: 36,
        topRx: 40,
        topRy: 5,
        botCx: 50,
        botCy: 90,
        botRx: 40,
        botRy: 6,
        innerRx: 36,
        innerRy: 4.5,
        cordTo: 26,
        label: "Rectangular lampshade",
      };
    case "tiered":
      return {
        body:
          "M36 16 H64 Q68 16 68 20 V32 Q68 36 64 36 H36 Q32 36 32 32 V20 Q32 16 36 16 Z M28 40 H72 Q76 40 76 44 V58 Q76 62 72 62 H28 Q24 62 24 58 V44 Q24 40 28 40 Z M18 66 H82 Q88 66 88 70 V100 Q88 106 82 106 H18 Q12 106 12 100 V70 Q12 66 18 66 Z",
        topCx: 50,
        topCy: 18,
        topRx: 16,
        topRy: 3.5,
        botCx: 50,
        botCy: 104,
        botRx: 34,
        botRy: 7,
        innerRx: 30,
        innerRy: 5.5,
        cordTo: 12,
        label: "Tiered pendant",
      };
    case "drum":
    default:
      return {
        body: "M28 28 A22 6.5 0 0 1 72 28 L72 96 A22 7.5 0 0 1 28 96 Z",
        topCx: 50,
        topCy: 28,
        topRx: 22,
        topRy: 6.5,
        botCx: 50,
        botCy: 96,
        botRx: 22,
        botRy: 7.5,
        innerRx: 18.5,
        innerRy: 5.8,
        cordTo: 21,
        label: "Drum lampshade",
      };
  }
}

export function shadeSizeScale(diameterCm?: number | null): number {
  if (diameterCm == null || !Number.isFinite(diameterCm)) return 0.94;
  return Math.min(1.08, Math.max(0.76, diameterCm / 38));
}
