import { Prisma, ProductType, type PrismaClient } from "@prisma/client";
import type { SourceProduct } from "./migration-types";
import { parseDimensionCm } from "./normalizer";

function toType(c: SourceProduct["category"]): ProductType {
  if (c === "FABRIC") return ProductType.FABRIC;
  if (c === "CUSHION") return ProductType.CUSHION;
  if (c === "KIT") return ProductType.KIT;
  if (c === "ACCESSORY") return ProductType.ACCESSORY;
  return ProductType.LAMPSHADE;
}

function money(s: string | null | undefined): Prisma.Decimal | null {
  if (s == null || s === "") return null;
  return new Prisma.Decimal(s);
}

function slug(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 80) || "option"
  );
}

async function ensureOptionCatalogs(prisma: PrismaClient, products: SourceProduct[]) {
  const liningNames = new Map<string, string>();
  const fittingNames = new Map<string, string>();
  const sizeLabels = new Map<string, string>();

  for (const p of products) {
    for (const opt of p.options) {
      const n = opt.name.toLowerCase();
      if (n.includes("lining")) for (const v of opt.values) liningNames.set(slug(v), v);
      if (n.includes("fitting") || n.includes("reducer"))
        for (const v of opt.values) fittingNames.set(slug(v), v);
      if (n.includes("dimension") || n.includes("size"))
        for (const v of opt.values) sizeLabels.set(slug(v), v);
    }
  }

  await prisma.$transaction([
    ...[...liningNames].map(([s, name]) =>
      prisma.lining.upsert({
        where: { slug: s },
        create: { slug: s, name, active: true },
        update: { name, active: true },
      })
    ),
    ...[...fittingNames].map(([s, name]) =>
      prisma.fitting.upsert({
        where: { slug: s },
        create: { slug: s, name, active: true },
        update: { name, active: true },
      })
    ),
  ]);

  for (const [s, name] of sizeLabels) {
    const dims = parseDimensionCm(name);
    await prisma.size.upsert({
      where: { slug: s },
      create: {
        slug: s,
        name,
        diameterCm: dims.diameterCm != null ? new Prisma.Decimal(dims.diameterCm) : null,
        widthCm: dims.widthCm != null ? new Prisma.Decimal(dims.widthCm) : null,
        heightCm: dims.heightCm != null ? new Prisma.Decimal(dims.heightCm) : null,
        depthCm: dims.depthCm != null ? new Prisma.Decimal(dims.depthCm) : null,
        active: true,
      },
      update: {
        name,
        active: true,
      },
    });
  }

  const shapes = [
    ["drum", "Drum"],
    ["empire", "Empire"],
    ["oval", "Oval"],
    ["square", "Square"],
    ["coolie", "Coolie"],
    ["rectangular", "Rectangular"],
    ["tiered", "Tiered Pendant"],
  ] as const;
  for (const [key, name] of shapes) {
    await prisma.shape.upsert({
      where: { key },
      create: { key, name, basePrice: new Prisma.Decimal(24.99), active: true },
      update: { name, active: true },
    });
  }
}

export async function importProductsToDatabase(
  prisma: PrismaClient,
  products: SourceProduct[],
  collectionMeta: { handle: string; title: string }[]
) {
  console.log("  ensuring option catalogs…");
  await ensureOptionCatalogs(prisma, products);

  const collectionIds = new Map<string, string>();
  let sort = 0;
  for (const c of collectionMeta) {
    const row = await prisma.collection.upsert({
      where: { slug: c.handle },
      create: {
        slug: c.handle,
        title: c.title,
        description: `${c.title} from the Lumina Hub handmade collection.`,
        sortOrder: sort++,
        published: true,
        isFeatured: [
          "drum-lampshades",
          "fabrics",
          "cushion-covers",
          "rectangular-lampshades",
        ].includes(c.handle),
      },
      update: { title: c.title, published: true },
    });
    collectionIds.set(c.handle, row.id);
  }

  for (const c of [
    { slug: "lampshades", title: "Lampshades" },
    { slug: "fabrics", title: "Fabrics" },
    { slug: "cushions", title: "Cushions" },
    { slug: "kits", title: "Lampshade Kits" },
    { slug: "bestsellers", title: "Bestsellers" },
    { slug: "new", title: "New arrivals" },
  ]) {
    if (collectionIds.has(c.slug)) continue;
    const row = await prisma.collection.upsert({
      where: { slug: c.slug },
      create: {
        slug: c.slug,
        title: c.title,
        sortOrder: sort++,
        published: true,
        isFeatured: true,
      },
      update: { title: c.title, published: true },
    });
    collectionIds.set(c.slug, row.id);
  }

  const linings = await prisma.lining.findMany();
  const fittings = await prisma.fitting.findMany();
  const sizes = await prisma.size.findMany();
  const liningBySlug = Object.fromEntries(linings.map((l) => [l.slug, l.id]));
  const fittingBySlug = Object.fromEntries(fittings.map((f) => [f.slug, f.id]));
  const sizeBySlug = Object.fromEntries(sizes.map((s) => [s.slug, s.id]));

  // Prefetch existing products — key ONLY by exact handle fields (never collide via unrelated slug aliases)
  const existingProducts = await prisma.product.findMany({
    select: { id: true, slug: true, sourceHandle: true, shopifyHandle: true },
  });
  const byHandle = new Map<string, string>();
  for (const e of existingProducts) {
    // Prefer sourceHandle, then shopifyHandle, then slug — each key maps to its own product only when equal
    if (e.sourceHandle) byHandle.set(e.sourceHandle, e.id);
    if (e.shopifyHandle && e.shopifyHandle === e.slug) byHandle.set(e.shopifyHandle, e.id);
    byHandle.set(e.slug, e.id);
  }

  const existingVariants = await prisma.productVariant.findMany({
    select: { id: true, shopifyVariantId: true, sku: true, productId: true },
  });
  const variantByShopify = new Map(
    existingVariants.filter((v) => v.shopifyVariantId).map((v) => [v.shopifyVariantId!, v])
  );

  let upsertedProducts = 0;
  let upsertedVariants = 0;
  let upsertedImages = 0;
  let i = 0;

  for (const p of products) {
    i++;
    const productType = toType(p.category);
    const data = {
      title: p.displayName,
      subtitle:
        productType === "LAMPSHADE"
          ? "Handmade lampshade"
          : productType === "FABRIC"
            ? "Printed fabric"
            : productType === "CUSHION"
              ? "Cushion cover"
              : productType === "KIT"
                ? "Lampshade kit"
                : null,
      description: p.description || p.sourceDescription || p.displayName,
      shortDesc: p.shortDescription,
      type: productType,
      shapeKey: p.shapeKey,
      moodTags: p.moodTags,
      colourTags: p.colourTags,
      patternTags: p.patternTags,
      material: p.material,
      basePrice: money(p.basePrice)!,
      compareAtPrice: money(p.compareAtPrice),
      published: true,
      featured: upsertedProducts < 12,
      bestseller: upsertedProducts < 8,
      handmade: true,
      leadTimeDays: p.leadTimeDays ?? 7,
      seoTitle: p.originalTitle.slice(0, 70),
      seoDesc: p.shortDescription.slice(0, 160),
      seoKeywords: [...new Set([...p.tags, ...p.colourTags, ...p.patternTags])].slice(0, 30),
      configEnabled: productType === "LAMPSHADE",
      shopifyProductId: p.shopifyId,
      shopifyHandle: p.sourceHandle,
      sourceWebsite: p.sourceWebsite,
      sourceUrl: p.sourceProductUrl,
      sourceHandle: p.sourceHandle,
      sourceTitle: p.originalTitle,
      sourceOriginalDescription: p.sourceDescription,
      sourceAvailability: p.sourceAvailability,
      availabilityReviewed: false,
      sourceImportedAt: new Date(),
      migrationStatus: p.needsReview ? "NEEDS_REVIEW" : "IMPORTED",
    };

    let productId = byHandle.get(p.sourceHandle);
    // Safety: never update a product whose slug is a different handle
    if (productId) {
      const current = existingProducts.find((e) => e.id === productId);
      if (current && current.slug !== p.sourceHandle && current.sourceHandle !== p.sourceHandle) {
        productId = undefined;
      }
    }
    if (productId) {
      await prisma.product.update({ where: { id: productId }, data });
    } else {
      const created = await prisma.product.create({
        data: { ...data, slug: p.sourceHandle },
      });
      productId = created.id;
      byHandle.set(p.sourceHandle, productId);
      existingProducts.push({
        id: productId,
        slug: p.sourceHandle,
        sourceHandle: p.sourceHandle,
        shopifyHandle: p.sourceHandle,
      });
    }
    upsertedProducts++;

    // Images: replace in one go. Force URL under this product's handle so a
    // prior content-hash dedupe path never attaches another SKU's photos.
    await prisma.productImage.deleteMany({ where: { productId } });
    const imageRows = p.images
      .filter((img) => img.localPath)
      .map((img) => {
        const filename = img.localPath!.split("/").pop()!;
        return {
          productId: productId!,
          url: `/media/products/${p.sourceHandle}/${filename}`,
          alt: img.alt || p.displayName,
          sortOrder: img.position,
          isPrimary: img.position === 1,
          sourceUrl: img.src,
          width: img.width,
          height: img.height,
          contentHash: img.contentHash,
        };
      });
    if (imageRows.length) {
      await prisma.productImage.createMany({ data: imageRows });
      upsertedImages += imageRows.length;
    }

    // Variants: update existing or batch-create missing
    const toCreate: Prisma.ProductVariantCreateManyInput[] = [];
    for (const v of p.variants) {
      let liningId: string | null = null;
      let fittingId: string | null = null;
      let sizeId: string | null = null;
      p.options.forEach((o, idx) => {
        const val = idx === 0 ? v.option1 : idx === 1 ? v.option2 : v.option3;
        if (!val) return;
        const s = slug(val);
        const n = o.name.toLowerCase();
        if (n.includes("lining")) liningId = liningBySlug[s] || liningId;
        if (n.includes("fitting") || n.includes("reducer")) fittingId = fittingBySlug[s] || fittingId;
        if (n.includes("dimension") || n.includes("size")) sizeId = sizeBySlug[s] || sizeId;
      });

      const sku = v.sku || `SH-${v.id}`;
      const existing = variantByShopify.get(v.id);
      const vData = {
        productId: productId!,
        sku,
        title: v.title,
        sizeId,
        liningId,
        fittingId,
        priceOverride: money(v.price),
        stock: v.available ? 100 : 0,
        active: v.available,
        shopifyVariantId: v.id,
        option1: v.option1,
        option2: v.option2,
        option3: v.option3,
      };

      if (existing) {
        // Skip heavy per-variant updates if already linked — only fix productId drift
        if (existing.productId !== productId) {
          await prisma.productVariant.update({
            where: { id: existing.id },
            data: { productId: productId! },
          });
        }
        upsertedVariants++;
      } else {
        toCreate.push(vData);
      }
    }

    if (toCreate.length) {
      // createMany in chunks
      for (let c = 0; c < toCreate.length; c += 500) {
        const chunk = toCreate.slice(c, c + 500);
        await prisma.productVariant.createMany({ data: chunk, skipDuplicates: true });
        upsertedVariants += chunk.length;
      }
    }

    // Collections
    await prisma.collectionProduct.deleteMany({ where: { productId } });
    const colHandles = new Set(p.collectionHandles);
    if (productType === "LAMPSHADE") colHandles.add("lampshades");
    if (productType === "FABRIC") colHandles.add("fabrics");
    if (productType === "CUSHION") colHandles.add("cushions");
    if (productType === "KIT") colHandles.add("kits");
    if (upsertedProducts <= 8) colHandles.add("bestsellers");
    if (upsertedProducts <= 12) colHandles.add("new");

    const colRows = [...colHandles]
      .map((h, idx) => {
        const cid = collectionIds.get(h);
        if (!cid) return null;
        return { collectionId: cid, productId: productId!, sortOrder: idx };
      })
      .filter(Boolean) as { collectionId: string; productId: string; sortOrder: number }[];
    if (colRows.length) {
      await prisma.collectionProduct.createMany({ data: colRows, skipDuplicates: true });
    }

    if (p.shapeKey) {
      const shape = await prisma.shape.findUnique({ where: { key: p.shapeKey } });
      if (shape) {
        await prisma.productShape.upsert({
          where: { productId_shapeId: { productId: productId!, shapeId: shape.id } },
          create: { productId: productId!, shapeId: shape.id },
          update: {},
        });
      }
    }

    if (i % 20 === 0) console.log(`  products ${i}/${products.length}`);
  }

  return {
    upsertedProducts,
    upsertedVariants,
    upsertedImages,
    upsertedCollections: collectionIds.size,
  };
}
