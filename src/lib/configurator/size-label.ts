import type { SizeOpt } from "./types";

/** Human-readable measurement for size tiles (display only). */
export function sizeMeasurement(size: SizeOpt): string {
  if (size.diameterCm != null && size.heightCm != null) {
    return `${size.diameterCm} × ${size.heightCm} cm`;
  }
  if (size.topDiameterCm != null && size.bottomDiameterCm != null && size.heightCm != null) {
    return `${size.topDiameterCm}/${size.bottomDiameterCm} × ${size.heightCm} cm`;
  }
  if (size.widthCm != null && size.depthCm != null && size.heightCm != null) {
    return `${size.widthCm} × ${size.depthCm} × ${size.heightCm} cm`;
  }
  if (size.widthCm != null && size.heightCm != null) {
    return `${size.widthCm} × ${size.heightCm} cm`;
  }
  if (size.diameterCm != null) return `Ø ${size.diameterCm} cm`;
  if (size.heightCm != null) return `H ${size.heightCm} cm`;
  return size.name;
}
