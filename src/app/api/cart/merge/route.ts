import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { CartLine } from "@/lib/cart/types";
import { cartLineKey } from "@/lib/cart/ids";

const schema = z.object({
  items: z.array(z.record(z.string(), z.unknown())).max(40).default([]),
});

function normalize(items: unknown[]): CartLine[] {
  return items
    .map((raw) => {
      const item = raw as Partial<CartLine>;
      if (!item || (item.kind !== "product" && item.kind !== "configured")) return null;
      const lineKey =
        item.lineKey ||
        cartLineKey({
          kind: item.kind,
          productId: item.productId,
          variantId: item.variantId,
          config: item.config,
        });
      return {
        id: String(item.id || `c_${Math.random().toString(36).slice(2, 10)}`),
        lineKey,
        kind: item.kind,
        productId: item.productId,
        variantId: item.variantId,
        slug: item.slug,
        title: String(item.title || "Item"),
        imageUrl: item.imageUrl,
        quantity: Math.max(1, Math.min(20, Number(item.quantity) || 1)),
        unitPrice: Number(item.unitPrice) || 0,
        config: item.config,
        snapshot: item.snapshot,
      } satisfies CartLine;
    })
    .filter(Boolean) as CartLine[];
}

function mergeCarts(guest: CartLine[], server: CartLine[]): CartLine[] {
  const map = new Map<string, CartLine>();
  for (const line of [...server, ...guest]) {
    const existing = map.get(line.lineKey);
    if (!existing) {
      map.set(line.lineKey, { ...line });
      continue;
    }
    map.set(line.lineKey, {
      ...existing,
      quantity: Math.min(20, existing.quantity + line.quantity),
      unitPrice: line.unitPrice || existing.unitPrice,
      snapshot: line.snapshot || existing.snapshot,
      config: line.config || existing.config,
      title: line.title || existing.title,
      imageUrl: line.imageUrl || existing.imageUrl,
    });
  }
  return Array.from(map.values());
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  const guest = normalize(parsed.data.items);
  const existing = await prisma.cart.findUnique({
    where: { userId: session.user.id },
  });
  const server = existing ? normalize((existing.itemsJson as unknown[]) || []) : [];
  const merged = mergeCarts(guest, server);

  await prisma.cart.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      itemsJson: merged,
    },
    update: {
      itemsJson: merged,
    },
  });

  return NextResponse.json({ items: merged });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const existing = await prisma.cart.findUnique({
    where: { userId: session.user.id },
  });
  const items = existing ? normalize((existing.itemsJson as unknown[]) || []) : [];
  return NextResponse.json({ items });
}
