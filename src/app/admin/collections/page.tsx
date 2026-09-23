import { prisma } from "@/lib/db";
import {
  CollectionCreateForm,
  CollectionPublishedToggle,
} from "@/components/admin/CollectionForm";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage() {
  const rows = await prisma.collection.findMany({
    orderBy: { sortOrder: "asc" },
    take: 200,
  });

  return (
    <div>
      <h1 className="admin-h1">Collections</h1>
      <CollectionCreateForm />
      <div className="admin-table-wrap mt-8">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Slug</th>
              <th>Sort</th>
              <th>Published</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.title}</td>
                <td>{row.slug}</td>
                <td>{row.sortOrder}</td>
                <td>
                  <span className="admin-badge">{row.published ? "Yes" : "No"}</span>
                </td>
                <td>
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
