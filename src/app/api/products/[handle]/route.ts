import { NextRequest, NextResponse } from "next/server";
import { getProductByHandle, getRelated } from "@/lib/products";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params;
  const product = getProductByHandle(handle);
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const related = getRelated(product.handle, product.category, 4);
  return NextResponse.json({ product, related });
}
