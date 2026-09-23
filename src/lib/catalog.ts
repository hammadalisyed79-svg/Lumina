import { prisma } from "@/lib/db";
import { ProductType, Prisma } from "@prisma/client";
import { toNumber } from "@/lib/pricing";

export type ShopQuery = {
  shape?: string;
  sort?: string;
  q?: string;
  mood?: string;
  min?: string;
  max?: string;
};

export async function getCollectionBySlug(slug: string) {
  return prisma.collection.findUnique({ where: { slug } });
}

export async function listProductsForShop(opts: {
  collectionSlug?: string;
  type?: ProductType;
  query?: ShopQuery;
}) {
  const where: Prisma.ProductWhereInput = { published: true };
  if (opts.type) where.type = opts.type;
  if (opts.query?.shape) where.shapeKey = opts.query.shape;
  if (opts.query?.mood) where.moodTags = { has: opts.query.mood };
  if (opts.query?.q) {
    where.OR = [
      { title: { contains: opts.query.q, mode: "insensitive" } },
      { description: { contains: opts.query.q, mode: "insensitive" } },
      { subtitle: { contains: opts.query.q, mode: "insensitive" } },
    ];
  }
  if (opts.query?.min || opts.query?.max) {
    where.basePrice = {};
    if (opts.query.min) where.basePrice.gte = Number(opts.query.min);
    if (opts.query.max) where.basePrice.lte = Number(opts.query.max);
  }

  if (opts.collectionSlug) {
    const collection = await prisma.collection.findUnique({
      where: { slug: opts.collectionSlug },
    });
    if (!collection) return { collection: null, products: [] };
    where.collections = { some: { collectionId: collection.id } };
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
  switch (opts.query?.sort) {
    case "price-asc":
      orderBy = { basePrice: "asc" };
      break;
    case "price-desc":
      orderBy = { basePrice: "desc" };
      break;
    case "title":
      orderBy = { title: "asc" };
      break;
    case "featured":
      orderBy = { featured: "desc" };
      break;
    default:
      orderBy = { bestseller: "desc" };
  }

  const products = await prisma.product.findMany({
    where,
    include: { images: { orderBy: { sortOrder: "asc" } } },
    orderBy,
    take: 48,
  });

  return {
    products: products.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      subtitle: p.subtitle,
      basePrice: toNumber(p.basePrice),
      imageUrl: p.images[0]?.url || "/demo-assets/products/placeholder.svg",
      hoverImageUrl: p.images[1]?.url,
    })),
  };
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: {
        where: { active: true },
        include: { fabric: true, size: true, lining: true, fitting: true },
      },
      reviews: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      relatedFrom: {
        include: {
          to: { include: { images: { orderBy: { sortOrder: "asc" }, take: 2 } } },
        },
      },
    },
  });
}
