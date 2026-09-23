import { NextResponse } from "next/server";
import { uploadImage } from "@/lib/images";
import { prisma } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/security/rate-limit";

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`upload:${ip}`, 5, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File required" }, { status: 400 });
  }
  if (file.size > 4_000_000) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploaded = await uploadImage({
    buffer,
    filename: file.name,
    folder: "bespoke",
  });

  await prisma.mediaAsset.create({
    data: {
      key: uploaded.key,
      url: uploaded.url,
      alt: file.name,
      provider: uploaded.provider,
      folder: "bespoke",
    },
  });

  return NextResponse.json({
    name: file.name,
    size: file.size,
    type: file.type,
    url: uploaded.url,
    key: uploaded.key,
  });
}
