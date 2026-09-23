import { NextResponse } from "next/server";
import { uploadImage } from "@/lib/images";
import { prisma } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/security/rate-limit";

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`review-upload:${ip}`, 8, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File required" }, { status: 400 });
  }
  if (file.size > 3_500_000) {
    return NextResponse.json({ error: "File too large (max 3.5MB)" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Images only" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploaded = await uploadImage({
    buffer,
    filename: file.name,
    folder: "reviews",
  });

  await prisma.mediaAsset.create({
    data: {
      key: uploaded.key,
      url: uploaded.url,
      alt: file.name,
      provider: uploaded.provider,
      folder: "reviews",
    },
  });

  return NextResponse.json({ url: uploaded.url, key: uploaded.key });
}
