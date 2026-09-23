import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/security/rate-limit";
import { auth } from "@/lib/auth";

const schema = z.object({
  productId: z.string().min(1),
  author: z.string().min(2).max(80),
  email: z.string().email().optional().or(z.literal("")),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().min(10).max(2000),
  imageUrls: z.array(z.string().min(1).max(500)).max(3).optional(),
});

async function hasVerifiedPurchase(opts: {
  productId: string;
  userId?: string | null;
  email?: string | null;
}) {
  const email = opts.email?.trim().toLowerCase();
  const or: { userId?: string; email?: { equals: string; mode: "insensitive" } }[] = [];
  if (opts.userId) or.push({ userId: opts.userId });
  if (email) or.push({ email: { equals: email, mode: "insensitive" } });
  if (!or.length) return false;

  const hit = await prisma.orderItem.findFirst({
    where: {
      productId: opts.productId,
      order: {
        paymentStatus: "PAID",
        status: { notIn: ["CANCELLED", "REFUNDED"] },
        OR: or,
      },
    },
    select: { id: true },
  });
  return Boolean(hit);
}

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`review:${ip}`, 5, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid review" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const session = await auth();
  const userId = session?.user?.id ?? null;
  const email = parsed.data.email || session?.user?.email || null;

  const verifiedPurchase = await hasVerifiedPurchase({
    productId: parsed.data.productId,
    userId,
    email,
  });

  const urls = (parsed.data.imageUrls || []).filter(Boolean).slice(0, 3);

  await prisma.review.create({
    data: {
      productId: parsed.data.productId,
      userId,
      author: parsed.data.author,
      email: email || null,
      rating: parsed.data.rating,
      title: parsed.data.title || null,
      body: parsed.data.body,
      status: "PENDING",
      verifiedPurchase,
      images: urls.length
        ? {
            create: urls.map((url, i) => ({
              url,
              alt: `Review photo ${i + 1}`,
              sortOrder: i,
            })),
          }
        : undefined,
    },
  });

  return NextResponse.json({ ok: true, verifiedPurchase });
}
