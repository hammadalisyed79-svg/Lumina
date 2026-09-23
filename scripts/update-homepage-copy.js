const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
  const hero = await prisma.homepageSection.findFirst({ where: { type: "HERO" } });
  if (hero) {
    await prisma.homepageSection.update({
      where: { id: hero.id },
      data: {
        title: "Light that feels considered",
        subtitle:
          "Handmade lampshades, expressive fabrics and matching textiles — stretched and finished to order so every room glows with intention.",
        ctaLabel: "Explore lampshades",
        ctaHref: "/shop/lampshades",
        payload: {
          eyebrow: "British atelier · Lighting for living",
          secondaryCtaLabel: "Meet the studio",
          secondaryCtaHref: "/about",
        },
      },
    });
    console.log("hero updated");
  }
  const editorial = await prisma.homepageSection.findFirst({ where: { type: "EDITORIAL" } });
  if (editorial) {
    await prisma.homepageSection.update({
      where: { id: editorial.id },
      data: {
        title: "Treat light as a material",
        body: "Fabric, frame and lining work as a composition — so a shade doesn’t merely cover a bulb; it shapes how a room feels at dusk.",
        ctaLabel: "Inside the atelier",
        ctaHref: "/about",
      },
    });
    console.log("editorial updated");
  }
  const homes = await prisma.homepageSection.findFirst({ where: { type: "CUSTOMER_HOMES" } });
  if (homes) {
    await prisma.homepageSection.update({
      where: { id: homes.id },
      data: { title: "How they live in a room", subtitle: "In the home" },
    });
    console.log("homes updated");
  }
  await prisma.$disconnect();
})();
