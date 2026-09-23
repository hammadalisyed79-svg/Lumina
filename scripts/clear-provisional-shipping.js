require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.shippingMethod.updateMany({
    data: {
      calcType: "FLAT",
      price: 0,
      freeAbove: null,
      description: "Calculated at Shopify checkout — not a free-shipping offer",
      name: "Shipping at checkout",
      active: true,
    },
  });
  const ann = await prisma.siteSetting.upsert({
    where: { key: "announcement" },
    create: {
      key: "announcement",
      value: {
        text: "Handmade to order in Britain · Online checkout unavailable until Shopify is connected",
      },
    },
    update: {
      value: {
        text: "Handmade to order in Britain · Online checkout unavailable until Shopify is connected",
      },
    },
  });
  const methods = await prisma.shippingMethod.findMany({
    orderBy: { sortOrder: "asc" },
  });
  if (methods.length > 1) {
    await prisma.shippingMethod.updateMany({
      where: { id: { not: methods[0].id } },
      data: { active: false },
    });
  }
  console.log(
    JSON.stringify(
      {
        shippingUpdated: updated.count,
        announcement: ann.value,
        methods: await prisma.shippingMethod.findMany(),
      },
      null,
      2
    )
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
