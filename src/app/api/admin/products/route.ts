import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { writeAuditLog } from "@/lib/security/audit";

const schema = z.object({
  title: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().min(10),
  type: z.enum(["LAMPSHADE", "FABRIC", "CUSHION", "KIT", "ACCESSORY"]),
  basePrice: z.number().positive(),
  fabricId: z.string().optional(),
  published: z.boolean().optional(),
});

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid product" }, { status: 400 });

  const slug = slugify(parsed.data.slug);
  const exists = await prisma.product.findUnique({ where: { slug } });
  if (exists) return NextResponse.json({ error: "Slug already exists" }, { status: 409 });

  const product = await prisma.product.create({
    data: {
      title: parsed.data.title,
      slug,
      description: parsed.data.description,
      type: parsed.data.type,
      basePrice: parsed.data.basePrice,
      published: parsed.data.published ?? true,
      images: {
        create: [
          {
            url: "/demo-assets/products/placeholder.svg",
            alt: parsed.data.title,
            isPrimary: true,
          },
        ],
      },
      variants: {
        create: [
          {
            sku: `${slug.toUpperCase().replace(/-/g, "").slice(0, 16)}-01`,
            title: "Default",
            fabricId: parsed.data.fabricId || null,
          },
        ],
      },
    },
  });

  await writeAuditLog({
    userId: session.user.id,
    action: "admin.product.create",
    entity: "Product",
    entityId: product.id,
  });

  return NextResponse.json({ id: product.id });
}
