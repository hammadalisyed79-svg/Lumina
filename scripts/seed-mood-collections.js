/**
 * Create mood / marketing collections and attach products by tag heuristics.
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function upsertCollection(slug, title, description, isFeatured = false) {
  return prisma.collection.upsert({
    where: { slug },
    create: { slug, title, description, isFeatured, published: true, sortOrder: 100 },
    update: { title, description, isFeatured, published: true },
  });
}

async function attachByFilter(collectionId, where) {
  const products = await prisma.product.findMany({ where, select: { id: true } });
  let n = 0;
  for (const p of products) {
    await prisma.collectionProduct.upsert({
      where: {
        collectionId_productId: { collectionId, productId: p.id },
      },
      create: { collectionId, productId: p.id, sortOrder: n++ },
      update: {},
    });
  }
  return products.length;
}

async function main() {
  const bestsellers = await upsertCollection(
    "bestsellers",
    "Bestsellers",
    "Our most-loved handmade pieces.",
    true
  );
  const botanical = await upsertCollection(
    "botanical",
    "Botanical",
    "Leaf and floral motifs.",
    true
  );
  const linen = await upsertCollection(
    "linen-calm",
    "Linen calm",
    "Quiet neutrals for restful spaces.",
    true
  );
  const neu = await upsertCollection(
    "new",
    "New arrivals",
    "Recently added designs from the studio.",
    true
  );

  const c1 = await attachByFilter(bestsellers.id, { published: true, bestseller: true });
  const c2 = await attachByFilter(botanical.id, {
    published: true,
    OR: [
      { moodTags: { has: "botanical" } },
      { title: { contains: "floral", mode: "insensitive" } },
      { title: { contains: "leaf", mode: "insensitive" } },
      { title: { contains: "rose", mode: "insensitive" } },
      { sourceTitle: { contains: "botanical", mode: "insensitive" } },
      { sourceTitle: { contains: "moroccan", mode: "insensitive" } },
    ],
  });
  const c3 = await attachByFilter(linen.id, {
    published: true,
    OR: [
      { title: { contains: "linen", mode: "insensitive" } },
      { title: { contains: "ivory", mode: "insensitive" } },
      { title: { contains: "mink", mode: "insensitive" } },
      { title: { contains: "stone", mode: "insensitive" } },
      { sourceTitle: { contains: "linen", mode: "insensitive" } },
    ],
  });
  const c4 = await attachByFilter(neu.id, { published: true, featured: true });

  console.log({ bestsellers: c1, botanical: c2, linenCalm: c3, newArrivals: c4 });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
