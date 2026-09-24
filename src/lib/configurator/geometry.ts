/**
 * Deterministic 2D shade geometry (viewBox 0 0 100 120).
 * Dimensions in cm drive proportions when provided.
 */

export type ShadeDims = {
  diameterCm?: number | null;
  heightCm?: number | null;
  widthCm?: number | null;
  depthCm?: number | null;
  /** Empire/coolie optional top; defaults derived from shape. */
  topDiameterCm?: number | null;
  bottomDiameterCm?: number | null;
};

export type ShadeBody = {
  /** Closed path for exterior fabric fill */
  bodyPath: string;
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
  /** For dimension guides */
  widthLabelCm: number | null;
  heightLabelCm: number | null;
};

const VB_W = 100;
const VB_H = 120;
const MAX_BODY_W = 72;
const MAX_BODY_H = 78;

function clamp(n: number, a: number, b: number) {
  return Math.min(b, Math.max(a, n));
}

/** Normalize cm pair into drawable rx/height in viewBox units. */
function scaleToView(widthCm: number, heightCm: number) {
  const aspect = widthCm / Math.max(heightCm, 1);
  let bodyW = MAX_BODY_W;
  let bodyH = bodyW / aspect;
  if (bodyH > MAX_BODY_H) {
    bodyH = MAX_BODY_H;
    bodyW = bodyH * aspect;
  }
  // Absolute size cue vs a 40cm reference
  const ref = 40;
  const sizeFactor = clamp(widthCm / ref, 0.72, 1.18);
  return { bodyW: bodyW * sizeFactor, bodyH: bodyH * sizeFactor };
}

function ellipsePath(
  topRx: number,
  topRy: number,
  botRx: number,
  botRy: number,
  topCy: number,
  botCy: number
): string {
  // Left-top → right-top arc → right-bot → left-bot arc
  const tlX = 50 - topRx;
  const trX = 50 + topRx;
  const blX = 50 - botRx;
  const brX = 50 + botRx;
  return [
    `M ${tlX.toFixed(2)} ${topCy.toFixed(2)}`,
    `A ${topRx.toFixed(2)} ${topRy.toFixed(2)} 0 0 1 ${trX.toFixed(2)} ${topCy.toFixed(2)}`,
    `L ${brX.toFixed(2)} ${botCy.toFixed(2)}`,
    `A ${botRx.toFixed(2)} ${botRy.toFixed(2)} 0 0 1 ${blX.toFixed(2)} ${botCy.toFixed(2)}`,
    "Z",
  ].join(" ");
}

function rectBody(
  halfW: number,
  top: number,
  bot: number,
  corner = 2
): string {
  const l = 50 - halfW;
  const r = 50 + halfW;
  return `M ${l + corner} ${top} H ${r - corner} Q ${r} ${top} ${r} ${top + corner} V ${bot - corner} Q ${r} ${bot} ${r - corner} ${bot} H ${l + corner} Q ${l} ${bot} ${l} ${bot - corner} V ${top + corner} Q ${l} ${top} ${l + corner} ${top} Z`;
}

export function buildShadeBody(shapeKey: string, dims: ShadeDims): ShadeBody {
  const key = (shapeKey || "drum").toLowerCase();
  const heightCm = dims.heightCm ?? dims.diameterCm ?? 25;
  const widthCm =
    dims.widthCm ??
    dims.diameterCm ??
    dims.bottomDiameterCm ??
    35;

  const { bodyW, bodyH } = scaleToView(widthCm, heightCm);
  const halfW = bodyW / 2;
  const topCy = 28;
  const botCy = topCy + bodyH;
  const cordTo = topCy - 6;

  const widthLabelCm = widthCm;
  const heightLabelCm = heightCm;

  if (key === "empire" || key === "coolie") {
    const taper = key === "coolie" ? 0.42 : 0.58;
    const topRx = halfW * taper;
    const botRx = halfW;
    const topRy = Math.max(2.2, topRx * 0.22);
    const botRy = Math.max(3.2, botRx * 0.2);
    return {
      bodyPath: ellipsePath(topRx, topRy, botRx, botRy, topCy, botCy),
      topCx: 50,
      topCy,
      topRx,
      topRy,
      botCx: 50,
      botCy,
      botRx,
      botRy,
      innerRx: botRx * 0.82,
      innerRy: botRy * 0.75,
      cordTo,
      widthLabelCm,
      heightLabelCm,
    };
  }

  if (key === "oval") {
    const topRx = halfW * 1.05;
    const botRx = halfW * 1.05;
    const topRy = Math.max(4, topRx * 0.28);
    const botRy = Math.max(4.5, botRx * 0.26);
    return {
      bodyPath: ellipsePath(topRx, topRy, botRx, botRy, topCy, botCy),
      topCx: 50,
      topCy,
      topRx,
      topRy,
      botCx: 50,
      botCy,
      botRx,
      botRy,
      innerRx: botRx * 0.85,
      innerRy: botRy * 0.78,
      cordTo,
      widthLabelCm: dims.widthCm ?? widthCm,
      heightLabelCm,
    };
  }

  if (key === "square" || key === "rectangular") {
    const top = topCy;
    const bot = botCy;
    const path = rectBody(halfW, top, bot, key === "square" ? 2.5 : 1.8);
    const ry = 3.2;
    return {
      bodyPath: path,
      topCx: 50,
      topCy: top + 1,
      topRx: halfW * 0.92,
      topRy: ry * 0.7,
      botCx: 50,
      botCy: bot - 1,
      botRx: halfW * 0.92,
      botRy: ry,
      innerRx: halfW * 0.78,
      innerRy: ry * 0.75,
      cordTo,
      widthLabelCm: dims.widthCm ?? widthCm,
      heightLabelCm,
    };
  }

  if (key === "tiered") {
    const t1 = topCy;
    const t2 = topCy + bodyH * 0.32;
    const t3 = topCy + bodyH * 0.58;
    const bot = botCy;
    const r1 = halfW * 0.55;
    const r2 = halfW * 0.78;
    const r3 = halfW;
    const path = [
      rectBody(r1, t1, t2 - 1, 1.5),
      rectBody(r2, t2, t3 - 1, 1.5),
      rectBody(r3, t3, bot, 2),
    ].join(" ");
    return {
      bodyPath: path,
      topCx: 50,
      topCy: t1 + 1,
      topRx: r1,
      topRy: 2.5,
      botCx: 50,
      botCy: bot - 1,
      botRx: r3,
      botRy: 4,
      innerRx: r3 * 0.82,
      innerRy: 3.2,
      cordTo: t1 - 5,
      widthLabelCm,
      heightLabelCm,
    };
  }

  // Drum — parallel sides
  const topRx = halfW;
  const botRx = halfW;
  const topRy = Math.max(3, topRx * 0.24);
  const botRy = Math.max(3.5, botRx * 0.22);
  return {
    bodyPath: ellipsePath(topRx, topRy, botRx, botRy, topCy, botCy),
    topCx: 50,
    topCy,
    topRx,
    topRy,
    botCx: 50,
    botCy,
    botRx,
    botRy,
    innerRx: botRx * 0.84,
    innerRy: botRy * 0.78,
    cordTo,
    widthLabelCm,
    heightLabelCm,
  };
}

export { VB_W, VB_H };
