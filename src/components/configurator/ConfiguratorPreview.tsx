"use client";

import { memo } from "react";
import { ShadeRenderer } from "@/components/configurator/ShadeRenderer";
import type { ShadeDims } from "@/lib/configurator/geometry";
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
  mode: PreviewMode;
  room: RoomContext;
  showDimensions: boolean;
  onModeChange: (m: PreviewMode) => void;
  onRoomChange: (r: RoomContext) => void;
  onShowDimensionsChange: (v: boolean) => void;
  onZoomFabric?: () => void;
  compact?: boolean;
};

const MODES: { id: PreviewMode; label: string }[] = [
  { id: "exterior", label: "Exterior" },
  { id: "interior", label: "Interior" },
  { id: "light", label: "Light on" },
  { id: "room", label: "Room" },
];

const ROOMS: { id: RoomContext; label: string }[] = [
  { id: "studio", label: "Studio" },
  { id: "table", label: "Table" },
  { id: "floor", label: "Floor" },
  { id: "ceiling", label: "Ceiling" },
];

function ConfiguratorPreviewInner({
  shapeKey,
  dims,
  fabricUrl,
  fabricName,
  patternScale,
  patternOffsetX,
  patternOffsetY,
  patternRotation,
  repeatMode,
  liningName,
  liningColour,
  liningHex,
  reflectivityHint,
  mode,
  room,
  showDimensions,
  onModeChange,
  onRoomChange,
  onShowDimensionsChange,
  onZoomFabric,
  compact = false,
}: Props) {
  const effectiveMode = mode === "room" ? "exterior" : mode;
  const effectiveRoom = mode === "room" ? room : "studio";

  return (
    <div className={`cfg-preview ${compact ? "cfg-preview--compact" : ""}`}>
      <div className="cfg-preview-frame studio-preview-frame">
        <ShadeRenderer
          shapeKey={shapeKey || "drum"}
          dims={dims}
          fabricUrl={fabricUrl}
          fabricName={fabricName}
          patternScale={patternScale}
          patternOffsetX={patternOffsetX}
          patternOffsetY={patternOffsetY}
          patternRotation={patternRotation}
          repeatMode={repeatMode}
          liningName={liningName}
          liningColour={liningColour}
          liningHex={liningHex}
          reflectivityHint={reflectivityHint}
          mode={effectiveMode}
          room={effectiveRoom}
          showDimensions={showDimensions}
          className="cfg-preview-renderer"
        />
      </div>

      {!compact && (
        <div className="cfg-preview-controls mt-4 space-y-3">
          <div
            className="cfg-segment"
            role="radiogroup"
            aria-label="Preview mode"
          >
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={mode === m.id}
                className={`cfg-segment__btn ${mode === m.id ? "is-active" : ""}`}
                onClick={() => onModeChange(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>

          {mode === "room" && (
            <div
              className="cfg-segment"
              role="radiogroup"
              aria-label="Room context"
            >
              {ROOMS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  role="radio"
                  aria-checked={room === r.id}
                  className={`cfg-segment__btn ${room === r.id ? "is-active" : ""}`}
                  onClick={() => onRoomChange(r.id)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-xs tracking-[0.08em] uppercase text-muted cursor-pointer">
              <input
                type="checkbox"
                checked={showDimensions}
                onChange={(e) => onShowDimensionsChange(e.target.checked)}
                className="accent-[var(--bronze)]"
              />
              Show dimensions
            </label>
            {fabricUrl && onZoomFabric && (
              <button
                type="button"
                className="text-xs tracking-[0.08em] uppercase text-bronze underline underline-offset-4"
                onClick={onZoomFabric}
              >
                Zoom fabric
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export const ConfiguratorPreview = memo(ConfiguratorPreviewInner);
