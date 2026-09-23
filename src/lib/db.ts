import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "luminahub.db");

let db: Database.Database | null = null;

export function getDb() {
  if (db) return db;
  fs.mkdirSync(dataDir, { recursive: true });
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  return db;
}

function migrate(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shopify_id TEXT UNIQUE NOT NULL,
      handle TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      full_title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      tags TEXT,
      price REAL NOT NULL,
      compare_at REAL,
      currency TEXT NOT NULL DEFAULT 'GBP',
      image TEXT,
      images TEXT,
      available INTEGER NOT NULL DEFAULT 1,
      vendor TEXT,
      featured INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      phone TEXT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      address_line1 TEXT NOT NULL,
      address_line2 TEXT,
      city TEXT NOT NULL,
      county TEXT,
      postcode TEXT NOT NULL,
      country TEXT NOT NULL DEFAULT 'United Kingdom',
      items TEXT NOT NULL,
      subtotal REAL NOT NULL,
      shipping REAL NOT NULL,
      total REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS newsletter (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS wishlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      product_handle TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(session_id, product_handle)
    );

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
  `);
}

export type ProductRow = {
  id: number;
  shopify_id: string;
  handle: string;
  title: string;
  full_title: string;
  description: string | null;
  category: string;
  tags: string;
  price: number;
  compare_at: number | null;
  currency: string;
  image: string | null;
  images: string;
  available: number;
  vendor: string | null;
  featured: number;
  created_at: string;
};

import type { Product } from "./types";
export type { Product };

export function mapProduct(row: ProductRow): Product {
  let images: string[] = [];
  try {
    images = JSON.parse(row.images || "[]");
  } catch {
    images = [];
  }
  let tags: string[] = [];
  try {
    tags = JSON.parse(row.tags || "[]");
  } catch {
    tags = [];
  }
  return {
    id: row.id,
    shopifyId: row.shopify_id,
    handle: row.handle,
    title: row.title,
    fullTitle: row.full_title,
    description: row.description || "",
    category: row.category,
    tags,
    price: row.price,
    compareAt: row.compare_at,
    currency: row.currency,
    image: row.image,
    images,
    available: Boolean(row.available),
    vendor: row.vendor || "Lumina Hub",
    featured: Boolean(row.featured),
  };
}

export function preferWebImage(urls: string[]): string | null {
  if (!urls?.length) return null;
  const ranked = [...urls].sort((a, b) => {
    const score = (u: string) => {
      const lower = u.toLowerCase();
      if (lower.includes(".heic")) return 0;
      if (lower.includes(".webp")) return 3;
      if (lower.includes(".jpg") || lower.includes(".jpeg")) return 3;
      if (lower.includes(".png")) return 2;
      return 1;
    };
    return score(b) - score(a);
  });
  const best = ranked.find((u) => !u.toLowerCase().includes(".heic"));
  return best || ranked[0] || null;
}

