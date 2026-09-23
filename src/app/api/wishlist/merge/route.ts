import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  productIds: z.array(z.string()).max(100),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  let wishlist = await prisma.wishlist.findUnique({ where: { userId: session.user.id } });
  if (!wishlist) {
    wishlist = await prisma.wishlist.create({ data: { userId: session.user.id } });
  }

  for (const productId of parsed.data.productIds) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) continue;
    await prisma.wishlistItem.upsert({
      where: {
        wishlistId_productId: { wishlistId: wishlist.id, productId },
      },
      create: { wishlistId: wishlist.id, productId },
      update: {},
    });
  }

  const items = await prisma.wishlistItem.findMany({ where: { wishlistId: wishlist.id } });
  return NextResponse.json({ ids: items.map((i) => i.productId) });
}
