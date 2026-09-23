require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function web(images) {
  return images.find(
    (i) => i.url && !i.url.toLowerCase().includes(".heic") && !i.url.includes("demo-assets")
  )?.url;
}

async function main() {
  const keys = ["drum", "empire", "oval", "rectangular", "coolie", "square"];
  for (const key of keys) {
    const p = await prisma.product.findFirst({
      where: { published: true, shapeKey: key, type: "LAMPSHADE" },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 6 } },
      orderBy: { featured: "desc" },
    });
    const url = p ? web(p.images) : null;
    if (!url) continue;
    await prisma.shape.updateMany({ where: { key }, data: { imageUrl: url } });
    console.log(key, url);
  }

  for (const slug of ["linen-calm", "botanical", "bestsellers"]) {
    const col = await prisma.collection.findUnique({
      where: { slug },
      include: {
        products: {
          take: 8,
          include: {
            product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 4 } } },
          },
        },
      },
    });
    let url = null;
    for (const row of col?.products || []) {
      url = web(row.product.images);
      if (url) break;
    }
    if (url) {
      await prisma.collection.update({ where: { slug }, data: { imageUrl: url } });
      console.log("mood", slug, url);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
