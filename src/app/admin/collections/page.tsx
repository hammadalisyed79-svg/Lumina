import { prisma } from "@/lib/db";
import Link from "next/link";
import { CollectionPublishedToggle } from "@/components/admin/CollectionForm";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage() {
  const rows = await prisma.collection.findMany({
    orderBy: { sortOrder: "asc" },
    take: 200,
    include: { _count: { select: { products: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3">
        <h1 className="admin-h1">Collections</h1>
        <Link href="/admin/collections/new" className="btn-primary">
          New collection
        </Link>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Slug</th>
              <th>Products</th>
              <th>Sort</th>
              <th>Published</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <Link href={`/admin/collections/${row.id}`} className="underline">
                    {row.title}
                  </Link>
                </td>
                <td>{row.slug}</td>
                <td>{row._count.products}</td>
                <td>{row.sortOrder}</td>
                <td>
                  <span className="admin-badge">{row.published ? "Yes" : "No"}</span>
                </td>
                <td className="space-x-3">
                  <Link href={`/admin/collections/${row.id}`} className="text-xs underline">
                    Edit
                  </Link>
                  <CollectionPublishedToggle id={row.id} published={row.published} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
