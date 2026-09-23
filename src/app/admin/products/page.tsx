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
      <div className="flex items-center justify-between mb-4">
        <h1 className="admin-h1">Products</h1>
        <Link href="/admin/products/new" className="btn-primary">
          New product
        </Link>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Price</th>
              <th>Variants</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link href={`/admin/products/${p.id}`} className="underline">
                    {p.title}
                  </Link>
                </td>
                <td>{p.type}</td>
                <td>{formatMoney(p.basePrice)}</td>
                <td>{p.variants.length}</td>
                <td>
                  <span className="admin-badge">{p.published ? "Published" : "Draft"}</span>
                </td>
                <td>
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
