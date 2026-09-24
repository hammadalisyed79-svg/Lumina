import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { catalogImageUrl } from "@/lib/studio/images";
import { composeStudioPreview } from "@/lib/studio/compose-preview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const shape = (searchParams.get("shape") || "drum").trim().toLowerCase();
  const fabricSlug = (searchParams.get("fabric") || "").trim();
  const liningSlug = (searchParams.get("lining") || "").trim();
  const diameterRaw = searchParams.get("diameter");
  const diameter = diameterRaw != null ? Number(diameterRaw) : null;

  if (!fabricSlug) {
    return NextResponse.json({ error: "fabric required" }, { status: 400 });
  }

  try {
    const [fabric, lining, shapeRow] = await Promise.all([
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
        select: { name: true, key: true },
      }),
    ]);

    if (!fabric) {
      return NextResponse.json({ error: "fabric not found" }, { status: 404 });
    }

    const fabricUrl = catalogImageUrl(fabric.imageUrl, fabric.swatchUrl);
    if (!fabricUrl) {
      return NextResponse.json({ error: "fabric has no image" }, { status: 404 });
    }

    const png = await composeStudioPreview({
      shapeKey: shapeRow?.key || shape,
      shapeName: shapeRow?.name ? `${shapeRow.name} lampshade` : undefined,
      fabricUrl,
      fabricName: fabric.name,
      liningName: lining?.name,
      liningColour: lining?.colour,
      diameterCm: Number.isFinite(diameter as number) ? diameter : null,
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
