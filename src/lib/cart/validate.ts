import { prisma } from "@/lib/db";
import { calculateUnitPrice, roundMoney, toNumber } from "@/lib/pricing";
import { configuredLineKey, productLineKey } from "@/lib/cart/ids";
import {
  eligibilityBlock,
  taperDiametersMissing,
  unscopedSizeBlock,
  type OrderabilityBlock,
} from "@/lib/cart/orderability";
import type { ConfiguredSnapshot, ProductSnapshot } from "@/lib/cart/snapshot";

export type CartValidateInput =
  | {
      kind: "configured";
      quantity: number;
      config: {
        shapeKey: string;
        sizeSlug: string;
        fabricSlug: string;
        liningSlug: string;
        fittingSlug: string;
        useType?: string | null;
        personalisation?: string;
        /** Client hint only — ignored for pricing */
        unitPrice?: number;
      };
      clientLineId?: string;
    }
  | {
      kind: "product";
      quantity: number;
      productId: string;
      variantId?: string;
      clientLineId?: string;
    };

export type ValidatedCartLine =
  | {
      ok: true;
      kind: "configured";
      quantity: number;
      clientLineId?: string;
      title: string;
      unitPrice: number;
      lineTotal: number;
      snapshot: ConfiguredSnapshot;
      imageUrl?: string;
    }
  | {
      ok: true;
      kind: "product";
      quantity: number;
      clientLineId?: string;
      title: string;
      unitPrice: number;
      lineTotal: number;
      snapshot: ProductSnapshot;
      productId: string;
      variantId: string;
      sku?: string;
      imageUrl?: string;
      slug?: string;
    }
  | {
      ok: false;
      kind: "configured" | "product";
      clientLineId?: string;
      quantity: number;
      blocks: OrderabilityBlock[];
      /** Present when partial identity known */
      title?: string;
    };

export async function validateCartLine(
  input: CartValidateInput
): Promise<ValidatedCartLine> {
  const qty = Math.max(1, Math.min(20, Math.floor(input.quantity) || 1));

  if (input.kind === "configured") {
    return validateConfigured(input.config, qty, input.clientLineId);
  }
  return validateProduct(input.productId, input.variantId, qty, input.clientLineId);
}

async function validateConfigured(
  cfg: Extract<CartValidateInput, { kind: "configured" }>["config"],
  quantity: number,
  clientLineId?: string
): Promise<ValidatedCartLine> {
  const blocks: OrderabilityBlock[] = [];

  const [shape, fabric, size, lining, fitting] = await Promise.all([
    prisma.shape.findUnique({ where: { key: cfg.shapeKey } }),
    prisma.fabric.findUnique({ where: { slug: cfg.fabricSlug } }),
    prisma.size.findUnique({ where: { slug: cfg.sizeSlug } }),
    prisma.lining.findUnique({ where: { slug: cfg.liningSlug } }),
    prisma.fitting.findUnique({ where: { slug: cfg.fittingSlug } }),
  ]);

  if (!shape?.active) {
    blocks.push({
      code: shape ? "INACTIVE" : "MISSING_OPTION",
      message: "Shape is unavailable.",
      field: "shape",
    });
  }
  if (!fabric?.active) {
    blocks.push({
      code: fabric ? "INACTIVE" : "MISSING_OPTION",
      message: "Fabric is unavailable.",
      field: "fabric",
    });
  }
  if (!size?.active) {
    blocks.push({
      code: size ? "INACTIVE" : "MISSING_OPTION",
      message: "Size is unavailable.",
      field: "size",
    });
  }
  if (!lining?.active) {
    blocks.push({
      code: lining ? "INACTIVE" : "MISSING_OPTION",
      message: "Lining is unavailable.",
      field: "lining",
    });
  }
  if (!fitting?.active) {
    blocks.push({
      code: fitting ? "INACTIVE" : "MISSING_OPTION",
      message: "Fitting is unavailable.",
      field: "fitting",
    });
  }

  if (blocks.length || !shape || !fabric || !size || !lining || !fitting) {
    return {
      ok: false,
      kind: "configured",
      clientLineId,
      quantity,
      blocks,
      title: shape && fabric ? `Custom ${shape.name} · ${fabric.name}` : undefined,
    };
  }

  const [shapeSize, shapeFabric, shapeLining, shapeFitting] = await Promise.all([
    prisma.shapeSize.findUnique({
      where: { shapeId_sizeId: { shapeId: shape.id, sizeId: size.id } },
    }),
    prisma.shapeFabric.findUnique({
      where: { shapeId_fabricId: { shapeId: shape.id, fabricId: fabric.id } },
    }),
    prisma.shapeLining.findUnique({
      where: { shapeId_liningId: { shapeId: shape.id, liningId: lining.id } },
    }),
    prisma.shapeFitting.findUnique({
      where: { shapeId_fittingId: { shapeId: shape.id, fittingId: fitting.id } },
    }),
  ]);

  const sizeEligKeys = (
    await prisma.shapeSize.findMany({
      where: { sizeId: size.id, needsReview: false },
      include: { shape: { select: { key: true } } },
    })
  ).map((r) => r.shape.key);

  const unscoped = unscopedSizeBlock(sizeEligKeys);
  if (unscoped) blocks.push(unscoped);

  for (const b of [
    eligibilityBlock({
      kind: "size",
      hasRow: !!shapeSize,
      needsReview: !!shapeSize?.needsReview,
    }),
    eligibilityBlock({
      kind: "fabric",
      hasRow: !!shapeFabric,
      needsReview: !!shapeFabric?.needsReview,
    }),
    eligibilityBlock({
      kind: "lining",
      hasRow: !!shapeLining,
      needsReview: !!shapeLining?.needsReview,
    }),
    eligibilityBlock({
      kind: "fitting",
      hasRow: !!shapeFitting,
      needsReview: !!shapeFitting?.needsReview,
    }),
    taperDiametersMissing({
      shapeKey: shape.key,
      topDiameterCm: size.topDiameterCm != null ? toNumber(size.topDiameterCm) : null,
      bottomDiameterCm:
        size.bottomDiameterCm != null ? toNumber(size.bottomDiameterCm) : null,
    }),
  ]) {
    if (b) blocks.push(b);
  }

  if (blocks.length) {
    return {
      ok: false,
      kind: "configured",
      clientLineId,
      quantity,
      blocks,
      title: `Custom ${shape.name} · ${fabric.name}`,
    };
  }

  const unitPrice = calculateUnitPrice({
    basePrice: toNumber(shape.basePrice) + toNumber(shape.priceMod),
    fabricMod: toNumber(fabric.priceMod),
    sizeMod: toNumber(size.priceMod),
    liningMod: toNumber(lining.priceMod),
    fittingMod: toNumber(fitting.priceMod),
  });

  const lineKey = configuredLineKey({
    shapeKey: shape.key,
    sizeSlug: size.slug,
    fabricSlug: fabric.slug,
    liningSlug: lining.slug,
    fittingSlug: fitting.slug,
  });

  const snapshot: ConfiguredSnapshot = {
    version: 1,
    lineKey,
    serverTrusted: true,
    pricedAt: new Date().toISOString(),
    shapeId: shape.id,
    shapeKey: shape.key,
    shapeName: shape.name,
    sizeId: size.id,
    sizeSlug: size.slug,
    sizeName: size.name,
    fabricId: fabric.id,
    fabricSlug: fabric.slug,
    fabricName: fabric.name,
    liningId: lining.id,
    liningSlug: lining.slug,
    liningName: lining.name,
    fittingId: fitting.id,
    fittingSlug: fitting.slug,
    fittingName: fitting.name,
    useType: cfg.useType ?? null,
    personalisation: cfg.personalisation,
    unitPrice,
    measurements: {
      diameterCm: size.diameterCm != null ? toNumber(size.diameterCm) : null,
      heightCm: size.heightCm != null ? toNumber(size.heightCm) : null,
      widthCm: size.widthCm != null ? toNumber(size.widthCm) : null,
      depthCm: size.depthCm != null ? toNumber(size.depthCm) : null,
      topDiameterCm: size.topDiameterCm != null ? toNumber(size.topDiameterCm) : null,
      bottomDiameterCm:
        size.bottomDiameterCm != null ? toNumber(size.bottomDiameterCm) : null,
    },
    imageUrl: fabric.imageUrl || fabric.swatchUrl || shape.imageUrl,
    leadTimeNote: "Handmade to order — typically 2–3 weeks",
  };

  return {
    ok: true,
    kind: "configured",
    quantity,
    clientLineId,
    title: `Custom ${shape.name} · ${fabric.name} · ${size.name}`,
    unitPrice,
    lineTotal: roundMoney(unitPrice * quantity),
    snapshot,
    imageUrl: snapshot.imageUrl || undefined,
  };
}

async function validateProduct(
  productId: string,
  variantId: string | undefined,
  quantity: number,
  clientLineId?: string
): Promise<ValidatedCartLine> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { images: { take: 1, orderBy: { sortOrder: "asc" } }, variants: true },
  });

  if (!product || !product.published || product.archived) {
    return {
      ok: false,
      kind: "product",
      clientLineId,
      quantity,
      blocks: [
        {
          code: "PRODUCT_UNAVAILABLE",
          message: "Product is unavailable.",
          field: "product",
        },
      ],
    };
  }

  const variant = variantId
    ? product.variants.find((v) => v.id === variantId && v.active)
    : product.variants.find((v) => v.active);

  if (!variant) {
    return {
      ok: false,
      kind: "product",
      clientLineId,
      quantity,
      title: product.title,
      blocks: [
        {
          code: "VARIANT_UNAVAILABLE",
          message: "No purchasable variant available for this product.",
          field: "variant",
        },
      ],
    };
  }

  const unitPrice = variant.priceOverride
    ? toNumber(variant.priceOverride)
    : toNumber(product.basePrice);

  const snapshot: ProductSnapshot = {
    version: 1,
    lineKey: productLineKey(product.id, variant.id),
    serverTrusted: true,
    pricedAt: new Date().toISOString(),
    productId: product.id,
    variantId: variant.id,
    title: `${product.title}${
      variant.title && variant.title !== "Default Title" ? ` · ${variant.title}` : ""
    }`,
    sku: variant.sku,
    unitPrice,
    imageUrl: product.images[0]?.url,
    slug: product.slug,
  };

  return {
    ok: true,
    kind: "product",
    quantity,
    clientLineId,
    title: snapshot.title,
    unitPrice,
    lineTotal: roundMoney(unitPrice * quantity),
    snapshot,
    productId: product.id,
    variantId: variant.id,
    sku: variant.sku || undefined,
    imageUrl: snapshot.imageUrl || undefined,
    slug: product.slug,
  };
}

export async function validateCartLines(lines: CartValidateInput[]) {
  const results = [];
  for (const line of lines) {
    results.push(await validateCartLine(line));
  }
  const ok = results.every((r) => r.ok);
  const subtotal = roundMoney(
    results.filter((r): r is Extract<ValidatedCartLine, { ok: true }> => r.ok)
      .reduce((s, r) => s + r.lineTotal, 0)
  );
  return { ok, lines: results, subtotal };
}
