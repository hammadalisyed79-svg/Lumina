import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getOrCreateWishlist(userId: string) {
  let wishlist = await prisma.wishlist.findUnique({ where: { userId } });
  if (!wishlist) {
    wishlist = await prisma.wishlist.create({ data: { userId } });
  }
  return wishlist;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const wishlist = await prisma.wishlist.findUnique({
    where: { userId: session.user.id },
    include: { items: { select: { productId: true } } },
  });

  return NextResponse.json({
    ids: wishlist?.items.map((i) => i.productId) || [],
  });
}

const toggleSchema = z.object({
  productId: z.string().min(1),
  action: z.enum(["add", "remove", "toggle"]).optional(),
});

/** Add, remove, or toggle a wishlist item for the signed-in user. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = toggleSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
    select: { id: true },
  });
  if (!product) return NextResponse.json({ error: "Unknown product" }, { status: 404 });

  const wishlist = await getOrCreateWishlist(session.user.id);
  const existing = await prisma.wishlistItem.findUnique({
    where: {
      wishlistId_productId: {
        wishlistId: wishlist.id,
        productId: product.id,
      },
    },
  });

  const action = parsed.data.action || "toggle";
  let saved = Boolean(existing);

  if (action === "remove" || (action === "toggle" && existing)) {
    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } });
    }
    saved = false;
  } else if (action === "add" || (action === "toggle" && !existing)) {
    if (!existing) {
      await prisma.wishlistItem.create({
        data: { wishlistId: wishlist.id, productId: product.id },
      });
    }
    saved = true;
  }

  const items = await prisma.wishlistItem.findMany({
    where: { wishlistId: wishlist.id },
    select: { productId: true },
  });

  return NextResponse.json({ saved, ids: items.map((i) => i.productId) });
}
