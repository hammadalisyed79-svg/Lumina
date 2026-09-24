import type { ConfiguredSnapshot } from "@/lib/cart/snapshot";

export function isConfiguredSnapshot(value: unknown): value is ConfiguredSnapshot {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    v.version === 1 &&
    v.serverTrusted === true &&
    typeof v.shapeKey === "string" &&
    typeof v.sizeSlug === "string" &&
    typeof v.fabricSlug === "string"
  );
}

export function workshopMeasurements(snap: ConfiguredSnapshot) {
  const m = snap.measurements;
  const rows: { label: string; value: string }[] = [];
  if (m.diameterCm != null) rows.push({ label: "Diameter", value: `${m.diameterCm} cm` });
  if (m.heightCm != null) rows.push({ label: "Height", value: `${m.heightCm} cm` });
  if (m.widthCm != null) rows.push({ label: "Width", value: `${m.widthCm} cm` });
  if (m.depthCm != null) rows.push({ label: "Depth", value: `${m.depthCm} cm` });
  if (m.topDiameterCm != null) rows.push({ label: "Top Ø", value: `${m.topDiameterCm} cm` });
  if (m.bottomDiameterCm != null)
    rows.push({ label: "Bottom Ø", value: `${m.bottomDiameterCm} cm` });
  return rows;
}

export function workshopConfigRows(snap: ConfiguredSnapshot) {
  return [
    { label: "Shape", value: snap.shapeName },
    { label: "Size", value: snap.sizeName },
    { label: "Fabric", value: snap.fabricName },
    { label: "Lining", value: snap.liningName },
    { label: "Fitting", value: snap.fittingName },
    ...(snap.useType ? [{ label: "Use", value: snap.useType }] : []),
    ...(snap.personalisation
      ? [{ label: "Personalisation", value: snap.personalisation }]
      : []),
  ];
}
