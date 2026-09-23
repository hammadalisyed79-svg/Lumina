import fs from "fs";
import path from "path";
import { getDb, preferWebImage } from "./db";

type SeedProduct = {
  shopifyId: string;
  handle: string;
  title: string;
  fullTitle: string;
  description: string;
  category: string;
  tags: string[];
  price: number;
  compareAt: number | null;
  currency: string;
  image: string | null;
  images: string[];
  available: boolean;
  vendor: string;
};

const FEATURED_HANDLES = [
  "handmade-by-order-luxury-multi-colour-brush-strokes-abstract-art-print-velvet-drum-lamp-shade-pendant-light-lamp-shade-all-shapes-and-sizes",
  "handmade-by-order-orange-teal-retro-geometric-abstract-print-velvet-drum-lamp-shade-pendant-light-lamp-shade-all-shapes-and-sizes-avail",
  "handmade-by-order-luxury-blue-gold-marble-wave-abstract-art-velvet-drum-lamp-shade-pendant-light-lamp-shade-all-shapes-and-sizes-available",
  "handmade-by-order-luxury-light-blue-moroccan-geometric-tile-pattern-drum-lamp-shade-pendant-light-lamp-shade-all-shapes-and-size-available",
  "handmade-by-order-luxury-mink-gold-foiled-velvet-rectangular-lamp-shade-pendant-light-lamp-shade-all-shapes-and-sizes-available",
  "handmade-by-order-orange-roses-on-black-velvet-pattern-rounded-rectangular-shape-lamp-shade-pendant-light-lamp-shade-all-shapes-and-sizes-available",
  "handmade-by-order-abstract-jade-green-paint-abstract-patch-pattern-rounded-rectangular-velvet-lamp-shade-pendant-light-lamp-shade-all-sizes-and-shapes",
  "handmade-velvet-drum-lamp-shade-multicolored-abstract-pendant-ceiling-light",
];

export function seedProducts(force = false) {
  const db = getDb();
  const count = db.prepare("SELECT COUNT(*) as c FROM products").get() as {
    c: number;
  };
  if (count.c > 0 && !force) return { seeded: false, count: count.c };

  const file = path.join(process.cwd(), "data", "products.json");
  const raw = fs.readFileSync(file, "utf8");
  const products = JSON.parse(raw) as SeedProduct[];

  if (force) {
    db.prepare("DELETE FROM products").run();
  }

  const insert = db.prepare(`
    INSERT OR REPLACE INTO products (
      shopify_id, handle, title, full_title, description, category, tags,
      price, compare_at, currency, image, images, available, vendor, featured
    ) VALUES (
      @shopify_id, @handle, @title, @full_title, @description, @category, @tags,
      @price, @compare_at, @currency, @image, @images, @available, @vendor, @featured
    )
  `);

  const tx = db.transaction((items: SeedProduct[]) => {
    for (const p of items) {
      const images = (p.images || []).filter(Boolean);
      const image = preferWebImage(images) || preferWebImage([p.image || ""]) || p.image;
      const webImages = images.filter((u) => !u.toLowerCase().includes(".heic"));
      const finalImages = webImages.length ? webImages : images;
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
        images: JSON.stringify(finalImages),
        available: p.available ? 1 : 0,
        vendor: p.vendor,
        featured: FEATURED_HANDLES.includes(p.handle) ? 1 : 0,
      });
    }
  });

  tx(products);

  // Mark more featured drum/rectangular if needed
  db.prepare(
    `UPDATE products SET featured = 1 WHERE category IN ('Drum','Rectangular') AND image IS NOT NULL AND featured = 0 AND id IN (
      SELECT id FROM products WHERE category IN ('Drum','Rectangular') AND image IS NOT NULL ORDER BY price DESC LIMIT 12
    )`
  ).run();

  const after = db.prepare("SELECT COUNT(*) as c FROM products").get() as {
    c: number;
  };
  return { seeded: true, count: after.c };
}

export function ensureSeeded() {
  return seedProducts(false);
}
