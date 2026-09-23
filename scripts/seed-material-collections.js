/**
 * Create material collections (velvet, linen, printed, foil) and attach products by title/tags.
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const MATERIALS = [
  {
    slug: "velvet",
    title: "Velvet",
    description: "Plush velvet lampshades with rich colour and soft light.",
    match: /velvet/i,
  },
  {
    slug: "linen",
    title: "Linen",
    description: "Quiet linen and linen-blend shades for calm interiors.",
    match: /linen/i,
  },
  {
    slug: "printed",
    title: "Printed",
    description: "Printed and patterned fabrics for expressive rooms.",
    match: /print|printed|pattern/i,
  },
  {
    slug: "foil",
    title: "Foil",
    description: "Metallic foil accents for evening light.",
    match: /foil|foiled|metallic|gold leaf|silver/i,
  },
];

(async () => {
  const products = await prisma.product.findMany({
    where: { published: true },
    select: { id: true, title: true, material: true, patternTags: true },
  });

  for (const m of MATERIALS) {
    const col = await prisma.collection.upsert({
      where: { slug: m.slug },
      create: {
        slug: m.slug,
        title: m.title,
        description: m.description,
        published: true,
        sortOrder: 20,
      },
      update: {
        title: m.title,
        description: m.description,
        published: true,
      },
    });

    const matched = products.filter(
      (p) =>
        m.match.test(p.title) ||
        (p.material && m.match.test(p.material)) ||
        (p.patternTags || []).some((t) => m.match.test(t))
    );

    let linked = 0;
    for (const p of matched) {
      await prisma.collectionProduct.upsert({
        where: {
          collectionId_productId: { collectionId: col.id, productId: p.id },
        },
        create: { collectionId: col.id, productId: p.id },
        update: {},
      });
      linked++;
    }
    console.log(m.slug, "products", linked);
  }

  await prisma.$disconnect();
})();
