import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/utils";
import { AdminProductActions } from "@/components/admin/AdminProductActions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: true, images: true },
  });
  if (!product) notFound();

  return (
    <div>
      <h1 className="font-display text-4xl mb-2">{product.title}</h1>
      <p className="text-sm text-[color:var(--muted)] mb-6">/{product.slug}</p>
      <p className="mb-4">{formatMoney(product.basePrice)} · {product.type}</p>
      <AdminProductActions id={product.id} published={product.published} />
      <h2 className="font-display text-2xl mt-10 mb-4">Variants</h2>
      <ul className="space-y-2 text-sm">
        {product.variants.map((v) => (
          <li key={v.id} className="border border-[color:var(--line)] p-3 bg-white/60">
            {v.sku} — {v.title} {v.active ? "" : "(inactive)"}
          </li>
        ))}
      </ul>
    </div>
  );
}
