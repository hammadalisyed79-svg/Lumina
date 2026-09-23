import { PrismaClient, ProductType, CouponType, ShippingCalc, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function img(folder: string, name: string) {
  return `/demo-assets/${folder}/${name}.svg`;
}

async function main() {
  console.log("Seeding Lumina Hub…");

  await prisma.couponRedemption.deleteMany();
  await prisma.orderEvent.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.savedDesign.deleteMany();
  await prisma.collectionProduct.deleteMany();
  await prisma.productRelation.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.fabric.deleteMany();
  await prisma.size.deleteMany();
  await prisma.lining.deleteMany();
  await prisma.fitting.deleteMany();
  await prisma.shape.deleteMany();
  await prisma.shippingMethod.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.cmsPage.deleteMany();
  await prisma.siteSetting.deleteMany();
  await prisma.mediaAsset.deleteMany();
  await prisma.newsletterSubscriber.deleteMany();
  await prisma.tradeApplication.deleteMany();
  await prisma.bespokeEnquiry.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.stripeWebhookEvent.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.address.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();

  const adminEmail = (process.env.ADMIN_EMAIL || "admin@luminahub.co.uk").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "LuminaAdmin2026!";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.create({
    data: {
      email: adminEmail,
      name: "Lumina Admin",
      role: Role.ADMIN,
      passwordHash,
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: "customer@example.com",
      name: "Clara Whitmore",
      role: Role.CUSTOMER,
      passwordHash: await bcrypt.hash("Customer123!", 12),
    },
  });

  await prisma.address.create({
    data: {
      userId: customer.id,
      label: "Home",
      fullName: "Clara Whitmore",
      line1: "14 Chapel Street",
      city: "Bath",
      county: "Somerset",
      postcode: "BA1 1BZ",
      country: "GB",
      isDefault: true,
    },
  });

  const shapes = await Promise.all(
    [
      { key: "drum", name: "Drum", basePrice: 68, description: "Clean cylindrical silhouette for modern rooms." },
      { key: "empire", name: "Empire", basePrice: 72, description: "Classic tapered form with a soft presence." },
      { key: "oval", name: "Oval", basePrice: 78, description: "Gentle curves that soften console lighting." },
      { key: "rectangular", name: "Rectangular", basePrice: 82, description: "Architectural lines for sideboards and desks." },
      { key: "coolie", name: "Coolie", basePrice: 74, description: "Wide brim shade that pools light generously." },
      { key: "square", name: "Square", basePrice: 76, description: "Structured square profile for contemporary settings." },
    ].map((s, i) =>
      prisma.shape.create({
        data: {
          ...s,
          imageUrl: img("shapes", s.key),
          sortOrder: i,
        },
      }),
    ),
  );

  const fabrics = await Promise.all(
    [
      { slug: "ivory-linen", name: "Ivory Linen", colour: "Ivory", material: "Linen", priceMod: 0 },
      { slug: "stone-herringbone", name: "Stone Herringbone", colour: "Stone", material: "Wool blend", priceMod: 8 },
      { slug: "sage-velvet", name: "Sage Velvet", colour: "Sage", material: "Cotton velvet", priceMod: 14 },
      { slug: "champagne-silk", name: "Champagne Silk", colour: "Champagne", material: "Silk blend", priceMod: 22 },
      { slug: "charcoal-tweed", name: "Charcoal Tweed", colour: "Charcoal", material: "Wool tweed", priceMod: 12 },
      { slug: "botanical-print", name: "Botanical Print", colour: "Multi", material: "Cotton", priceMod: 10 },
      { slug: "blush-damask", name: "Blush Damask", colour: "Blush", material: "Cotton damask", priceMod: 16 },
      { slug: "navy-moire", name: "Navy Moiré", colour: "Navy", material: "Moiré silk", priceMod: 18 },
    ].map((f, i) =>
      prisma.fabric.create({
        data: {
          ...f,
          description: `${f.name} — selected for lampshade work and lasting colour.`,
          imageUrl: img("fabrics", f.slug),
          swatchUrl: img("fabrics", f.slug),
          sortOrder: i,
        },
      }),
    ),
  );

  const sizes = await Promise.all(
    [
      { slug: "20cm", name: "20 cm", diameterCm: 20, heightCm: 18, priceMod: 0 },
      { slug: "30cm", name: "30 cm", diameterCm: 30, heightCm: 22, priceMod: 12 },
      { slug: "40cm", name: "40 cm", diameterCm: 40, heightCm: 26, priceMod: 24 },
      { slug: "45cm", name: "45 cm", diameterCm: 45, heightCm: 28, priceMod: 32 },
    ].map((s, i) => prisma.size.create({ data: { ...s, sortOrder: i } })),
  );

  const linings = await Promise.all(
    [
      { slug: "white", name: "White lining", colour: "White", priceMod: 0 },
      { slug: "ivory", name: "Ivory lining", colour: "Ivory", priceMod: 4 },
      { slug: "gold", name: "Gold reflective", colour: "Gold", priceMod: 14 },
      { slug: "silver", name: "Silver reflective", colour: "Silver", priceMod: 14 },
    ].map((l, i) => prisma.lining.create({ data: { ...l, sortOrder: i } })),
  );

  const fittings = await Promise.all(
    [
      { slug: "e27-uno", name: "E27 UNO", description: "Standard UK pendant / table fitting", priceMod: 0 },
      { slug: "candle-clip", name: "Candle clip", description: "Clips onto candle bulbs", priceMod: 3 },
      { slug: "spider", name: "Spider / harp", description: "Fits harp and finial lamp bases", priceMod: 5 },
    ].map((f, i) => prisma.fitting.create({ data: { ...f, sortOrder: i } })),
  );

  await prisma.shippingMethod.createMany({
    data: [
      {
        name: "UK Mainland Standard",
        description: "Rate confirmed at Shopify checkout once shipping rules are live",
        calcType: ShippingCalc.FLAT,
        price: 0,
        freeAbove: null,
        estimatedDays: "TBC",
        sortOrder: 0,
        active: false,
      },
      {
        name: "Shipping calculated at checkout",
        description: "Provisional placeholder — not a free-shipping offer",
        calcType: ShippingCalc.FLAT,
        price: 0,
        freeAbove: null,
        estimatedDays: "TBC",
        sortOrder: 1,
        active: true,
      },
    ],
  });

  await prisma.coupon.createMany({
    data: [
      { code: "WELCOME10", type: CouponType.PERCENT, value: 10, minSubtotal: 50, maxUses: 1000 },
      { code: "SHADE15", type: CouponType.FIXED, value: 15, minSubtotal: 80, maxUses: 500 },
    ],
  });

  const collections = await Promise.all(
    [
      { slug: "lampshades", title: "Lampshades", description: "Handmade shades in classic British forms.", isFeatured: true },
      { slug: "fabrics", title: "Fabrics", description: "Printed and woven textiles for interiors." },
      { slug: "cushions", title: "Cushion covers", description: "Coordinating cushions for layered rooms." },
      { slug: "kits", title: "Shade-making kits", description: "Everything to craft your own shade at home." },
      { slug: "bestsellers", title: "Bestsellers", description: "Our most-loved pieces.", isFeatured: true },
      { slug: "new", title: "New arrivals", description: "Fresh fabrics and forms.", isFeatured: true },
      { slug: "linen-calm", title: "Linen calm", description: "Quiet neutrals for restful spaces." },
      { slug: "botanical", title: "Botanical", description: "Leaf and floral motifs." },
    ].map((c, i) =>
      prisma.collection.create({
        data: {
          ...c,
          imageUrl: img("lifestyle", c.slug === "botanical" ? "botanical" : "atelier"),
          sortOrder: i,
          seoTitle: `${c.title} | Lumina Hub`,
          seoDesc: c.description,
        },
      }),
    ),
  );

  const lampshadeDefs = [
    { slug: "ivory-drum-shade", title: "Ivory Drum Shade", shape: "drum", fabric: "ivory-linen", mood: ["calm", "neutral"], featured: true, bestseller: true, base: 78 },
    { slug: "stone-empire-shade", title: "Stone Empire Shade", shape: "empire", fabric: "stone-herringbone", mood: ["calm", "heritage"], featured: true, bestseller: true, base: 86 },
    { slug: "sage-oval-shade", title: "Sage Oval Shade", shape: "oval", fabric: "sage-velvet", mood: ["botanical", "rich"], featured: true, bestseller: false, base: 94 },
    { slug: "champagne-coolie", title: "Champagne Coolie", shape: "coolie", fabric: "champagne-silk", mood: ["evening", "glow"], featured: true, bestseller: true, base: 108 },
    { slug: "charcoal-rectangular", title: "Charcoal Rectangular", shape: "rectangular", fabric: "charcoal-tweed", mood: ["modern", "study"], featured: false, bestseller: true, base: 98 },
    { slug: "botanical-drum", title: "Botanical Drum", shape: "drum", fabric: "botanical-print", mood: ["botanical"], featured: true, bestseller: false, base: 92 },
    { slug: "blush-empire", title: "Blush Empire Shade", shape: "empire", fabric: "blush-damask", mood: ["romantic"], featured: false, bestseller: false, base: 96 },
    { slug: "navy-square-shade", title: "Navy Square Shade", shape: "square", fabric: "navy-moire", mood: ["evening", "formal"], featured: false, bestseller: false, base: 102 },
    { slug: "linen-tall-drum", title: "Tall Linen Drum", shape: "drum", fabric: "ivory-linen", mood: ["calm"], featured: false, bestseller: true, base: 88 },
    { slug: "herringbone-coolie", title: "Herringbone Coolie", shape: "coolie", fabric: "stone-herringbone", mood: ["heritage"], featured: false, bestseller: false, base: 90 },
    { slug: "velvet-empire-deep", title: "Deep Sage Empire", shape: "empire", fabric: "sage-velvet", mood: ["rich"], featured: true, bestseller: false, base: 110 },
    { slug: "moire-oval-evening", title: "Evening Moiré Oval", shape: "oval", fabric: "navy-moire", mood: ["evening"], featured: false, bestseller: true, base: 118 },
  ];

  const products = [];
  for (const def of lampshadeDefs) {
    const fabric = fabrics.find((f) => f.slug === def.fabric)!;
    const shape = shapes.find((s) => s.key === def.shape)!;
    const size = sizes[1];
    const lining = linings[0];
    const fitting = fittings[0];
    const product = await prisma.product.create({
      data: {
        slug: def.slug,
        title: def.title,
        subtitle: `${shape.name} · ${fabric.name}`,
        description: `${def.title} is handmade to order in our UK atelier. Crafted on a ${shape.name.toLowerCase()} frame in ${fabric.name}, finished with a tailored lining and your choice of fitting. Each shade is stretched, trimmed and inspected by hand before dispatch.`,
        shortDesc: `Handmade ${shape.name.toLowerCase()} shade in ${fabric.name}.`,
        type: ProductType.LAMPSHADE,
        shapeKey: def.shape,
        moodTags: def.mood,
        basePrice: def.base,
        featured: def.featured,
        bestseller: def.bestseller,
        leadTimeDays: 10,
        seoTitle: `${def.title} | Handmade Lampshade | Lumina Hub`,
        seoDesc: `Buy the ${def.title} — UK handmade lampshade in ${fabric.name}.`,
        images: {
          create: [
            { url: img("products", def.slug), alt: def.title, sortOrder: 0, isPrimary: true },
            { url: img("lifestyle", "atelier"), alt: `${def.title} in a living room`, sortOrder: 1 },
          ],
        },
        variants: {
          create: [
            {
              sku: `${def.slug.toUpperCase().replace(/-/g, "")}-30-E27`,
              title: `${size.name} / ${fitting.name}`,
              fabricId: fabric.id,
              sizeId: size.id,
              liningId: lining.id,
              fittingId: fitting.id,
            },
          ],
        },
      },
      include: { variants: true },
    });
    products.push(product);

    const lampCol = collections.find((c) => c.slug === "lampshades")!;
    await prisma.collectionProduct.create({
      data: { collectionId: lampCol.id, productId: product.id, sortOrder: products.length },
    });
    if (def.bestseller) {
      const bs = collections.find((c) => c.slug === "bestsellers")!;
      await prisma.collectionProduct.create({
        data: { collectionId: bs.id, productId: product.id },
      });
    }
    if (def.featured) {
      const neu = collections.find((c) => c.slug === "new")!;
      await prisma.collectionProduct.create({
        data: { collectionId: neu.id, productId: product.id },
      });
    }
    if (def.mood.includes("calm") || def.fabric.includes("linen") || def.fabric.includes("stone")) {
      const calm = collections.find((c) => c.slug === "linen-calm")!;
      await prisma.collectionProduct.create({
        data: { collectionId: calm.id, productId: product.id },
      });
    }
    if (def.mood.includes("botanical")) {
      const bot = collections.find((c) => c.slug === "botanical")!;
      await prisma.collectionProduct.create({
        data: { collectionId: bot.id, productId: product.id },
      });
    }
  }

  const fabricProducts = [];
  for (const f of fabrics.slice(0, 4)) {
    const p = await prisma.product.create({
      data: {
        slug: `fabric-${f.slug}`,
        title: `${f.name} Fabric`,
        subtitle: "Sold by the metre",
        description: `${f.name} fabric suitable for soft furnishings and lampshade projects. Minimum order one metre.`,
        shortDesc: `${f.name} — interior textile by the metre.`,
        type: ProductType.FABRIC,
        basePrice: 42 + Number(f.priceMod),
        configEnabled: false,
        images: {
          create: [{ url: f.imageUrl!, alt: f.name, isPrimary: true }],
        },
        variants: {
          create: [{ sku: `FAB-${f.slug.toUpperCase()}`, title: "Per metre", fabricId: f.id }],
        },
      },
    });
    fabricProducts.push(p);
    await prisma.collectionProduct.create({
      data: {
        collectionId: collections.find((c) => c.slug === "fabrics")!.id,
        productId: p.id,
      },
    });
  }

  const cushionDefs = [
    { slug: "ivory-linen-cushion", title: "Ivory Linen Cushion Cover", fabric: "ivory-linen", price: 38 },
    { slug: "botanical-cushion", title: "Botanical Cushion Cover", fabric: "botanical-print", price: 42 },
    { slug: "sage-velvet-cushion", title: "Sage Velvet Cushion Cover", fabric: "sage-velvet", price: 48 },
    { slug: "blush-damask-cushion", title: "Blush Damask Cushion Cover", fabric: "blush-damask", price: 46 },
  ];
  for (const c of cushionDefs) {
    const fabric = fabrics.find((f) => f.slug === c.fabric)!;
    const p = await prisma.product.create({
      data: {
        slug: c.slug,
        title: c.title,
        subtitle: "45 × 45 cm",
        description: `${c.title} with invisible zip, tailored to pair with our lampshade collections.`,
        shortDesc: c.title,
        type: ProductType.CUSHION,
        basePrice: c.price,
        configEnabled: false,
        bestseller: c.slug.includes("botanical"),
        images: {
          create: [{ url: img("products", c.slug), alt: c.title, isPrimary: true }],
        },
        variants: {
          create: [{ sku: `CUSH-${c.slug.toUpperCase().slice(0, 12)}`, title: "45cm", fabricId: fabric.id }],
        },
      },
    });
    await prisma.collectionProduct.create({
      data: {
        collectionId: collections.find((x) => x.slug === "cushions")!.id,
        productId: p.id,
      },
    });
  }

  const kitDefs = [
    { slug: "drum-kit-30", title: "Drum Shade Kit 30 cm", price: 54 },
    { slug: "empire-kit-30", title: "Empire Shade Kit 30 cm", price: 58 },
    { slug: "starter-tool-kit", title: "Shade-Making Starter Tools", price: 36 },
  ];
  for (const k of kitDefs) {
    const p = await prisma.product.create({
      data: {
        slug: k.slug,
        title: k.title,
        description: `${k.title} includes frames, adhesive panel and step-by-step guidance for home makers.`,
        shortDesc: k.title,
        type: ProductType.KIT,
        basePrice: k.price,
        configEnabled: false,
        images: {
          create: [{ url: img("products", k.slug), alt: k.title, isPrimary: true }],
        },
        variants: {
          create: [{ sku: `KIT-${k.slug.toUpperCase().replace(/-/g, "").slice(0, 12)}`, title: "Standard" }],
        },
      },
    });
    await prisma.collectionProduct.create({
      data: {
        collectionId: collections.find((x) => x.slug === "kits")!.id,
        productId: p.id,
      },
    });
  }

  // Related products
  for (let i = 0; i < 6; i++) {
    await prisma.productRelation.create({
      data: { fromId: products[i].id, toId: products[(i + 1) % products.length].id },
    });
  }

  await prisma.review.createMany({
    data: [
      {
        productId: products[0].id,
        userId: customer.id,
        author: "Clara W.",
        email: customer.email,
        rating: 5,
        title: "Beautifully made",
        body: "The ivory drum arrived carefully packed and looks exquisite on our bedside lamps. Soft light, perfect proportions.",
        status: "APPROVED",
      },
      {
        productId: products[1].id,
        author: "James P.",
        email: "james@example.com",
        rating: 5,
        title: "Heritage quality",
        body: "Stone herringbone empire shade — exactly the quiet luxury we wanted for the sitting room.",
        status: "APPROVED",
      },
      {
        productId: products[3].id,
        author: "Amelia R.",
        rating: 4,
        title: "Warm evening glow",
        body: "Champagne coolie gives a lovely pooled light over the dining table. Lead time was as quoted.",
        status: "APPROVED",
      },
      {
        productId: products[0].id,
        author: "Pending Reviewer",
        rating: 5,
        title: "Awaiting moderation",
        body: "This review should stay hidden until approved by admin.",
        status: "PENDING",
      },
    ],
  });

  await prisma.cmsPage.createMany({
    data: [
      {
        slug: "about",
        title: "Our atelier",
        content: {
          blocks: [
            {
              type: "richtext",
              html: "<p>Lumina Hub is a British lampshade and interior textile studio. Every shade is cut, stretched and finished by hand.</p>",
            },
          ],
        },
        seoTitle: "About Lumina Hub",
        seoDesc: "Handmade lampshades and textiles from a UK atelier.",
      },
      {
        slug: "home-editorial",
        title: "Home editorial",
        content: {
          headline: "Light as an interior material",
          body: "We treat fabric, frame and lining as a composition — so each shade feels considered in the room, not merely functional.",
        },
      },
    ],
  });

  await prisma.siteSetting.createMany({
    data: [
      {
        key: "announcement",
        value: { text: "Handmade to order in Britain · Delivery options confirmed at checkout" },
      },
      {
        key: "seo_default",
        value: {
          title: "Lumina Hub | Handmade Lampshades & Interior Textiles",
          description:
            "Premium UK handmade lampshades, fabrics, cushions and kits. Design your shade or shop ready-made collections.",
        },
      },
    ],
  });

  console.log("Seed complete.");
  console.log(`Admin: ${adminEmail} / ${adminPassword}`);
  console.log("Customer: customer@example.com / Customer123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
