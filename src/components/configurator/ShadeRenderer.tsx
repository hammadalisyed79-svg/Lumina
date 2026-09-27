"use client";

import { useId, useMemo } from "react";
import { normalizeImageSrc } from "@/lib/image";
import { liningSwatchHex } from "@/lib/studio/images";
import { buildShadeBody, type ShadeDims } from "@/lib/configurator/geometry";
import type {
  FabricRepeatMode,
  PreviewMode,
  RoomContext,
} from "@/lib/configurator/types";

type Props = {
  shapeKey: string;
  dims: ShadeDims;
  fabricUrl?: string | null;
  fabricName?: string | null;
  patternScale?: number;
  patternOffsetX?: number;
  patternOffsetY?: number;
  patternRotation?: number;
  repeatMode?: FabricRepeatMode;
  liningName?: string | null;
  liningColour?: string | null;
  liningHex?: string | null;
  reflectivityHint?: number | null;
  mode?: PreviewMode;
  room?: RoomContext;
  showDimensions?: boolean;
  className?: string;
};

type SceneKind = "studio" | "table" | "floor" | "ceiling";

function SceneBackdrop({
  uid,
  scene,
  lightOn,
}: {
  uid: string;
  scene: SceneKind;
  lightOn: boolean;
}) {
  if (scene === "studio") {
    return (
      <g className="shade-scene-studio">
        <rect x="0" y="-10" width="100" height="138" fill={`url(#${uid}-bg)`} />
        <rect x="0" y="-10" width="100" height="138" fill={`url(#${uid}-spot)`} />
      </g>
    );
  }

  if (scene === "table") {
    return (
      <g className="shade-scene-table">
        {/* Soft living-room wall */}
        <rect x="0" y="-10" width="100" height="98" fill={`url(#${uid}-wall)`} />
        {/* Window light wash */}
        <ellipse
          cx="78"
          cy="18"
          rx="28"
          ry="36"
          fill="#fff8ea"
          opacity={lightOn ? 0.22 : 0.35}
        />
        <rect
          x="68"
          y="-2"
          width="22"
          height="32"
          rx="0.6"
          fill="none"
          stroke="#d9cfc0"
          strokeWidth="0.35"
          opacity="0.55"
        />
        <line
          x1="79"
          y1="-2"
          x2="79"
          y2="30"
          stroke="#d9cfc0"
          strokeWidth="0.25"
          opacity="0.45"
        />
        {/* Picture frame hint */}
        <rect
          x="10"
          y="8"
          width="16"
          height="20"
          fill="#ebe4d6"
          stroke="#cfc4b4"
          strokeWidth="0.4"
          opacity="0.7"
        />
        <rect x="12" y="10" width="12" height="16" fill="#d4c8b4" opacity="0.55" />
        {/* Tabletop */}
        <path
          d="M 4 92 L 96 92 L 90 118 L 10 118 Z"
          fill={`url(#${uid}-wood)`}
        />
        <path
          d="M 4 92 L 96 92 L 94 96 L 6 96 Z"
          fill="#5c4632"
          opacity="0.35"
        />
        {/* Table edge highlight */}
        <line
          x1="6"
          y1="92.4"
          x2="94"
          y2="92.4"
          stroke="#e8dcc8"
          strokeWidth="0.35"
          opacity="0.5"
        />
        {/* Soft contact shadow on table */}
        <ellipse
          cx="50"
          cy="91.2"
          rx="18"
          ry="2.2"
          fill="#1a1410"
          opacity={lightOn ? 0.18 : 0.28}
        />
      </g>
    );
  }

  if (scene === "floor") {
    return (
      <g className="shade-scene-floor">
        <rect x="0" y="-10" width="100" height="88" fill={`url(#${uid}-wall)`} />
        <ellipse
          cx="22"
          cy="12"
          rx="24"
          ry="30"
          fill="#fff6e6"
          opacity={lightOn ? 0.18 : 0.28}
        />
        {/* Skirting */}
        <rect x="0" y="76" width="100" height="3.2" fill="#c4b8a4" opacity="0.85" />
        {/* Floorboards */}
        <rect x="0" y="79" width="100" height="49" fill={`url(#${uid}-floor)`} />
        {[84, 90, 96, 102, 108, 114, 120].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="100"
            y2={y}
            stroke="#6b543c"
            strokeWidth="0.2"
            opacity="0.22"
          />
        ))}
        <ellipse
          cx="50"
          cy="112"
          rx="16"
          ry="3.5"
          fill="#1a1410"
          opacity={lightOn ? 0.2 : 0.32}
        />
      </g>
    );
  }

  // ceiling
  return (
    <g className="shade-scene-ceiling">
      {/* Room depth */}
      <rect x="0" y="48" width="100" height="80" fill={`url(#${uid}-room-deep)`} />
      {/* Ceiling plane */}
      <path
        d="M 0 -10 L 100 -10 L 88 42 L 12 42 Z"
        fill={`url(#${uid}-ceiling)`}
      />
      <path
        d="M 12 42 L 88 42 L 100 52 L 0 52 Z"
        fill="#2a241c"
        opacity="0.45"
      />
      {/* Far wall */}
      <rect x="12" y="42" width="76" height="10" fill="#3d3630" opacity="0.5" />
      {/* Floor far hint */}
      <path
        d="M 8 118 L 92 118 L 100 128 L 0 128 Z"
        fill="#4a3f34"
        opacity="0.55"
      />
      {lightOn && (
        <ellipse
          cx="50"
          cy="95"
          rx="34"
          ry="18"
          fill="#f5e6c8"
          opacity="0.2"
        />
      )}
    </g>
  );
}

function LampFixture({
  uid,
  scene,
  shadeBotCy,
  shadeTopCy,
  lightOn,
}: {
  uid: string;
  scene: SceneKind;
  shadeBotCy: number;
  shadeTopCy: number;
  lightOn: boolean;
}) {
  if (scene === "studio") {
    return (
      <line
        x1="50"
        y1={-2}
        x2="50"
        y2={shadeTopCy - 1}
        stroke="#7a7268"
        strokeWidth="0.45"
        opacity="0.55"
      />
    );
  }

  if (scene === "table") {
    const neckTop = shadeBotCy + 0.8;
    const vaseTop = Math.min(76, Math.max(neckTop + 6, 68));
    const tableY = 91;
    return (
      <g className="shade-fixture-table">
        <rect
          x="48.6"
          y={neckTop}
          width="2.8"
          height={Math.max(4, vaseTop - neckTop + 2)}
          rx="0.4"
          fill={`url(#${uid}-brass)`}
        />
        <ellipse
          cx="50"
          cy={neckTop + 0.9}
          rx="3.2"
          ry="1.1"
          fill="#c4a574"
        />
        <path
          d={`M 42 ${vaseTop + 2}
             C 40 ${vaseTop + 8}, 40 ${tableY - 3}, 43 ${tableY - 1}
             L 57 ${tableY - 1}
             C 60 ${tableY - 3}, 60 ${vaseTop + 8}, 58 ${vaseTop + 2}
             C 56 ${vaseTop - 2}, 54 ${vaseTop - 3.5}, 50 ${vaseTop - 3.5}
             C 46 ${vaseTop - 3.5}, 44 ${vaseTop - 2}, 42 ${vaseTop + 2} Z`}
          fill={`url(#${uid}-ceramic)`}
        />
        <path
          d={`M 43.5 ${vaseTop + 3} C 45 ${vaseTop + 0.5}, 55 ${vaseTop + 0.5}, 56.5 ${vaseTop + 3}`}
          fill="none"
          stroke="#fff8ee"
          strokeWidth="0.45"
          opacity="0.45"
        />
        <ellipse cx="50" cy={tableY + 0.2} rx="9" ry="2.2" fill="#3d3228" opacity="0.85" />
        <ellipse cx="50" cy={tableY - 0.6} rx="8.2" ry="1.6" fill={`url(#${uid}-brass)`} />
        {lightOn && (
          <ellipse cx="50" cy={tableY + 5} rx="22" ry="6" fill="#f5e0b8" opacity="0.22" />
        )}
      </g>
    );
  }

  if (scene === "floor") {
    const stemTop = shadeBotCy + 0.8;
    const baseY = 110.5;
    return (
      <g className="shade-fixture-floor">
        <rect
          x="48.85"
          y={stemTop}
          width="2.3"
          height={Math.max(10, baseY - stemTop - 1)}
          rx="0.35"
          fill={`url(#${uid}-brass)`}
        />
        <ellipse cx="50" cy={stemTop + 0.8} rx="2.8" ry="0.9" fill="#c4a574" />
        <ellipse cx="50" cy={baseY + 1} rx="14" ry="3.2" fill="#2a2218" opacity="0.9" />
        <ellipse cx="50" cy={baseY} rx="12.5" ry="2.6" fill={`url(#${uid}-brass)`} />
        <ellipse cx="50" cy={baseY - 0.8} rx="8" ry="1.5" fill="#5c4632" opacity="0.5" />
        {lightOn && (
          <ellipse cx="50" cy={baseY - 10} rx="26" ry="10" fill="#f5e0b8" opacity="0.18" />
        )}
      </g>
    );
  }

  // ceiling pendant
  return (
    <g className="shade-fixture-ceiling">
      {/* Ceiling rose */}
      <ellipse cx="50" cy="8" rx="6.5" ry="1.8" fill="#e8dfd0" />
      <ellipse cx="50" cy="8.4" rx="4.2" ry="1.1" fill="#d4c8b4" />
      <circle cx="50" cy="8.6" r="1.1" fill="#8a7348" />
      {/* Cord */}
      <line
        x1="50"
        y1="9.5"
        x2="50"
        y2={shadeTopCy - 0.5}
        stroke="#c4b8a8"
        strokeWidth="0.55"
        opacity="0.9"
      />
      {/* Cord grip */}
      <rect
        x="48.7"
        y={shadeTopCy - 2.2}
        width="2.6"
        height="2.4"
        rx="0.3"
        fill={`url(#${uid}-brass)`}
      />
    </g>
  );
}

/**
 * Deterministic 2D shade renderer — SVG body + fabric pattern + room scenes.
 */
export function ShadeRenderer({
  shapeKey,
  dims,
  fabricUrl,
  fabricName,
  patternScale = 1,
  patternOffsetX = 0,
  patternOffsetY = 0,
  patternRotation = 0,
  repeatMode = "REPEAT",
  liningName,
  liningColour,
  liningHex: liningHexProp,
  reflectivityHint,
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
  const liningHex =
    liningHexProp || liningSwatchHex(liningName, liningColour);
  const fabricHref = fabricUrl ? normalizeImageSrc(fabricUrl) : null;
  const scale = Math.max(0.45, Math.min(2.2, patternScale || 1));
  const patW = repeatMode === "COVER" ? 100 : 100 / scale;
  const patH = repeatMode === "COVER" ? 120 : 120 / scale;
  const ox = (patternOffsetX / 100) * patW;
  const oy = (patternOffsetY / 100) * patH;
  const reflect = Math.max(0, Math.min(1, reflectivityHint ?? 0.4));

  const lightOn = mode === "light";
  const showInterior = mode === "interior" || mode === "light";
  const scene: SceneKind =
    room === "table" || room === "floor" || room === "ceiling" || room === "studio"
      ? room
      : "studio";

  const roomTone =
    scene === "studio"
      ? ["#f7f3ea", "#ebe4d7", "#d8d0c2"]
      : scene === "ceiling"
        ? ["#3a342c", "#2a241c", "#1a1714"]
        : scene === "floor"
          ? ["#efe8dc", "#e2d8c8", "#d0c4b2"]
          : ["#f3ece2", "#e8dfd2", "#d8cdb8"];

  // Position shade higher for hanging, mid for table, slightly higher for floor
  const shadeShiftY =
    scene === "ceiling" ? -6 : scene === "table" ? -4 : scene === "floor" ? -10 : 0;
  const shadeScale =
    scene === "ceiling" ? 0.88 : scene === "floor" ? 0.82 : scene === "table" ? 0.9 : 1;

  const aspect =
    repeatMode === "CONTAIN" ? "xMidYMid meet" : "xMidYMid slice";

  return (
    <div
      className={`shade-renderer ${className}`.trim()}
      data-mode={mode}
      data-scene={scene}
    >
      <svg
        viewBox="0 -10 100 138"
        className="shade-renderer-svg"
        role="img"
        aria-label={`${shapeKey} shade${fabricName ? ` in ${fabricName}` : ""}${
          liningName ? `, ${liningName} lining` : ""
        }${scene !== "studio" ? ` on ${scene}` : ""}`}
      >
        <defs>
          <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={roomTone[0]} />
            <stop offset="55%" stopColor={roomTone[1]} />
            <stop offset="100%" stopColor={roomTone[2]} />
          </linearGradient>
          <linearGradient id={`${uid}-wall`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f7f1e6" />
            <stop offset="55%" stopColor="#ebe3d4" />
            <stop offset="100%" stopColor="#ddd2c0" />
          </linearGradient>
          <linearGradient id={`${uid}-wood`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8b6a45" />
            <stop offset="35%" stopColor="#a67c52" />
            <stop offset="70%" stopColor="#7a5738" />
            <stop offset="100%" stopColor="#6b4a30" />
          </linearGradient>
          <linearGradient id={`${uid}-floor`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b8956a" />
            <stop offset="50%" stopColor="#9a784e" />
            <stop offset="100%" stopColor="#7d5f3c" />
          </linearGradient>
          <linearGradient id={`${uid}-ceiling`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f2ebe0" />
            <stop offset="100%" stopColor="#d8cfc0" />
          </linearGradient>
          <linearGradient id={`${uid}-room-deep`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4a4036" />
            <stop offset="100%" stopColor="#2a2218" />
          </linearGradient>
          <linearGradient id={`${uid}-brass`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e8d4a8" />
            <stop offset="45%" stopColor="#c4a574" />
            <stop offset="100%" stopColor="#8a6b3d" />
          </linearGradient>
          <linearGradient id={`${uid}-ceramic`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#5c5348" />
            <stop offset="40%" stopColor="#8a8074" />
            <stop offset="55%" stopColor="#cfc4b4" />
            <stop offset="100%" stopColor="#4a433a" />
          </linearGradient>
          <radialGradient id={`${uid}-spot`} cx="50%" cy="28%" r="48%">
            <stop
              offset="0%"
              stopColor="#ffffff"
              stopOpacity={lightOn ? 0.28 : 0.75}
            />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          {fabricHref ? (
            <pattern
              id={`${uid}-fab`}
              patternUnits="userSpaceOnUse"
              width={patW}
              height={patH}
              patternTransform={`translate(${(100 - patW) / 2 + ox} ${(120 - patH) / 2 + oy}) rotate(${patternRotation} ${patW / 2} ${patH / 2})`}
            >
              <image
                href={fabricHref}
                x="0"
                y="0"
                width={patW}
                height={patH}
                preserveAspectRatio={aspect}
              />
            </pattern>
          ) : null}
          <linearGradient id={`${uid}-cyl`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1a1510" stopOpacity={lightOn ? 0.22 : 0.42} />
            <stop offset="18%" stopColor="#1a1510" stopOpacity="0.08" />
            <stop
              offset="50%"
              stopColor="#ffffff"
              stopOpacity={lightOn ? 0.22 + reflect * 0.18 : 0.16}
            />
            <stop offset="82%" stopColor="#1a1510" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#1a1510" stopOpacity={lightOn ? 0.22 : 0.42} />
          </linearGradient>
          <linearGradient id={`${uid}-fall`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
            <stop offset="50%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity={lightOn ? 0.1 : 0.22} />
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
          <radialGradient id={`${uid}-glow`} cx="50%" cy="68%" r={48 + reflect * 18}>
            <stop
              offset="0%"
              stopColor={liningHex}
              stopOpacity={lightOn ? 0.35 + reflect * 0.35 : 0}
            />
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

        <SceneBackdrop uid={uid} scene={scene} lightOn={lightOn} />
        {lightOn && scene === "studio" && (
          <rect x="0" y="-10" width="100" height="138" fill={`url(#${uid}-glow)`} />
        )}

        {/* Fixtures behind shade for hanging; in front for bases drawn after */}
        {scene === "ceiling" && (
          <LampFixture
            uid={uid}
            scene={scene}
            shadeBotCy={body.botCy * shadeScale + shadeShiftY}
            shadeTopCy={body.topCy * shadeScale + shadeShiftY}
            lightOn={lightOn}
          />
        )}

        <g
          filter={`url(#${uid}-soft)`}
          transform={`translate(50 ${50 + shadeShiftY}) scale(${shadeScale}) translate(-50 -50)`}
        >
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
              opacity={lightOn ? 0.25 + reflect * 0.25 : 0.2}
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

        {(scene === "table" || scene === "floor") && (
          <LampFixture
            uid={uid}
            scene={scene}
            shadeBotCy={body.botCy * shadeScale + shadeShiftY}
            shadeTopCy={body.topCy * shadeScale + shadeShiftY}
            lightOn={lightOn}
          />
        )}

        {scene === "studio" && (
          <LampFixture
            uid={uid}
            scene={scene}
            shadeBotCy={body.botCy}
            shadeTopCy={body.topCy}
            lightOn={lightOn}
          />
        )}

        {lightOn && scene !== "studio" && (
          <ellipse
            cx="50"
            cy={body.botCy * shadeScale + shadeShiftY + 8}
            rx="28"
            ry="14"
            fill={liningHex}
            opacity="0.16"
          />
        )}

        {showDimensions && body.widthLabelCm != null && (
          <g className="shade-dims" fill="#5c554c" fontSize="2.4">
            <line
              x1={50 - body.botRx * shadeScale}
              y1={body.botCy * shadeScale + shadeShiftY + 8}
              x2={50 + body.botRx * shadeScale}
              y2={body.botCy * shadeScale + shadeShiftY + 8}
              stroke="#5c554c"
              strokeWidth="0.25"
            />
            <text
              x="50"
              y={body.botCy * shadeScale + shadeShiftY + 11.5}
              textAnchor="middle"
            >
              {Math.round(body.widthLabelCm)} cm
            </text>
          </g>
        )}
      </svg>
      {lightOn && (
        <p className="shade-renderer-note">
          Lighting preview is illustrative. Actual appearance varies with bulb and room lighting.
        </p>
      )}
      {scene !== "studio" && !lightOn && (
        <p className="shade-renderer-note">
          {scene === "table"
            ? "Shown as a complete table lamp in a quiet room setting."
            : scene === "floor"
              ? "Shown as a complete floor lamp on a timber floor."
              : "Shown as a pendant hanging from the ceiling."}
        </p>
      )}
    </div>
  );
}
