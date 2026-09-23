const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const dataDir = path.join(__dirname, "..", "data");
const dbPath = path.join(dataDir, "luminahub.db");
fs.mkdirSync(dataDir, { recursive: true });

function preferWebImage(urls) {
  if (!urls?.length) return null;
  const ranked = [...urls].sort((a, b) => {
    const score = (u) => {
      const lower = u.toLowerCase();
      if (lower.includes(".heic")) return 0;
      if (lower.includes(".webp")) return 3;
      if (lower.includes(".jpg") || lower.includes(".jpeg")) return 3;
      if (lower.includes(".png")) return 2;
      return 1;
    };
    return score(b) - score(a);
  });
  return ranked.find((u) => !u.toLowerCase().includes(".heic")) || ranked[0] || null;
}

const FEATURED = [
  "handmade-by-order-luxury-multi-colour-brush-strokes-abstract-art-print-velvet-drum-lamp-shade-pendant-light-lamp-shade-all-shapes-and-sizes",
  "handmade-by-order-orange-teal-retro-geometric-abstract-print-velvet-drum-lamp-shade-pendant-light-lamp-shade-all-shapes-and-sizes-avail",
  "handmade-by-order-luxury-blue-gold-marble-wave-abstract-art-velvet-drum-lamp-shade-pendant-light-lamp-shade-all-shapes-and-sizes-available",
  "handmade-by-order-luxury-light-blue-moroccan-geometric-tile-pattern-drum-lamp-shade-pendant-light-lamp-shade-all-shapes-and-size-available",
  "handmade-by-order-luxury-mink-gold-foiled-velvet-rectangular-lamp-shade-pendant-light-lamp-shade-all-shapes-and-sizes-available",
  "handmade-by-order-orange-roses-on-black-velvet-pattern-rounded-rectangular-shape-lamp-shade-pendant-light-lamp-shade-all-shapes-and-sizes-available",
  "handmade-by-order-abstract-jade-green-paint-abstract-patch-pattern-rounded-rectangular-velvet-lamp-shade-pendant-light-lamp-shade-all-sizes-and-shapes",
  "handmade-velvet-drum-lamp-shade-multicolored-abstract-pendant-ceiling-light",
];

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.exec(`
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
`);

db.prepare("DELETE FROM products").run();
const products = JSON.parse(
  fs.readFileSync(path.join(dataDir, "products.json"), "utf8")
);

const insert = db.prepare(`
  INSERT INTO products (
    shopify_id, handle, title, full_title, description, category, tags,
    price, compare_at, currency, image, images, available, vendor, featured
  ) VALUES (
    @shopify_id, @handle, @title, @full_title, @description, @category, @tags,
    @price, @compare_at, @currency, @image, @images, @available, @vendor, @featured
  )
`);

const tx = db.transaction((items) => {
  for (const p of items) {
    const images = (p.images || []).filter(Boolean);
    const image = preferWebImage(images) || p.image;
    const webImages = images.filter((u) => !u.toLowerCase().includes(".heic"));
    insert.run({
      shopify_id: p.shopifyId,
      handle: p.handle,
      title: p.title,
      full_title: p.fullTitle,
      description: p.description,
      category: p.category,
      tags: JSON.stringify(p.tags || []),
      price: p.price,
      compare_at: p.compareAt,
      currency: p.currency || "GBP",
      image,
      images: JSON.stringify(webImages.length ? webImages : images),
      available: p.available ? 1 : 0,
      vendor: p.vendor,
      featured: FEATURED.includes(p.handle) ? 1 : 0,
    });
  }
});
tx(products);

db.prepare(
  `UPDATE products SET featured = 1 WHERE category IN ('Drum','Rectangular') AND image IS NOT NULL AND featured = 0 AND id IN (
    SELECT id FROM products WHERE category IN ('Drum','Rectangular') AND image IS NOT NULL ORDER BY price DESC LIMIT 12
  )`
).run();

const count = db.prepare("SELECT COUNT(*) as c FROM products").get().c;
const featured = db.prepare("SELECT COUNT(*) as c FROM products WHERE featured=1").get().c;
console.log(`Seeded ${count} products (${featured} featured)`);
db.close();
