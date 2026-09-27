"use client";

import { memo, useEffect } from "react";
import { ShadeRenderer } from "@/components/configurator/ShadeRenderer";
import type { ShadeDims } from "@/lib/configurator/geometry";
import type {
  FabricRepeatMode,
  PreviewMode,
  RoomContext,
  UseType,
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
  useType?: UseType | null;
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
  { id: "room", label: "In room" },
];

function roomFromUse(useType?: UseType | null): RoomContext {
  if (useType === "ceiling") return "ceiling";
  if (useType === "floor") return "floor";
  if (useType === "table") return "table";
  return "studio";
}

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
  useType,
  showDimensions,
  onModeChange,
  onRoomChange,
  onShowDimensionsChange,
  onZoomFabric,
  compact = false,
}: Props) {
  useEffect(() => {
    const next = roomFromUse(useType);
    if (next !== "studio" && room !== next) onRoomChange(next);
  }, [useType, room, onRoomChange]);

  const sceneRoom: RoomContext =
    mode === "room" ? (roomFromUse(useType) !== "studio" ? roomFromUse(useType) : room) : "studio";
  const effectiveMode = mode === "room" ? "exterior" : mode;
  const roomLabel =
    sceneRoom === "table"
      ? "table lamp"
      : sceneRoom === "floor"
        ? "floor lamp"
        : sceneRoom === "ceiling"
          ? "ceiling pendant"
          : "studio shade";

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
          room={sceneRoom}
          showDimensions={showDimensions && mode !== "room"}
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
                onClick={() => {
                  onModeChange(m.id);
                  if (m.id === "room") onRoomChange(roomFromUse(useType));
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {mode === "room" && (
            <p className="text-xs tracking-[0.08em] uppercase text-muted">
              Complete {roomLabel} in setting
            </p>
          )}

          <div className="cfg-preview-meta flex flex-wrap items-center gap-x-4 gap-y-2">
            <label className="inline-flex items-center gap-2 text-xs tracking-[0.08em] uppercase text-muted cursor-pointer">
              <input
                type="checkbox"
                checked={showDimensions}
                onChange={(e) => onShowDimensionsChange(e.target.checked)}
                className="accent-[var(--bronze)]"
                disabled={mode === "room"}
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
