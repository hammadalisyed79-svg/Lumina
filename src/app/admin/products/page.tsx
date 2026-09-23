import { prisma } from "@/lib/db";
import Link from "next/link";
import { formatMoney } from "@/lib/utils";
import { AdminProductActions } from "@/components/admin/AdminProductActions";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { updatedAt: "desc" },
    include: { variants: true, images: { take: 1 } },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-4xl">Products</h1>
        <Link href="/admin/products/new" className="btn-primary">
          New product
        </Link>
      </div>
      <div className="overflow-x-auto border border-[color:var(--line)] bg-white/70">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[color:var(--line)] text-left">
              <th className="p-3">Title</th>
              <th className="p-3">Type</th>
              <th className="p-3">Price</th>
              <th className="p-3">Variants</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-[color:var(--line)]">
                <td className="p-3">
                  <Link href={`/admin/products/${p.id}`} className="underline">
                    {p.title}
                  </Link>
                </td>
                <td className="p-3">{p.type}</td>
                <td className="p-3">{formatMoney(p.basePrice)}</td>
                <td className="p-3">{p.variants.length}</td>
                <td className="p-3">{p.published ? "Published" : "Draft"}</td>
                <td className="p-3">
                  <AdminProductActions id={p.id} published={p.published} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
