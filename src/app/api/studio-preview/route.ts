import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { catalogImageUrl } from "@/lib/studio/images";
import { composeStudioPreview } from "@/lib/studio/compose-preview";
import { isLifestyleShot } from "@/lib/studio/preview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const shape = (searchParams.get("shape") || "drum").trim().toLowerCase();
  const fabricSlug = (searchParams.get("fabric") || "").trim();
  const liningSlug = (searchParams.get("lining") || "").trim();
  const baseParam = searchParams.get("base")?.trim() || "";

  if (!fabricSlug) {
    return NextResponse.json({ error: "fabric required" }, { status: 400 });
  }

  try {
    const [fabric, lining, shapeRow, catalog] = await Promise.all([
      prisma.fabric.findFirst({
        where: { OR: [{ slug: fabricSlug }, { id: fabricSlug }], active: true },
      }),
      liningSlug
        ? prisma.lining.findFirst({
            where: {
              OR: [{ slug: liningSlug }, { id: liningSlug }],
              active: true,
            },
          })
        : Promise.resolve(null),
      prisma.shape.findFirst({
        where: { key: shape, active: true },
        select: { name: true, key: true, imageUrl: true },
      }),
      prisma.product.findMany({
        where: {
          published: true,
          type: "LAMPSHADE",
          shapeKey: shape,
        },
        select: {
          title: true,
          images: {
            orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
            take: 1,
            select: { url: true },
          },
        },
        take: 24,
      }),
    ]);

    if (!fabric) {
      return NextResponse.json({ error: "fabric not found" }, { status: 404 });
    }

    const fabricUrl = catalogImageUrl(fabric.imageUrl, fabric.swatchUrl);
    if (!fabricUrl) {
      return NextResponse.json({ error: "fabric has no image" }, { status: 404 });
    }

    // Prefer the exact photo the client showed on the shape step (`base=`).
    const safeBase =
      baseParam.startsWith("/media/") || baseParam.startsWith("/catalog/")
        ? catalogImageUrl(baseParam)
        : null;

    const shapeImageUrl =
      safeBase ||
      catalogImageUrl(shapeRow?.imageUrl) ||
      catalog
        .map((p) => ({
          url: catalogImageUrl(p.images[0]?.url),
          title: p.title,
        }))
        .find((p) => p.url && !isLifestyleShot(p.title, p.url || ""))?.url ||
      catalog.map((p) => catalogImageUrl(p.images[0]?.url)).find(Boolean) ||
      null;

    if (!shapeImageUrl) {
      return NextResponse.json(
        { error: "shape photo not found" },
        { status: 404 }
      );
    }

    const png = await composeStudioPreview({
      shapeImageUrl,
      fabricUrl,
      liningName: lining?.name,
      liningColour: lining?.colour,
    });

    return new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error("[studio-preview]", err);
    return NextResponse.json(
      { error: "Could not generate preview" },
      { status: 500 }
    );
  }
}
