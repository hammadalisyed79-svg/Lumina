import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toNumber } from "@/lib/pricing";

export async function GET() {
  const methods = await prisma.shippingMethod.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json({
    methods: methods.map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      price: toNumber(m.price),
      freeAbove: m.freeAbove ? toNumber(m.freeAbove) : null,
      calcType: m.calcType,
    })),
  });
}
