import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toNumber } from "@/lib/pricing";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ids = (searchParams.get("ids") || "").split(",").filter(Boolean).slice(0, 50);
  if (ids.length === 0) return NextResponse.json({ products: [] });

  const products = await prisma.product.findMany({
    where: { id: { in: ids }, published: true },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 2 } },
  });

  return NextResponse.json({
    products: products.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      subtitle: p.subtitle,
      basePrice: toNumber(p.basePrice),
      imageUrl: p.images[0]?.url || "/demo-assets/products/placeholder.svg",
      hoverImageUrl: p.images[1]?.url,
    })),
  });
}
