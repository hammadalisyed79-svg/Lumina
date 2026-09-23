import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--brass)] mb-3">
        About
      </p>
      <h1 className="font-[family-name:var(--font-display)] text-5xl sm:text-6xl leading-tight">
        Our story of light &amp; texture
      </h1>
      <div className="mt-8 space-y-5 text-[var(--muted)] leading-relaxed text-lg">
        <p>
          Lumina Hub crafts handmade lampshades and lighting, one piece at a
          time, in the UK. Our studio blends timeless silhouettes with rich
          textures — velvet, linen, and bespoke prints — so your space feels
          warm, refined, and personal.
        </p>
        <p>
          From drum and empire to rectangular and coolie, every shade is made to
          order. We print fabrics on demand, so patterns stay vivid and
          exclusive. Whether you shop for a single pendant or a full room
          refresh with cushion covers and kits, we focus on craftsmanship you
          can see when the light comes on.
        </p>
        <p>
          Free shipping across the UK on qualifying orders. Customer
          satisfaction is our first priority — and we&apos;re happy to help with
          sizing and fittings before you buy.
        </p>
      </div>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/shop" className="btn-primary">
          Shop the collection
        </Link>
        <Link href="/size-fitting" className="btn-outline">
          Size & fitting
        </Link>
      </div>
    </div>
  );
}
