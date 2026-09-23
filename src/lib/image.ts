/** Image helpers for Next/Image — prefer local /media paths and safe optimization. */

export function normalizeImageSrc(src: string): string {
  if (!src) return src;
  if (src.startsWith("/catalog/")) {
    return src.replace(/^\/catalog\//, "/media/");
  }
  return src;
}

/** True when Next.js image optimization should run for this src. */
export function shouldOptimizeImage(src?: string | null): boolean {
  if (!src) return false;
  const u = normalizeImageSrc(src);
  if (/\.heic($|\?)/i.test(u) || u.includes("placeholder")) return false;

  if (u.startsWith("/")) return true;

  try {
    const host = new URL(u).hostname.toLowerCase();
    if (host === "res.cloudinary.com") return true;
    if (host === "cdn.shopify.com") return true;
    if (host === "www.luminahub.co.uk" || host === "luminahub.co.uk") return true;
    if (host.endsWith(".r2.dev")) return true;
    return false;
  } catch {
    return false;
  }
}
