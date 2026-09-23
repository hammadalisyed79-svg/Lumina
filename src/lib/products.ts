import { ensureSeeded } from "./seed";
import { getDb, mapProduct, ProductRow } from "./db";
import type { Product } from "./types";

export type ProductQuery = {
  category?: string;
  q?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
  sort?: "newest" | "price-asc" | "price-desc" | "title";
};

export function listProducts(query: ProductQuery = {}): {
  products: Product[];
  total: number;
} {
  ensureSeeded();
  const db = getDb();
  const where: string[] = [];
  const params: Record<string, string | number> = {};

  if (query.category && query.category !== "All") {
    where.push("category = @category");
    params.category = query.category;
  }
  if (query.featured) {
    where.push("featured = 1");
  }
  if (query.q) {
    where.push(
      "(title LIKE @q OR full_title LIKE @q OR description LIKE @q OR tags LIKE @q OR category LIKE @q)"
    );
    params.q = `%${query.q}%`;
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  let order = "id DESC";
  switch (query.sort) {
    case "price-asc":
      order = "price ASC";
      break;
    case "price-desc":
      order = "price DESC";
      break;
    case "title":
      order = "title ASC";
      break;
    default:
      order = "featured DESC, id DESC";
  }

  const total = (
    db.prepare(`SELECT COUNT(*) as c FROM products ${whereSql}`).get(params) as {
      c: number;
    }
  ).c;

  const limit = Math.min(query.limit ?? 24, 100);
  const offset = query.offset ?? 0;
  const rows = db
    .prepare(
      `SELECT * FROM products ${whereSql} ORDER BY ${order} LIMIT @limit OFFSET @offset`
    )
    .all({ ...params, limit, offset }) as ProductRow[];

  return { products: rows.map(mapProduct), total };
}

export function getProductByHandle(handle: string): Product | null {
  ensureSeeded();
  const row = getDb()
    .prepare("SELECT * FROM products WHERE handle = ?")
    .get(handle) as ProductRow | undefined;
  return row ? mapProduct(row) : null;
}

export function getCategories(): { name: string; count: number }[] {
  ensureSeeded();
  const rows = getDb()
    .prepare(
      `SELECT category as name, COUNT(*) as count FROM products GROUP BY category ORDER BY count DESC`
    )
    .all() as { name: string; count: number }[];
  return rows;
}

export function getRelated(handle: string, category: string, limit = 4) {
  ensureSeeded();
  const rows = getDb()
    .prepare(
      `SELECT * FROM products WHERE category = ? AND handle != ? ORDER BY featured DESC LIMIT ?`
    )
    .all(category, handle, limit) as ProductRow[];
  return rows.map(mapProduct);
}
