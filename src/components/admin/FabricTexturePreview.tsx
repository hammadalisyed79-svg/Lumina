"use client";

import { useMemo, useState } from "react";
import { ShadeRenderer } from "@/components/configurator/ShadeRenderer";
import type { FabricRepeatMode } from "@/lib/configurator/types";

type Props = {
  initial: {
    textureImage: string;
    patternScale: number;
    patternOffsetX: number;
    patternOffsetY: number;
    patternRotation: number;
    repeatMode: FabricRepeatMode;
    usableAsTexture: boolean;
    name: string;
  };
};

export function FabricTexturePreview({ initial }: Props) {
  const [textureImage, setTextureImage] = useState(initial.textureImage);
  const [patternScale, setPatternScale] = useState(initial.patternScale);
  const [patternOffsetX, setPatternOffsetX] = useState(initial.patternOffsetX);
  const [patternOffsetY, setPatternOffsetY] = useState(initial.patternOffsetY);
  const [patternRotation, setPatternRotation] = useState(initial.patternRotation);
  const [repeatMode, setRepeatMode] = useState<FabricRepeatMode>(initial.repeatMode);
  const [usable, setUsable] = useState(initial.usableAsTexture);
  const [shapeKey, setShapeKey] = useState("drum");

  const url = usable && textureImage ? textureImage : null;
  const dims = useMemo(
    () => ({ diameterCm: 40, heightCm: 25, bottomDiameterCm: 40, topDiameterCm: 24 }),
    []
  );

  return (
    <div className="sm:col-span-2 grid md:grid-cols-2 gap-4 border border-[color:var(--admin-line)] p-3">
      <div className="space-y-3">
        <p className="admin-label">Configurator texture</p>
        <label className="block">
          <span className="admin-label">Texture image URL</span>
          <input
            name="textureImage"
            className="admin-input"
            value={textureImage}
            onChange={(e) => setTextureImage(e.target.value)}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="usableAsTexture"
            checked={usable}
            onChange={(e) => setUsable(e.target.checked)}
          />
          Usable as shade texture (never lifestyle/product shots)
        </label>
        <label className="block">
          <span className="admin-label">Pattern scale</span>
          <input
            name="patternScale"
            type="number"
            step="0.05"
            min="0.4"
            max="2.5"
            className="admin-input"
            value={patternScale}
            onChange={(e) => setPatternScale(Number(e.target.value) || 1)}
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label>
            <span className="admin-label">Offset X %</span>
            <input
              name="patternOffsetX"
              type="number"
              step="1"
              className="admin-input"
              value={patternOffsetX}
              onChange={(e) => setPatternOffsetX(Number(e.target.value) || 0)}
            />
          </label>
          <label>
            <span className="admin-label">Offset Y %</span>
            <input
              name="patternOffsetY"
              type="number"
              step="1"
              className="admin-input"
              value={patternOffsetY}
              onChange={(e) => setPatternOffsetY(Number(e.target.value) || 0)}
            />
          </label>
        </div>
        <label className="block">
          <span className="admin-label">Rotation °</span>
          <input
            name="patternRotation"
            type="number"
            step="1"
            className="admin-input"
            value={patternRotation}
            onChange={(e) => setPatternRotation(Number(e.target.value) || 0)}
          />
        </label>
        <label className="block">
          <span className="admin-label">Repeat mode</span>
          <select
            name="repeatMode"
            className="admin-input"
            value={repeatMode}
            onChange={(e) => setRepeatMode(e.target.value as FabricRepeatMode)}
          >
            <option value="REPEAT">REPEAT</option>
            <option value="COVER">COVER</option>
            <option value="CONTAIN">CONTAIN</option>
          </select>
        </label>
        <label className="block">
          <span className="admin-label">Preview shape</span>
          <select
            className="admin-input"
            value={shapeKey}
            onChange={(e) => setShapeKey(e.target.value)}
          >
            <option value="drum">Drum</option>
            <option value="empire">Empire</option>
            <option value="coolie">Coolie</option>
            <option value="oval">Oval</option>
            <option value="square">Square</option>
          </select>
        </label>
      </div>
      <div className="bg-[color:var(--admin-bg)] p-2">
        <ShadeRenderer
          shapeKey={shapeKey}
          dims={dims}
          fabricUrl={url}
          fabricName={initial.name}
          patternScale={patternScale}
          patternOffsetX={patternOffsetX}
          patternOffsetY={patternOffsetY}
          patternRotation={patternRotation}
          repeatMode={repeatMode}
          liningName="White"
          liningHex="#f7f7f5"
          mode="exterior"
        />
        {!usable && (
          <p className="text-xs text-[color:var(--admin-muted)] mt-2">
            Neutral fallback — mark usable only for flat fabric detail images.
          </p>
        )}
      </div>
    </div>
  );
}
