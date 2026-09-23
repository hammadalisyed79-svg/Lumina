require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function webImage(images) {
  return (
    images.find(
      (i) =>
        i.url &&
        !i.url.toLowerCase().includes(".heic") &&
        !i.url.includes("placeholder")
    )?.url || null
  );
}

async function main() {
  const keys = ["drum", "empire", "oval", "rectangular", "coolie", "square"];
  const out = {};
  for (const key of keys) {
    const p = await prisma.product.findFirst({
      where: {
        published: true,
        shapeKey: key,
        type: "LAMPSHADE",
        images: { some: {} },
      },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 5 } },
      orderBy: { featured: "desc" },
    });
    out[key] = p
      ? { slug: p.slug, title: p.title.slice(0, 60), img: webImage(p.images) }
      : null;
  }
  console.log(JSON.stringify(out, null, 2));

  for (const slug of ["linen-calm", "botanical", "bestsellers"]) {
    const col = await prisma.collection.findUnique({
      where: { slug },
      include: {
        products: {
          take: 3,
          include: {
            product: {
              include: { images: { orderBy: { sortOrder: "asc" }, take: 3 } },
            },
          },
        },
      },
    });
    console.log(
      slug,
      col?.products.map((cp) => ({
        title: cp.product.title.slice(0, 40),
        img: webImage(cp.product.images),
        type: cp.product.type,
      }))
    );
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
