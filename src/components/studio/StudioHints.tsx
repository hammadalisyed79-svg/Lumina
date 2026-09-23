import Link from "next/link";

export function StudioSizeHint({
  sizes,
}: {
  sizes: { name: string; diameterCm?: number | null; heightCm?: number | null }[];
}) {
  const withDims = sizes.filter((s) => s.diameterCm || s.heightCm).slice(0, 4);
  return (
    <aside className="surface-panel p-4 md:p-5 mt-6 text-sm">
      <p className="eyebrow mb-2">Sizing tip</p>
      <p className="prose-muted text-sm mb-3">
        Diameter should feel about two-thirds the width of a table base, or balanced with pendant
        height. Measure in centimetres before you commit.
      </p>
      {withDims.length > 0 && (
        <ul className="space-y-1.5 text-xs text-muted mb-3">
          {withDims.map((s) => (
            <li key={s.name}>
              <span className="text-ink">{s.name}</span>
              {s.diameterCm != null && ` · Ø ${s.diameterCm} cm`}
              {s.heightCm != null && ` · H ${s.heightCm} cm`}
            </li>
          ))}
        </ul>
      )}
      <Link href="/size-guide" className="underline underline-offset-4 text-xs tracking-wide hover:text-bronze">
        Open the size guide
      </Link>
    </aside>
  );
}

export function StudioFittingHint() {
  return (
    <aside className="surface-panel p-4 md:p-5 mt-6 text-sm">
      <p className="eyebrow mb-2">Fitting tip</p>
      <p className="prose-muted text-sm mb-3">
        Pendant fittings hang from a flex; table and floor fittings sit on a lamp harp. Choose the
        washer set that matches your lamp — add a note at checkout if unsure.
      </p>
      <Link href="/size-guide" className="underline underline-offset-4 text-xs tracking-wide hover:text-bronze">
        Size &amp; fitting guide
      </Link>
    </aside>
  );
}
