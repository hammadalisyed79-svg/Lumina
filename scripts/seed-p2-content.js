const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedHomepage() {
  const existing = await prisma.homepageSection.count();
  if (existing === 0) {
    await prisma.homepageSection.createMany({
      data: [
        {
          type: "HERO",
          title: "Welcome to Lumina Hub",
          subtitle: "Where light meets craftsmanship — handmade lampshades, cushions and printed fabrics from our UK studio.",
          imageUrl: "/media/homepage/hero-lifestyle.png",
          ctaLabel: "Shop now",
          ctaHref: "/shop/lampshades",
          sortOrder: 0,
          enabled: true,
          payload: { eyebrow: "Lighting · Home decor", secondaryCtaLabel: "Our story", secondaryCtaHref: "/about" },
        },
        {
          type: "EDITORIAL",
          title: "Light as an interior material",
          body: "We treat fabric, frame and lining as a composition — so each shade feels considered in the room, not merely functional.",
          ctaLabel: "Our atelier",
          ctaHref: "/about",
          sortOrder: 10,
          enabled: true,
        },
        {
          type: "CUSTOMER_HOMES",
          title: "Customer homes",
          subtitle: "In situ",
          imageUrl: "/media/homepage/story-craft.png",
          sortOrder: 20,
          enabled: true,
          payload: {
            images: [
              "/media/homepage/hero-lifestyle.png",
              "/media/homepage/story-craft.png",
              "/media/homepage/shape-2.png",
            ],
          },
        },
      ],
    });
    console.log("homepage sections created");
  } else {
    console.log("homepage sections exist", existing);
  }
}

async function seedReviews() {
  const approved = await prisma.review.count({ where: { status: "APPROVED" } });
  if (approved >= 3) {
    console.log("reviews already", approved);
    return;
  }
  const products = await prisma.product.findMany({
    where: { published: true, type: "LAMPSHADE" },
    take: 6,
    orderBy: { updatedAt: "desc" },
  });
  if (!products.length) return;

  const samples = [
    {
      author: "Amelia R.",
      rating: 5,
      title: "Beautiful quality",
      body: "The velvet drum arrived carefully packed and looks exactly as pictured. Soft light in our living room.",
    },
    {
      author: "James K.",
      rating: 5,
      title: "Made to measure felt considered",
      body: "Chose empire for a floor lamp — proportions are spot on. Will order cushions to match.",
    },
    {
      author: "Priya S.",
      rating: 4,
      title: "Studio were helpful",
      body: "Asked about fittings on WhatsApp and got a clear reply the same day. Shade is gorgeous.",
    },
  ];

  for (let i = 0; i < samples.length; i++) {
    const p = products[i % products.length];
    await prisma.review.create({
      data: {
        productId: p.id,
        ...samples[i],
        status: "APPROVED",
      },
    });
  }
  console.log("seeded reviews", samples.length);
}

async function seedNav() {
  const menu = await prisma.navigationMenu.upsert({
    where: { key: "primary" },
    create: { key: "primary", label: "Primary" },
    update: { label: "Primary" },
  });
  const count = await prisma.navigationItem.count({ where: { menuId: menu.id } });
  if (count === 0) {
    const items = [
      { label: "Lampshades", url: "/shop/lampshades", sortOrder: 0 },
      { label: "Fabrics", url: "/shop/fabrics", sortOrder: 1 },
      { label: "Cushions", url: "/shop/cushions", sortOrder: 2 },
      { label: "Kits", url: "/shop/kits", sortOrder: 3 },
      { label: "Design your shade", url: "/design-your-shade", sortOrder: 4 },
      { label: "Trade", url: "/trade", sortOrder: 5 },
    ];
    await prisma.navigationItem.createMany({
      data: items.map((i) => ({ ...i, menuId: menu.id, enabled: true })),
    });
    console.log("nav items created");
  } else {
    console.log("nav items exist", count);
  }
}

async function seedSettings() {
  await prisma.siteSetting.upsert({
    where: { key: "brand" },
    create: {
      key: "brand",
      value: {
        name: "Lumina Hub",
        email: "Sales@luminahub.co.uk",
        phone: "+44 7889 451166",
        whatsapp: "https://wa.me/447889451166",
      },
    },
    update: {},
  });
  console.log("site settings ok");
}

(async () => {
  await seedHomepage();
  await seedReviews();
  await seedNav();
  await seedSettings();
  await prisma.$disconnect();
})();
