/**
 * Image provider abstraction — local placeholders, Cloudinary, or R2.
 */

export type ImageProvider = "local" | "cloudinary" | "r2";

export function getImageProvider(): ImageProvider {
  const p = (process.env.IMAGE_PROVIDER || "local").toLowerCase();
  if (p === "cloudinary" || p === "r2") return p;
  return "local";
}

export function mediaUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return "/demo-assets/products/placeholder.svg";
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://") || pathOrUrl.startsWith("/")) {
    return pathOrUrl;
  }
  const provider = getImageProvider();
  if (provider === "cloudinary" && process.env.CLOUDINARY_CLOUD_NAME) {
    return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${pathOrUrl}`;
  }
  if (provider === "r2" && process.env.R2_PUBLIC_URL) {
    return `${process.env.R2_PUBLIC_URL.replace(/\/$/, "")}/${pathOrUrl}`;
  }
  return `/demo-assets/${pathOrUrl.replace(/^\//, "")}`;
}

export async function uploadImage(input: {
  buffer: Buffer;
  filename: string;
  folder?: string;
}): Promise<{ url: string; key: string; provider: ImageProvider }> {
  const provider = getImageProvider();
  const key = `${input.folder ?? "uploads"}/${Date.now()}-${input.filename.replace(/[^a-zA-Z0-9._-]/g, "")}`;

  if (provider === "cloudinary" && process.env.CLOUDINARY_CLOUD_NAME) {
    const { v2: cloudinary } = await import("cloudinary");
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    const b64 = `data:image/jpeg;base64,${input.buffer.toString("base64")}`;
    const result = await cloudinary.uploader.upload(b64, {
      folder: input.folder ?? "lumina",
      public_id: input.filename.replace(/\.[^.]+$/, ""),
    });
    return { url: result.secure_url, key: result.public_id, provider };
  }

  // Local / R2 stub — store key for later sync; return public demo path
  return {
    url: mediaUrl(key),
    key,
    provider: provider === "r2" ? "r2" : "local",
  };
}
