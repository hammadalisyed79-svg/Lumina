import { NextRequest, NextResponse } from "next/server";
import { listProducts, getCategories } from "@/lib/products";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || undefined;
  const q = searchParams.get("q") || undefined;
  const featured = searchParams.get("featured") === "1";
  const sort = (searchParams.get("sort") as
    | "newest"
    | "price-asc"
    | "price-desc"
    | "title"
    | null) || undefined;
  const limit = Number(searchParams.get("limit") || 24);
  const offset = Number(searchParams.get("offset") || 0);
  const meta = searchParams.get("meta") === "1";

  const result = listProducts({ category, q, featured, sort, limit, offset });
  if (meta) {
    return NextResponse.json({
      ...result,
      categories: getCategories(),
    });
  }
  return NextResponse.json(result);
}
