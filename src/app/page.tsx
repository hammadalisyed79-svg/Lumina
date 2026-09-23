import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/shop/ProductCard";
import { FeaturedSlider } from "@/components/home/FeaturedSlider";
import { ReviewsStrip } from "@/components/home/ReviewsStrip";
import { NewsletterForm } from "@/components/home/NewsletterForm";
import { toNumber } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [shapes, featured, bestsellers, moods, reviews] = await Promise.all([
    prisma.shape.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.product.findMany({
      where: { published: true, featured: true },
      include: { images: { orderBy: { sortOrder: "asc" } } },
      take: 8,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.product.findMany({
      where: { published: true, bestseller: true },
      include: { images: { orderBy: { sortOrder: "asc" } } },
      take: 8,
    }),
    prisma.collection.findMany({
      where: { slug: { in: ["linen-calm", "botanical", "bestsellers"] }, published: true },
    }),
    prisma.review.findMany({
      where: { status: "APPROVED" },
      include: { product: true },
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const cards = (products: typeof featured) =>
    products.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      subtitle: p.subtitle,
      basePrice: toNumber(p.basePrice),
      imageUrl: p.images[0]?.url || "/demo-assets/products/placeholder.svg",
      hoverImageUrl: p.images[1]?.url,
    }));

  return (
    <>
      {/* 1 Hero */}
      <section className="relative min-h-[88vh] flex items-end overflow-hidden">
        <Image
          src="/demo-assets/lifestyle/hero.svg"
          alt="Handmade lampshade in a British interior"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(28,25,21,0.55)] via-[rgba(28,25,21,0.15)] to-transparent" />
        <div className="relative container-site pb-16 md:pb-24 text-white max-w-3xl">
          <p className="font-display text-5xl md:text-7xl leading-[1.05] mb-4">Lumina Hub</p>
          <p className="text-lg md:text-xl text-white/90 max-w-xl mb-8">
            Handmade lampshades and interior textiles, crafted to order in Britain.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/shop/lampshades" className="btn-primary">
              Shop lampshades
            </Link>
            <Link href="/design-your-shade" className="btn-ghost">
              Design your shade
            </Link>
          </div>
        </div>
      </section>

      {/* 2 Shop by shape */}
      <section className="section-pad container-site">
        <div className="flex items-end justify-between gap-4 mb-10">
          <div>
            <p className="eyebrow mb-2">Forms</p>
            <h2 className="font-display text-4xl md:text-5xl">Shop by shape</h2>
          </div>
          <Link href="/shop/lampshades" className="text-sm underline hidden sm:inline">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {shapes.map((s) => (
            <Link
              key={s.id}
              href={`/shop/lampshades?shape=${s.key}`}
              className="group block"
            >
              <div className="relative aspect-square bg-[color:var(--stone)] overflow-hidden mb-3">
                <Image
                  src={s.imageUrl || "/demo-assets/shapes/drum.svg"}
                  alt={s.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <p className="text-center text-sm tracking-wide">{s.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 3 Design CTA */}
      <section className="bg-[color:var(--charcoal)] text-[color:var(--ivory)]">
        <div className="container-site section-pad grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="eyebrow text-[color:var(--champagne)] mb-3">Made for your room</p>
            <h2 className="font-display text-4xl md:text-5xl mb-4">Design your shade</h2>
            <p className="text-white/75 max-w-md mb-8">
              Choose shape, fabric, size, lining and fitting. Preview your configuration and add it
              to your bag with server-trusted pricing.
            </p>
            <Link href="/design-your-shade" className="btn-primary">
              Start designing
            </Link>
          </div>
          <div className="relative aspect-[4/3] bg-[color:var(--ink)]">
            <Image src="/demo-assets/lifestyle/atelier.svg" alt="" fill className="object-cover opacity-90" />
          </div>
        </div>
      </section>

      {/* 4 Featured slider */}
      <section className="section-pad container-site">
        <p className="eyebrow mb-2">Featured</p>
        <h2 className="font-display text-4xl md:text-5xl mb-10">Selected pieces</h2>
        <FeaturedSlider products={cards(featured)} />
      </section>

      {/* 5 Made by hand */}
      <section className="container-site section-pad grid md:grid-cols-2 gap-10 items-center">
        <div className="relative aspect-[4/5] bg-[color:var(--stone)]">
          <Image src="/demo-assets/lifestyle/atelier.svg" alt="Atelier craft" fill className="object-cover" />
        </div>
        <div>
          <p className="eyebrow mb-3">Craft</p>
          <h2 className="font-display text-4xl md:text-5xl mb-4">Made by hand</h2>
          <p className="prose-muted max-w-md mb-6">
            Each shade is stretched, trimmed and finished in our UK workshop. Frames are selected
            for proportion; fabrics are matched for grain and light quality.
          </p>
          <Link href="/about" className="btn-secondary">
            Our atelier
          </Link>
        </div>
      </section>

      {/* 6 Shop by mood */}
      <section className="section-pad bg-[color:var(--stone)]/35">
        <div className="container-site">
          <p className="eyebrow mb-2">Atmospheres</p>
          <h2 className="font-display text-4xl md:text-5xl mb-10">Shop by mood</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {moods.map((m) => (
              <Link key={m.id} href={`/shop/${m.slug}`} className="group relative aspect-[5/6] overflow-hidden bg-[color:var(--stone)]">
                <Image
                  src={m.imageUrl || "/demo-assets/lifestyle/atelier.svg"}
                  alt={m.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-6 left-6 text-white">
                  <p className="font-display text-3xl">{m.title}</p>
                  <p className="text-sm text-white/80 mt-1 max-w-xs">{m.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 7 Editorial */}
      <section className="section-pad container-site max-w-3xl text-center">
        <p className="eyebrow mb-3">Editorial</p>
        <h2 className="font-display text-4xl md:text-5xl mb-5">Light as an interior material</h2>
        <p className="prose-muted text-lg">
          We treat fabric, frame and lining as a composition — so each shade feels considered in
          the room, not merely functional. Quiet neutrals, botanical prints, and evening silks for
          British interiors.
        </p>
      </section>

      {/* 8 Bestsellers */}
      <section className="section-pad container-site">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="eyebrow mb-2">Favourites</p>
            <h2 className="font-display text-4xl md:text-5xl">Bestsellers</h2>
          </div>
          <Link href="/shop/bestsellers" className="text-sm underline">
            Shop all
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-8">
          {cards(bestsellers).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* 9 Customer homes */}
      <section className="bg-[color:var(--charcoal)] text-white">
        <div className="container-site section-pad">
          <p className="eyebrow text-[color:var(--champagne)] mb-2">In situ</p>
          <h2 className="font-display text-4xl md:text-5xl mb-10">Customer homes</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {["customer-home", "atelier", "botanical"].map((key) => (
              <div key={key} className="relative aspect-[4/5]">
                <Image
                  src={`/demo-assets/lifestyle/${key}.svg`}
                  alt="Customer interior with Lumina shade"
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10 Reviews */}
      <section className="section-pad container-site">
        <p className="eyebrow mb-2">Kind words</p>
        <h2 className="font-display text-4xl md:text-5xl mb-10">Reviews</h2>
        <ReviewsStrip reviews={reviews.map((r) => ({
          id: r.id,
          author: r.author,
          rating: r.rating,
          title: r.title,
          body: r.body,
          productTitle: r.product.title,
        }))} />
      </section>

      {/* 11 Trade */}
      <section className="container-site section-pad grid md:grid-cols-2 gap-10 items-center border-y border-[color:var(--line)]">
        <div>
          <p className="eyebrow mb-3">Professionals</p>
          <h2 className="font-display text-4xl md:text-5xl mb-4">Trade programme</h2>
          <p className="prose-muted max-w-md mb-6">
            Interior designers and retailers can apply for trade access, project support and
            priority lead times.
          </p>
          <Link href="/trade" className="btn-secondary">
            Apply for trade
          </Link>
        </div>
        <div className="relative aspect-[16/11] bg-[color:var(--stone)]">
          <Image src="/demo-assets/lifestyle/botanical.svg" alt="" fill className="object-cover" />
        </div>
      </section>

      {/* 12 Newsletter (also in footer) */}
      <section className="section-pad container-site max-w-xl text-center">
        <p className="eyebrow mb-3">Stay close</p>
        <h2 className="font-display text-4xl mb-4">Studio notes</h2>
        <p className="prose-muted mb-6">
          New fabrics, seasonal shades and atelier news — a few times a year, never noisy.
        </p>
        <NewsletterForm />
      </section>
    </>
  );
}
