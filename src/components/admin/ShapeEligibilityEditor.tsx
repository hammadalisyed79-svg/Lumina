"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Opt = { id: string; label: string };

export function ShapeEligibilityEditor({
  shapeId,
  shapeName,
  sizes,
  fabrics,
  linings,
  fittings,
  selectedSizeIds,
  selectedFabricIds,
  selectedLiningIds,
  selectedFittingIds,
}: {
  shapeId: string;
  shapeName: string;
  sizes: Opt[];
  fabrics: Opt[];
  linings: Opt[];
  fittings: Opt[];
  selectedSizeIds: string[];
  selectedFabricIds: string[];
  selectedLiningIds: string[];
  selectedFittingIds: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sizeIds, setSizeIds] = useState(selectedSizeIds);
  const [fabricIds, setFabricIds] = useState(selectedFabricIds);
  const [liningIds, setLiningIds] = useState(selectedLiningIds);
  const [fittingIds, setFittingIds] = useState(selectedFittingIds);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const summary = useMemo(
    () =>
      `${sizeIds.length} sizes · ${fabricIds.length} fabrics · ${liningIds.length} linings · ${fittingIds.length} fittings`,
    [sizeIds, fabricIds, liningIds, fittingIds]
  );

  function toggle(list: string[], id: string, set: (v: string[]) => void) {
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  async function save() {
    setBusy(true);
    setError("");
    setMessage("");
    const res = await fetch(`/api/admin/shapes/${shapeId}/eligibility`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sizeIds, fabricIds, liningIds, fittingIds }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to save");
      return;
    }
    setMessage("Eligibility saved");
    router.refresh();
  }

  if (!open) {
    return (
      <button type="button" className="admin-link text-xs" onClick={() => setOpen(true)}>
        Compatibility ({summary})
      </button>
    );
  }

  return (
    <div className="admin-panel mt-3 space-y-4 text-left min-w-[18rem] max-w-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="admin-h2 !mb-0">{shapeName} compatibility</p>
          <p className="text-xs text-[color:var(--admin-muted)] mt-1">
            Explicit links drive Design Your Shade. Unchecked options cannot be selected.
          </p>
        </div>
        <button type="button" className="admin-link text-xs" onClick={() => setOpen(false)}>
          Close
        </button>
      </div>

      <Group
        title="Sizes"
        options={sizes}
        selected={sizeIds}
        onToggle={(id) => toggle(sizeIds, id, setSizeIds)}
      />
      <Group
        title="Fabrics"
        options={fabrics}
        selected={fabricIds}
        onToggle={(id) => toggle(fabricIds, id, setFabricIds)}
      />
      <Group
        title="Linings"
        options={linings}
        selected={liningIds}
        onToggle={(id) => toggle(liningIds, id, setLiningIds)}
      />
      <Group
        title="Fittings"
        options={fittings}
        selected={fittingIds}
        onToggle={(id) => toggle(fittingIds, id, setFittingIds)}
      />

      {error && <p className="text-sm text-red-700">{error}</p>}
      {message && <p className="text-sm text-emerald-800">{message}</p>}
      <button type="button" className="btn-primary" disabled={busy} onClick={save}>
        {busy ? "Saving…" : "Save compatibility"}
      </button>
    </div>
  );
}

function Group({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: Opt[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="admin-label">{title}</legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-auto border border-[color:var(--admin-line)] p-2">
        {options.map((o) => (
          <label key={o.id} className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(o.id)}
              onChange={() => onToggle(o.id)}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
