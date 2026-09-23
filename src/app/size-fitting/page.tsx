import Link from "next/link";

export default function SizeFittingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--brass)] mb-3">
        Guide
      </p>
      <h1 className="font-[family-name:var(--font-display)] text-5xl">
        Size &amp; fitting
      </h1>
      <div className="mt-8 space-y-8 text-[var(--muted)] leading-relaxed">
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)] mb-2">
            Measuring your shade
          </h2>
          <p>
            Measure diameter (or width × depth for rectangular) and height in
            centimetres. For US harp fittings we can supply washer sets — note
            our sizes are in cm, not inches.
          </p>
        </section>
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)] mb-2">
            Pendant vs table
          </h2>
          <p>
            Confirm whether you need a pendant (ceiling) fitting or a table /
            floor lamp frame. Add notes at checkout if you need a specific
            duplex or spider fitting.
          </p>
        </section>
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)] mb-2">
            Made to order
          </h2>
          <p>
            Most shades are handmade to order. Please double-check size and
            shape before ordering. Shades 35cm+ may not be returnable once made.
          </p>
        </section>
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)] mb-2">
            Samples
          </h2>
          <p>
            If you only need to check a pattern or colour, ask about fabric
            samples before committing to a full shade.
          </p>
        </section>
      </div>
      <Link href="/contact" className="btn-primary mt-10 inline-flex">
        Ask about sizing
      </Link>
    </div>
  );
}
