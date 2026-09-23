import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/shop/ProductCard";
import { FeaturedSlider } from "@/components/home/FeaturedSlider";
import { ReviewsStrip } from "@/components/home/ReviewsStrip";
import { NewsletterForm } from "@/components/home/NewsletterForm";
import { toNumber } from "@/lib/pricing";
import { isWebImageUrl, shortDisplayTitle } from "@/lib/utils";
import type { Product, ProductImage, ProductType } from "@prisma/client";

export const dynamic = "force-dynamic";

type ProductWithImages = Product & { images: ProductImage[] };

function firstWebImage(images: { url: string }[]) {
  return images.find((i) => isWebImageUrl(i.url))?.url || null;
}

function toCard(p: ProductWithImages) {
  const imageUrl = firstWebImage(p.images);
  if (!imageUrl) return null;
  return {
    id: p.id,
    slug: p.slug,
    title: shortDisplayTitle(p.title),
    subtitle: p.subtitle,
    basePrice: toNumber(p.basePrice),
    imageUrl,
    hoverImageUrl: p.images.find((i, idx) => idx > 0 && isWebImageUrl(i.url))?.url,
  };
}

async function pickByType(type: ProductType, take: number) {
  const rows = await prisma.product.findMany({
    where: {
      published: true,
      type,
      images: { some: { NOT: { url: { contains: ".heic" } } } },
    },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 4 } },
    orderBy: [{ featured: "desc" }, { bestseller: "desc" }, { updatedAt: "desc" }],
    take: take * 2,
  });
  return rows.map(toCard).filter(Boolean).slice(0, take) as NonNullable<
    ReturnType<typeof toCard>
  >[];
}

async function shapeImageMap(keys: string[]) {
  const map: Record<string, string> = {};
  await Promise.all(
    keys.map(async (key) => {
      const p = await prisma.product.findFirst({
        where: {
          published: true,
          shapeKey: key,
          type: "LAMPSHADE",
          images: { some: {} },
        },
        include: { images: { orderBy: { sortOrder: "asc" }, take: 6 } },
        orderBy: [{ featured: "desc" }, { bestseller: "desc" }],
      });
      const url = p ? firstWebImage(p.images) : null;
      if (url) map[key] = url;
    })
  );
  // Ensure every key has a real photo — fall back to drum if a shape is sparse
  const drum = map.drum;
  for (const key of keys) {
    if (!map[key] && drum) map[key] = drum;
  }
  return map;
}

async function moodImage(slug: string, fallback: string, avoid: Set<string>) {
  const col = await prisma.collection.findUnique({
    where: { slug },
    include: {
      products: {
        take: 12,
        include: {
          product: {
            include: { images: { orderBy: { sortOrder: "asc" }, take: 4 } },
          },
        },
      },
    },
  });
  for (const row of col?.products || []) {
    const url = firstWebImage(row.product.images);
    if (url && !avoid.has(url)) {
      avoid.add(url);
      return url;
    }
  }
  for (const row of col?.products || []) {
    const url = firstWebImage(row.product.images);
    if (url) return url;
  }
  return fallback;
}

export default async function HomePage() {
  const shapeKeys = ["drum", "empire", "oval", "rectangular", "coolie", "square"];

  const [shapes, shapeImages, curatedParts, moodMeta, reviews, lifestyle, homepageSections] =
    await Promise.all([
      prisma.shape.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
      shapeImageMap(shapeKeys),
      Promise.all([
        pickByType("LAMPSHADE", 6),
        pickByType("FABRIC", 1),
        pickByType("CUSHION", 1),
      ]),
      prisma.collection.findMany({
        where: { slug: { in: ["linen-calm", "botanical", "bestsellers"] }, published: true },
      }),
      prisma.review.findMany({
        where: { status: "APPROVED" },
        include: { product: true },
        take: 6,
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.findMany({
        where: {
          published: true,
          type: "LAMPSHADE",
          images: { some: { NOT: { url: { contains: ".heic" } } } },
        },
        include: { images: { orderBy: { sortOrder: "asc" }, take: 3 } },
        orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
        take: 12,
      }),
      prisma.homepageSection.findMany({
        where: { enabled: true },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

  const heroSection = homepageSections.find((s) => s.type === "HERO");
  const editorialSection = homepageSections.find((s) => s.type === "EDITORIAL");
  const homesSection = homepageSections.find((s) => s.type === "CUSTOMER_HOMES");
  const heroPayload = (heroSection?.payload || {}) as {
    eyebrow?: string;
    secondaryCtaLabel?: string;
    secondaryCtaHref?: string;
  };
  const homesPayload = (homesSection?.payload || {}) as { images?: string[] };

  const selected = curatedParts.flat();
  const lifestyleUrls = lifestyle
    .map((p) => firstWebImage(p.images))
    .filter(Boolean) as string[];

  const designImage =
    shapeImages.drum ||
    lifestyleUrls[0] ||
    "/media/products/handmade-by-order-luxury-teal-golden-wave-pattern-abstract-art-print-on-velvet-drum-lamp-shade-pendant-light-lamp-shade-all-shapes-and-sizes/03-83136991330682.jpg";

  const craftImage = lifestyleUrls[1] || designImage;
  const tradeImage = lifestyleUrls[2] || designImage;

  const usedMoodImages = new Set<string>();
  const moodCards = [];
  for (const m of moodMeta) {
    moodCards.push({
      ...m,
      imageUrl: await moodImage(m.slug, designImage, usedMoodImages),
    });
  }

  const bestsellers = (
    await prisma.product.findMany({
      where: {
        published: true,
        bestseller: true,
        images: { some: { NOT: { url: { contains: ".heic" } } } },
      },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 4 } },
      take: 12,
    })
  )
    .map(toCard)
    .filter(Boolean)
    .slice(0, 4) as NonNullable<ReturnType<typeof toCard>>[];

  // Prefer mixed bestsellers if kits dominate
  const mixedBestsellers =
    bestsellers.filter((b) => !/kit/i.test(b.title)).length >= 2
      ? bestsellers
      : selected.slice(0, 4);

  // Category tiles from the live luminahub.co.uk homepage (downloaded locally)
  const categoryTiles: Record<string, string> = {
    drum: "/media/homepage/shape-0.png",
    oval: "/media/homepage/shape-1.png",
    rectangular: "/media/homepage/shape-2.png",
    square: "/media/homepage/shape-3.png",
  };

  const heroImage = heroSection?.imageUrl || "/media/homepage/hero-lifestyle.png";
  const storyImage = "/media/homepage/story-craft.png";
  const cmsHomeImages =
    homesPayload.images?.filter(Boolean) ||
    [heroImage, storyImage, categoryTiles.rectangular || designImage].filter(Boolean);
  const homeImages = cmsHomeImages.length
    ? cmsHomeImages.slice(0, 3)
    : [
        lifestyleUrls[3] || designImage,
        lifestyleUrls[4] || craftImage,
        lifestyleUrls[5] || tradeImage,
      ];

  return (
    <>
      <section className="relative min-h-[78vh] md:min-h-[88vh] flex items-center overflow-hidden bg-[color:var(--ink)]">
        <Image
          src={heroImage}
          alt="Lumina Hub handmade lampshades styled in a living room"
          fill
          priority
          className="object-cover object-[center_40%]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(28,25,21,0.45)] via-[rgba(28,25,21,0.18)] to-transparent" />
        <div className="relative container-site py-16 md:py-24 text-white max-w-3xl">
          <p className="eyebrow text-white/85 mb-3">
            {heroPayload.eyebrow || "Lighting · Home decor"}
          </p>
          <h1 className="font-display text-5xl md:text-7xl leading-[1.05] mb-3">
            {heroSection?.title || "Welcome to Lumina Hub"}
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-xl mb-8">
            {heroSection?.subtitle ||
              "Where light meets craftsmanship — handmade lampshades, cushions and printed fabrics from our UK studio."}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href={heroSection?.ctaHref || "/shop/lampshades"} className="btn-primary">
              {heroSection?.ctaLabel || "Shop now"}
            </Link>
            <Link
              href={heroPayload.secondaryCtaHref || "/about"}
              className="btn-ghost"
            >
              {heroPayload.secondaryCtaLabel || "Our story"}
            </Link>
          </div>
        </div>
      </section>

      <section className="section-pad container-site">
        <div className="flex items-end justify-between gap-4 mb-6 md:mb-8">
          <div>
            <p className="eyebrow mb-2">Categories</p>
            <h2 className="font-display text-4xl md:text-5xl">Shop by shape</h2>
            <p className="prose-muted mt-2 max-w-lg">
              Discover premium handmade lamp shades for every space.
            </p>
          </div>
          <Link href="/shop/lampshades" className="text-sm underline hidden sm:inline">
            Explore our range
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {shapes.map((s) => {
            const src = categoryTiles[s.key] || shapeImages[s.key] || designImage;
            return (
              <Link
                key={s.id}
                href={`/shop/lampshades?shape=${s.key}`}
                className="group block"
              >
                <div className="relative aspect-square overflow-hidden bg-[color:var(--stone)] mb-2">
                  <Image
                    src={src}
                    alt={`${s.name} lampshade`}
                    fill
                    className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width:768px) 50vw, 16vw"
                  />
                </div>
                <p className="text-center text-sm tracking-wide">{s.name} lampshades</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="bg-[color:var(--charcoal)] text-[color:var(--ivory)]">
        <div className="container-site section-pad grid md:grid-cols-2 gap-8 md:gap-10 items-center">
          <div>
            <p className="eyebrow text-[color:var(--champagne)] mb-3">Made for your room</p>
            <h2 className="font-display text-4xl md:text-5xl mb-4">Design your shade</h2>
            <p className="text-white/75 max-w-md mb-6">
              Explore shape, fabric, size, lining and fitting in the studio tool. Purchasing a
              configured shade opens once each option maps to a Shopify variant — until then,
              save a design or enquire with the studio.
            </p>
            <Link href="/design-your-shade" className="btn-primary">
              Start designing
            </Link>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden bg-[color:var(--ink)]">
            <Image
              src={designImage}
              alt="Handmade lampshade designed in the Lumina studio"
              fill
              className="object-cover object-center"
              sizes="(max-width:768px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      <section className="section-pad container-site">
        <div className="flex items-end justify-between gap-4 mb-6 md:mb-8">
          <div>
            <p className="eyebrow mb-2">Featured</p>
            <h2 className="font-display text-4xl md:text-5xl">Drum lampshades</h2>
          </div>
          <Link href="/shop/lampshades?shape=drum" className="text-sm underline hidden sm:inline">
            Shop more
          </Link>
        </div>
        <FeaturedSlider products={selected} />
      </section>

      <section className="container-site section-pad grid md:grid-cols-2 gap-8 md:gap-10 items-center">
        <div className="relative aspect-[4/5] overflow-hidden bg-[color:var(--stone)]">
          <Image
            src={storyImage}
            alt="Lumina Hub craftsmanship — shades bringing spaces to life"
            fill
            className="object-cover object-center"
            sizes="(max-width:768px) 100vw, 50vw"
          />
        </div>
        <div>
          <p className="eyebrow mb-3">Our story</p>
          <h2 className="font-display text-4xl md:text-5xl mb-4">Light &amp; texture</h2>
          <p className="prose-muted max-w-md mb-6">
            We craft handmade lampshades and lighting, one piece at a time, in the UK. Our
            studio blends timeless silhouettes with rich textures — velvet, linen and bespoke
            prints — so your space feels warm, refined and personal.
          </p>
          <Link href="/about" className="btn-secondary">
            Read more
          </Link>
        </div>
      </section>

      {moodCards.length > 0 && (
      <section className="section-pad bg-[color:var(--stone)]/35">
        <div className="container-site">
          <p className="eyebrow mb-2">Atmospheres</p>
          <h2 className="font-display text-4xl md:text-5xl mb-6 md:mb-8">Shop by mood</h2>
          <div className="grid md:grid-cols-3 gap-4 md:gap-5">
            {moodCards.map((m) => (
              <Link
                key={m.id}
                href={`/shop/${m.slug}`}
                className="group relative aspect-[5/6] overflow-hidden bg-[color:var(--stone)]"
              >
                <Image
                  src={m.imageUrl}
                  alt={m.title}
                  fill
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.04]"
                  sizes="(max-width:768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <p className="font-display text-3xl">{m.title}</p>
                  {m.description && (
                    <p className="text-sm text-white/80 mt-1 line-clamp-2">{m.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      )}

      <section className="section-pad container-site max-w-3xl text-center">
        <p className="eyebrow mb-3">Editorial</p>
        <h2 className="font-display text-4xl md:text-5xl mb-4">
          {editorialSection?.title || "Light as an interior material"}
        </h2>
        <p className="prose-muted text-lg mb-8">
          {editorialSection?.body ||
            "We treat fabric, frame and lining as a composition — so each shade feels considered in the room, not merely functional."}
        </p>
        <Link href={editorialSection?.ctaHref || "/about"} className="btn-secondary">
          {editorialSection?.ctaLabel || "Our atelier"}
        </Link>
      </section>

      <section className="section-pad container-site">
        <div className="flex items-end justify-between mb-6 md:mb-8">
          <div>
            <p className="eyebrow mb-2">Favourites</p>
            <h2 className="font-display text-4xl md:text-5xl">Bestsellers</h2>
          </div>
          <Link href="/shop/bestsellers" className="text-sm underline">
            Shop all
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {mixedBestsellers.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="bg-[color:var(--charcoal)] text-white">
        <div className="container-site section-pad">
          <p className="eyebrow text-[color:var(--champagne)] mb-2">In situ</p>
          <h2 className="font-display text-4xl md:text-5xl mb-6 md:mb-8">Customer homes</h2>
          <div className="grid md:grid-cols-3 gap-3 md:gap-4">
            {homeImages.map((src, i) => (
              <div key={`${src}-${i}`} className="relative aspect-[4/5] overflow-hidden">
                <Image
                  src={src}
                  alt="Lumina Hub lampshade in an interior setting"
                  fill
                  className="object-cover object-center"
                  sizes="(max-width:768px) 100vw, 33vw"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad container-site">
        <p className="eyebrow mb-2">Kind words</p>
        <h2 className="font-display text-4xl md:text-5xl mb-6 md:mb-8">Reviews</h2>
        <ReviewsStrip
          reviews={reviews.map((r) => ({
            id: r.id,
            author: r.author,
            rating: r.rating,
            title: r.title,
            body: r.body,
            productTitle: shortDisplayTitle(r.product.title, 40),
          }))}
        />
      </section>

      <section className="container-site section-pad grid md:grid-cols-2 gap-8 md:gap-10 items-center border-y border-[color:var(--line)]">
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
        <div className="relative aspect-[16/11] overflow-hidden bg-[color:var(--stone)]">
          <Image
            src={tradeImage}
            alt="Lumina Hub trade and project shades"
            fill
            className="object-cover object-center"
            sizes="(max-width:768px) 100vw, 50vw"
          />
        </div>
      </section>

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
