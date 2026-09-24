"use client";

import { useId, useMemo } from "react";
import { normalizeImageSrc } from "@/lib/image";
import { liningSwatchHex } from "@/lib/studio/images";
import { buildShadeBody, type ShadeDims } from "@/lib/configurator/geometry";
import type { PreviewMode, RoomContext } from "@/lib/configurator/types";

type Props = {
  shapeKey: string;
  dims: ShadeDims;
  fabricUrl?: string | null;
  fabricName?: string | null;
  patternScale?: number;
  liningName?: string | null;
  liningColour?: string | null;
  mode?: PreviewMode;
  room?: RoomContext;
  showDimensions?: boolean;
  className?: string;
};

/**
 * Deterministic 2D shade renderer — SVG body + fabric pattern + lining glow.
 */
export function ShadeRenderer({
  shapeKey,
  dims,
  fabricUrl,
  fabricName,
  patternScale = 1,
  liningName,
  liningColour,
  mode = "exterior",
  room = "studio",
  showDimensions = false,
  className = "",
}: Props) {
  const uid = useId().replace(/:/g, "");
  const body = useMemo(
    () => buildShadeBody(shapeKey, dims),
    [shapeKey, dims]
  );
  const liningHex = liningSwatchHex(liningName, liningColour);
  const fabricHref = fabricUrl ? normalizeImageSrc(fabricUrl) : null;
  const scale = Math.max(0.55, Math.min(1.8, patternScale || 1));
  const patW = 100 / scale;
  const patH = 120 / scale;

  const lightOn = mode === "light";
  const showInterior = mode === "interior" || mode === "light";
  const roomTone =
    room === "studio"
      ? ["#f7f3ea", "#ebe4d7", "#d8d0c2"]
      : room === "ceiling"
        ? ["#2a2620", "#3d3830", "#1a1714"]
        : room === "floor"
          ? ["#e8e0d4", "#d4cbb8", "#c4b8a4"]
          : ["#f0ebe3", "#e2d9cc", "#cfc4b4"];

  return (
    <div className={`shade-renderer ${className}`.trim()} data-mode={mode}>
      <svg
        viewBox="0 0 100 120"
        className="shade-renderer-svg"
        role="img"
        aria-label={`${shapeKey} shade${fabricName ? ` in ${fabricName}` : ""}${liningName ? `, ${liningName} lining` : ""}`}
      >
        <defs>
          <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={roomTone[0]} />
            <stop offset="55%" stopColor={roomTone[1]} />
            <stop offset="100%" stopColor={roomTone[2]} />
          </linearGradient>
          <radialGradient id={`${uid}-spot`} cx="50%" cy="22%" r="48%">
            <stop
              offset="0%"
              stopColor="#ffffff"
              stopOpacity={lightOn ? 0.35 : 0.75}
            />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          {fabricHref ? (
            <pattern
              id={`${uid}-fab`}
              patternUnits="userSpaceOnUse"
              width={patW}
              height={patH}
              patternTransform={`translate(${(100 - patW) / 2} ${(120 - patH) / 2})`}
            >
              <image
                href={fabricHref}
                x="0"
                y="0"
                width={patW}
                height={patH}
                preserveAspectRatio="xMidYMid slice"
              />
            </pattern>
          ) : null}
          <linearGradient id={`${uid}-cyl`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1a1510" stopOpacity={lightOn ? 0.25 : 0.42} />
            <stop offset="18%" stopColor="#1a1510" stopOpacity="0.08" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity={lightOn ? 0.28 : 0.16} />
            <stop offset="82%" stopColor="#1a1510" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#1a1510" stopOpacity={lightOn ? 0.25 : 0.42} />
          </linearGradient>
          <linearGradient id={`${uid}-fall`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
            <stop offset="50%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity={lightOn ? 0.12 : 0.22} />
          </linearGradient>
          <radialGradient id={`${uid}-lining`} cx="50%" cy="50%" r="65%">
            <stop
              offset="0%"
              stopColor={liningHex}
              stopOpacity={showInterior ? 1 : 0.85}
            />
            <stop offset="55%" stopColor={liningHex} stopOpacity="0.7" />
            <stop offset="100%" stopColor="#2a2018" stopOpacity="0.88" />
          </radialGradient>
          <radialGradient id={`${uid}-glow`} cx="50%" cy="70%" r="55%">
            <stop offset="0%" stopColor={liningHex} stopOpacity={lightOn ? 0.55 : 0} />
            <stop offset="100%" stopColor={liningHex} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${uid}-rim`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e8d9b8" />
            <stop offset="50%" stopColor="#c4a574" />
            <stop offset="100%" stopColor="#8a7348" />
          </linearGradient>
          <filter id={`${uid}-soft`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="2.2"
              stdDeviation="1.6"
              floodColor="#14110e"
              floodOpacity={lightOn ? 0.45 : 0.32}
            />
          </filter>
        </defs>

        <rect width="100" height="120" fill={`url(#${uid}-bg)`} />
        <rect width="100" height="120" fill={`url(#${uid}-spot)`} />
        {lightOn && (
          <rect width="100" height="120" fill={`url(#${uid}-glow)`} />
        )}

        <line
          x1="50"
          y1="8"
          x2="50"
          y2={body.cordTo}
          stroke={room === "ceiling" ? "#c4b8a8" : "#7a7268"}
          strokeWidth="0.45"
          opacity="0.65"
        />

        <g filter={`url(#${uid}-soft)`}>
          <path
            d={body.bodyPath}
            fill={fabricHref ? `url(#${uid}-fab)` : "#c8bfb0"}
          />
          <path d={body.bodyPath} fill={`url(#${uid}-cyl)`} />
          <path d={body.bodyPath} fill={`url(#${uid}-fall)`} />

          <ellipse
            cx={body.topCx}
            cy={body.topCy}
            rx={body.topRx}
            ry={body.topRy}
            fill="#2a241c"
            opacity="0.32"
          />
          <ellipse
            cx={body.topCx}
            cy={body.topCy}
            rx={body.topRx}
            ry={body.topRy}
            fill="none"
            stroke={`url(#${uid}-rim)`}
            strokeWidth="0.5"
          />

          <ellipse
            cx={body.botCx}
            cy={body.botCy}
            rx={body.innerRx}
            ry={body.innerRy}
            fill={`url(#${uid}-lining)`}
          />
          {showInterior && (
            <ellipse
              cx={body.botCx}
              cy={body.botCy - body.botRy * 2}
              rx={body.innerRx * 0.9}
              ry={body.botRy * 3}
              fill={liningHex}
              opacity={lightOn ? 0.35 : 0.2}
              style={{ mixBlendMode: "screen" }}
            />
          )}
          <ellipse
            cx={body.botCx}
            cy={body.botCy}
            rx={body.botRx}
            ry={body.botRy}
            fill="none"
            stroke={`url(#${uid}-rim)`}
            strokeWidth="0.45"
            opacity="0.85"
          />
        </g>

        {showDimensions && body.widthLabelCm != null && (
          <g className="shade-dims" fill="#5c554c" fontSize="2.4">
            <line
              x1={50 - body.botRx}
              y1={body.botCy + 8}
              x2={50 + body.botRx}
              y2={body.botCy + 8}
              stroke="#5c554c"
              strokeWidth="0.25"
            />
            <text x="50" y={body.botCy + 11.5} textAnchor="middle">
              {Math.round(body.widthLabelCm)} cm
            </text>
            {body.heightLabelCm != null && (
              <>
                <line
                  x1={50 + body.botRx + 5}
                  y1={body.topCy}
                  x2={50 + body.botRx + 5}
                  y2={body.botCy}
                  stroke="#5c554c"
                  strokeWidth="0.25"
                />
                <text
                  x={50 + body.botRx + 7}
                  y={(body.topCy + body.botCy) / 2}
                  textAnchor="start"
                >
                  {Math.round(body.heightLabelCm)} cm
                </text>
              </>
            )}
          </g>
        )}
      </svg>
      {lightOn && (
        <p className="shade-renderer-note">
          Lighting preview is illustrative. Actual appearance varies with bulb and room lighting.
        </p>
      )}
    </div>
  );
}
