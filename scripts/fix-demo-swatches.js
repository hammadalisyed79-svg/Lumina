/**
 * Clear demo-asset fabric swatches and prefer real /media product photos.
 * Also rename the cushions collection to "Cushion covers".
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const fabrics = await prisma.fabric.findMany();
  let fixed = 0;
  for (const f of fabrics) {
    const swatchIsDemo =
      !f.swatchUrl ||
      f.swatchUrl.includes("/demo-assets/") ||
      f.swatchUrl.includes("placeholder");
    const imageOk =
      f.imageUrl &&
      f.imageUrl.startsWith("/media/") &&
      !f.imageUrl.includes("placeholder");

    if (swatchIsDemo && imageOk) {
      await prisma.fabric.update({
        where: { id: f.id },
        data: { swatchUrl: f.imageUrl },
      });
      fixed++;
      console.log("fabric", f.slug, "swatch ->", f.imageUrl.split("/").pop());
    } else if (swatchIsDemo) {
      await prisma.fabric.update({
        where: { id: f.id },
        data: { swatchUrl: null },
      });
      fixed++;
      console.log("fabric", f.slug, "cleared demo swatch");
    }
  }

  const col = await prisma.collection.updateMany({
    where: { slug: "cushions" },
    data: { title: "Cushion covers" },
  });
  console.log("collection cushions retitled:", col.count);
  console.log("fabrics updated:", fixed);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
