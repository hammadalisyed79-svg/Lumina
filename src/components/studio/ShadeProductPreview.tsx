"use client";

import { useId } from "react";
import { normalizeImageSrc } from "@/lib/image";
import { liningSwatchHex } from "@/lib/studio/images";
import { shadeGeom, shadeSizeScale } from "@/lib/studio/shade-geom";

type Props = {
  shapeKey: string;
  fabricUrl: string;
  liningName?: string | null;
  liningColour?: string | null;
  diameterCm?: number | null;
  /** Lining step: boost inner glow so the choice is obvious. */
  emphasizeLining?: boolean;
  /** Fitting step: show a clearer fitting ring. */
  emphasizeFitting?: boolean;
};

/**
 * Live SVG lampshade — fabric on category silhouette + lining glow.
 * Renders in the browser so lining/size steps always update instantly.
 */
export function ShadeProductPreview({
  shapeKey,
  fabricUrl,
  liningName,
  liningColour,
  diameterCm,
  emphasizeLining = false,
  emphasizeFitting = false,
}: Props) {
  const uid = useId().replace(/:/g, "");
  const g = shadeGeom(shapeKey);
  const scale = shadeSizeScale(diameterCm);
  const liningHex = liningSwatchHex(liningName, liningColour);
  const fabricHref = normalizeImageSrc(fabricUrl);
  const liningOpacity = emphasizeLining ? 1 : 0.88;
  const glowBoost = emphasizeLining ? 0.55 : 0.28;

  return (
    <div className="studio-shade-live" aria-hidden>
      <svg
        className="studio-shade-live-svg"
        viewBox="0 0 100 120"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id={`${uid}-studio`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f7f3ea" />
            <stop offset="45%" stopColor="#ebe4d7" />
            <stop offset="100%" stopColor="#d8d0c2" />
          </linearGradient>
          <radialGradient id={`${uid}-spot`} cx="50%" cy="22%" r="48%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <pattern
            id={`${uid}-fab`}
            patternUnits="userSpaceOnUse"
            width="100"
            height="120"
          >
            <image
              href={fabricHref}
              x="0"
              y="0"
              width="100"
              height="120"
              preserveAspectRatio="xMidYMid slice"
            />
          </pattern>
          <linearGradient id={`${uid}-cyl`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1a1510" stopOpacity="0.45" />
            <stop offset="16%" stopColor="#1a1510" stopOpacity="0.12" />
            <stop offset="48%" stopColor="#ffffff" stopOpacity="0.2" />
            <stop offset="84%" stopColor="#1a1510" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#1a1510" stopOpacity="0.45" />
          </linearGradient>
          <linearGradient id={`${uid}-fall`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
            <stop offset="55%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.22" />
          </linearGradient>
          <radialGradient id={`${uid}-lining`} cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor={liningHex} stopOpacity={liningOpacity} />
            <stop offset="55%" stopColor={liningHex} stopOpacity={0.7} />
            <stop offset="100%" stopColor="#2a2018" stopOpacity="0.9" />
          </radialGradient>
          <linearGradient id={`${uid}-rim`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e8d9b8" />
            <stop offset="45%" stopColor="#c4a574" />
            <stop offset="100%" stopColor="#8a7348" />
          </linearGradient>
          <filter id={`${uid}-soft`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="2.4"
              stdDeviation="1.8"
              floodColor="#14110e"
              floodOpacity="0.35"
            />
          </filter>
        </defs>

        <rect width="100" height="120" fill={`url(#${uid}-studio)`} />
        <rect width="100" height="120" fill={`url(#${uid}-spot)`} />

        <text
          x="50"
          y="8.2"
          textAnchor="middle"
          fill="#6b6358"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 2.6 }}
          letterSpacing="0.35"
        >
          LAMPSHADES · HANDMADE IN BRITAIN
        </text>

        <line
          x1="50"
          y1="10"
          x2="50"
          y2={g.cordTo}
          stroke="#7a7268"
          strokeWidth="0.45"
          opacity="0.65"
        />
        <ellipse
          cx="50"
          cy={g.cordTo}
          rx={emphasizeFitting ? 2.4 : 1.6}
          ry={emphasizeFitting ? 1.1 : 0.7}
          fill={`url(#${uid}-rim)`}
          opacity="0.95"
        />
        {emphasizeFitting && (
          <ellipse
            cx="50"
            cy={g.cordTo + 1.8}
            rx="3.2"
            ry="1.2"
            fill="none"
            stroke={`url(#${uid}-rim)`}
            strokeWidth="0.35"
            opacity="0.7"
          />
        )}

        <ellipse
          cx="50"
          cy="110"
          rx={g.botRx * 0.95}
          ry="3.2"
          fill="#14110e"
          opacity="0.14"
          transform={`translate(50 110) scale(${scale}) translate(-50 -110)`}
        />

        <g
          transform={`translate(50 60) scale(${scale}) translate(-50 -60)`}
          filter={`url(#${uid}-soft)`}
        >
          <path d={g.body} fill={`url(#${uid}-fab)`} />
          <path d={g.body} fill={`url(#${uid}-cyl)`} />
          <path d={g.body} fill={`url(#${uid}-fall)`} />

          <ellipse
            cx={g.topCx}
            cy={g.topCy}
            rx={g.topRx}
            ry={g.topRy}
            fill="#2a241c"
            opacity="0.35"
          />
          <ellipse
            cx={g.topCx}
            cy={g.topCy}
            rx={g.topRx}
            ry={g.topRy}
            fill="none"
            stroke={`url(#${uid}-rim)`}
            strokeWidth="0.55"
          />

          <ellipse
            cx={g.botCx}
            cy={g.botCy}
            rx={g.innerRx}
            ry={g.innerRy}
            fill={`url(#${uid}-lining)`}
          />
          {/* Extra lining wash when choosing lining */}
          {emphasizeLining && (
            <ellipse
              cx={g.botCx}
              cy={g.botCy - 8}
              rx={g.innerRx * 0.85}
              ry={g.botRy * 2.2}
              fill={liningHex}
              opacity={glowBoost}
              style={{ mixBlendMode: "screen" }}
            />
          )}
          <ellipse
            cx={g.botCx}
            cy={g.botCy}
            rx={g.botRx}
            ry={g.botRy}
            fill="none"
            stroke={`url(#${uid}-rim)`}
            strokeWidth="0.5"
            opacity="0.85"
          />
          <ellipse
            cx={g.botCx}
            cy={g.botCy + 0.5}
            rx={g.innerRx * 0.7}
            ry={g.innerRy * 0.55}
            fill={liningHex}
            opacity={emphasizeLining ? 0.55 : 0.35}
          />
        </g>
      </svg>
    </div>
  );
}
