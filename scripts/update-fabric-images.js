require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function web(images) {
  return (
    images.find(
      (i) =>
        i.url &&
        !i.url.toLowerCase().includes(".heic") &&
        !i.url.includes("demo-assets")
    )?.url || null
  );
}

async function main() {
  const fabrics = await prisma.fabric.findMany({ orderBy: { sortOrder: "asc" } });
  const fabricProducts = await prisma.product.findMany({
    where: {
      published: true,
      type: "FABRIC",
      images: { some: { NOT: { url: { contains: ".heic" } } } },
    },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 4 } },
    orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
    take: 40,
  });

  const pool = fabricProducts.map((p) => web(p.images)).filter(Boolean);
  let i = 0;
  for (const f of fabrics) {
    const url = pool[i % pool.length];
    i++;
    if (!url) continue;
    await prisma.fabric.update({ where: { id: f.id }, data: { imageUrl: url } });
    console.log(f.name, "→", url.slice(0, 70));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
