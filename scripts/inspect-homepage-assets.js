require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const prisma = new PrismaClient();

async function main() {
  const shapes = await prisma.shape.findMany({ orderBy: { sortOrder: "asc" } });
  console.log(
    "SHAPES",
    JSON.stringify(
      shapes.map((s) => ({ key: s.key, name: s.name, imageUrl: s.imageUrl })),
      null,
      2
    )
  );
  const moods = await prisma.collection.findMany({
    where: { slug: { in: ["linen-calm", "botanical", "bestsellers"] } },
  });
  console.log(
    "MOODS",
    JSON.stringify(
      moods.map((m) => ({ slug: m.slug, title: m.title, imageUrl: m.imageUrl })),
      null,
      2
    )
  );
  for (const type of ["LAMPSHADE", "FABRIC", "CUSHION", "KIT"]) {
    const rows = await prisma.product.findMany({
      where: { published: true, type },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      take: 4,
      orderBy: [{ featured: "desc" }, { bestseller: "desc" }],
    });
    console.log(
      type,
      rows.map((r) => ({
        slug: r.slug.slice(0, 50),
        title: r.title.slice(0, 50),
        img: r.images[0]?.url,
      }))
    );
  }
  const mediaRoot = path.join(__dirname, "..", "public", "media", "products");
  if (fs.existsSync(mediaRoot)) {
    const dirs = fs.readdirSync(mediaRoot).slice(0, 5);
    console.log("media sample dirs", dirs);
    for (const d of dirs) {
      const files = fs.readdirSync(path.join(mediaRoot, d)).slice(0, 3);
      console.log(d.slice(0, 40), files);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
