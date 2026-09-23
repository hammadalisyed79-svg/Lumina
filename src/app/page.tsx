import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/shop/ProductCard";
import { FeaturedSlider } from "@/components/home/FeaturedSlider";
import { ReviewsStrip } from "@/components/home/ReviewsStrip";
import { NewsletterForm } from "@/components/home/NewsletterForm";
import { toNumber } from "@/lib/pricing";
import { isWebImageUrl, shortDisplayTitle } from "@/lib/utils";
import { COPY } from "@/lib/copy";
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
      <section className="relative min-h-[86vh] md:min-h-[92vh] flex items-end md:items-center overflow-hidden bg-ink">
        <Image
          src={heroImage}
          alt="Lumina Hub handmade lampshades styled in a living room"
          fill
          priority
          className="object-cover object-[center_40%] lux-ken"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(20,17,14,0.72)] via-[rgba(20,17,14,0.28)] to-[rgba(20,17,14,0.12)] md:bg-gradient-to-r md:from-[rgba(20,17,14,0.68)] md:via-[rgba(20,17,14,0.28)] md:to-transparent" />
        <div className="relative container-site w-full py-16 md:py-24 text-white">
          <div className="max-w-2xl">
            <p className="eyebrow text-champagne lux-reveal mb-5">
              {heroPayload.eyebrow || COPY.hero.eyebrow}
            </p>
            <h1 className="font-display text-[3.25rem] leading-[0.95] sm:text-6xl md:text-8xl tracking-tight lux-reveal lux-reveal-delay-1 mb-5">
              {heroSection?.title || COPY.hero.title}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/85 max-w-md leading-relaxed lux-reveal lux-reveal-delay-2 mb-8">
              {heroSection?.subtitle || COPY.hero.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 lux-reveal lux-reveal-delay-3">
              <Link
                href={heroSection?.ctaHref || "/shop/lampshades"}
                className="btn-primary w-full sm:w-auto text-center"
              >
                {heroSection?.ctaLabel || COPY.hero.cta}
              </Link>
              <Link
                href={heroPayload.secondaryCtaHref || "/design-your-shade"}
                className="btn-ghost w-full sm:w-auto text-center"
              >
                {heroPayload.secondaryCtaLabel || COPY.hero.secondary}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad container-site">
        <div className="flex items-end justify-between gap-4 mb-8 md:mb-10">
          <div className="max-w-xl">
            <p className="eyebrow mb-3">{COPY.shopByShape.eyebrow}</p>
            <h2 className="section-title">{COPY.shopByShape.title}</h2>
            <div className="lux-rule" />
            <p className="prose-muted">{COPY.shopByShape.body}</p>
          </div>
          <Link
            href="/shop/lampshades"
            className="text-xs tracking-[0.14em] uppercase underline underline-offset-4 hidden sm:inline hover:text-bronze"
          >
            {COPY.shopByShape.link}
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {shapes.map((s) => {
            const src = categoryTiles[s.key] || shapeImages[s.key] || designImage;
            return (
              <Link key={s.id} href={`/shop/lampshades?shape=${s.key}`} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden bg-stone mb-3">
                  <Image
                    src={src}
                    alt={`${s.name} lampshade`}
                    fill
                    unoptimized
                    className="object-cover object-center img-zoom"
                    sizes="(max-width:768px) 50vw, 16vw"
                  />
                </div>
                <p className="text-center text-xs tracking-[0.14em] uppercase text-ink/80 group-hover:text-bronze transition-colors">
                  {s.name}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="bg-charcoal text-ivory">
        <div className="container-site section-pad grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div>
            <p className="eyebrow text-champagne mb-3">{COPY.design.eyebrow}</p>
            <h2 className="section-title text-ivory">{COPY.design.title}</h2>
            <div className="lux-rule" />
            <p className="text-ivory/70 max-w-md mb-8 leading-relaxed">{COPY.design.body}</p>
            <Link href="/design-your-shade" className="btn-primary">
              {COPY.design.cta}
            </Link>
          </div>
          <div className="relative aspect-[4/5] md:aspect-[4/3] overflow-hidden bg-ink">
            <Image
              src={designImage}
              alt="Handmade lampshade designed in the Lumina studio"
              fill
              unoptimized
              className="object-cover object-center"
              sizes="(max-width:768px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      <section className="section-pad container-site">
        <div className="flex items-end justify-between gap-4 mb-8 md:mb-10">
          <div>
            <p className="eyebrow mb-3">{COPY.featured.eyebrow}</p>
            <h2 className="section-title">{COPY.featured.title}</h2>
          </div>
          <Link
            href="/shop/lampshades?shape=drum"
            className="text-xs tracking-[0.14em] uppercase underline underline-offset-4 hidden sm:inline hover:text-bronze"
          >
            {COPY.featured.link}
          </Link>
        </div>
        <FeaturedSlider products={selected} />
      </section>

      <section className="container-site section-pad grid md:grid-cols-2 gap-10 md:gap-16 items-center">
        <div className="relative aspect-[4/5] overflow-hidden bg-stone order-2 md:order-1">
          <Image
            src={storyImage}
            alt="Lumina Hub craftsmanship — shades bringing spaces to life"
            fill
            unoptimized
            className="object-cover object-center"
            sizes="(max-width:768px) 100vw, 50vw"
          />
        </div>
        <div className="order-1 md:order-2">
          <p className="eyebrow mb-3">{COPY.story.eyebrow}</p>
          <h2 className="section-title">{COPY.story.title}</h2>
          <div className="lux-rule" />
          <p className="prose-muted max-w-md mb-8">{COPY.story.body}</p>
          <Link href="/about" className="btn-secondary">
            {COPY.story.cta}
          </Link>
        </div>
      </section>

      {moodCards.length > 0 && (
        <section className="section-pad bg-stone/40">
          <div className="container-site">
            <p className="eyebrow mb-3">{COPY.mood.eyebrow}</p>
            <h2 className="section-title mb-8 md:mb-10">{COPY.mood.title}</h2>
            <div className="grid md:grid-cols-3 gap-4 md:gap-5">
              {moodCards.map((m) => (
                <Link
                  key={m.id}
                  href={`/shop/${m.slug}`}
                  className="group relative aspect-[5/6] overflow-hidden bg-stone"
                >
                  <Image
                    src={m.imageUrl}
                    alt={m.title}
                    fill
                    unoptimized
                    className="object-cover object-center img-zoom"
                    sizes="(max-width:768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute bottom-6 left-5 right-5 text-white">
                    <p className="font-display text-3xl md:text-4xl tracking-tight">{m.title}</p>
                    {m.description && (
                      <p className="text-sm text-white/80 mt-2 line-clamp-2 leading-relaxed">
                        {m.description}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section-pad container-site max-w-3xl text-center">
        <p className="eyebrow mb-3">{COPY.editorial.eyebrow}</p>
        <h2 className="section-title mb-4">
          {editorialSection?.title || COPY.editorial.title}
        </h2>
        <div className="lux-rule mx-auto" />
        <p className="prose-muted text-lg mb-8">
          {editorialSection?.body || COPY.editorial.body}
        </p>
        <Link href={editorialSection?.ctaHref || "/about"} className="btn-secondary">
          {editorialSection?.ctaLabel || COPY.editorial.cta}
        </Link>
      </section>

      <section className="section-pad container-site">
        <div className="flex items-end justify-between mb-8 md:mb-10 gap-4">
          <div>
            <p className="eyebrow mb-3">{COPY.bestsellers.eyebrow}</p>
            <h2 className="section-title">{COPY.bestsellers.title}</h2>
          </div>
          <Link
            href="/shop/bestsellers"
            className="text-xs tracking-[0.14em] uppercase underline underline-offset-4 hover:text-bronze"
          >
            {COPY.bestsellers.link}
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-7">
          {mixedBestsellers.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="bg-charcoal text-white">
        <div className="container-site section-pad">
          <p className="eyebrow text-champagne mb-3">{COPY.homes.eyebrow}</p>
          <h2 className="section-title text-ivory mb-8 md:mb-10">{COPY.homes.title}</h2>
          <div className="grid md:grid-cols-3 gap-3 md:gap-4">
            {homeImages.map((src, i) => (
              <div key={`${src}-${i}`} className="relative aspect-[4/5] overflow-hidden group">
                <Image
                  src={src}
                  alt="Lumina Hub lampshade in an interior setting"
                  fill
                  unoptimized
                  className="object-cover object-center img-zoom"
                  sizes="(max-width:768px) 100vw, 33vw"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad container-site">
        <p className="eyebrow mb-3">{COPY.reviews.eyebrow}</p>
        <h2 className="section-title mb-8 md:mb-10">{COPY.reviews.title}</h2>
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

      <section className="border-y border-line bg-ivory/50">
        <div className="container-site section-pad grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div>
            <p className="eyebrow mb-3">{COPY.trade.eyebrow}</p>
            <h2 className="section-title">{COPY.trade.title}</h2>
            <div className="lux-rule" />
            <p className="prose-muted max-w-md mb-8">{COPY.trade.body}</p>
            <Link href="/trade" className="btn-secondary">
              {COPY.trade.cta}
            </Link>
          </div>
          <div className="relative aspect-[16/11] overflow-hidden bg-stone">
            <Image
              src={tradeImage}
              alt="Lumina Hub trade and project shades"
              fill
              unoptimized
              className="object-cover object-center"
              sizes="(max-width:768px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      <section className="section-pad container-site max-w-lg text-center">
        <p className="eyebrow mb-3">{COPY.newsletter.eyebrow}</p>
        <h2 className="section-title mb-4">{COPY.newsletter.title}</h2>
        <div className="lux-rule mx-auto" />
        <p className="prose-muted mb-7">{COPY.newsletter.body}</p>
        <NewsletterForm />
      </section>
    </>
  );
}
