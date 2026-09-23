/** Prefer largest practical Shopify CDN URL. */
export function highResShopifyUrl(src: string): string {
  try {
    const u = new URL(src);
    // Strip size suffix in filename: image_300x.jpg → image.jpg
    u.pathname = u.pathname.replace(/_(\d+x\d+|\d+x|x\d+)(?=\.[a-z]+$)/i, "");
    u.searchParams.delete("width");
    u.searchParams.delete("height");
    u.searchParams.delete("crop");
    // Request a large width when CDN supports it
    u.searchParams.set("width", "2000");
    return u.toString();
  } catch {
    return src;
  }
}

export function normalizeImageUrlKey(src: string): string {
  try {
    const u = new URL(src);
    u.search = "";
    u.pathname = u.pathname.replace(/_(\d+x\d+|\d+x|x\d+)(?=\.[a-z]+$)/i, "");
    return u.toString().toLowerCase();
  } catch {
    return src.split("?")[0].toLowerCase();
  }
}
