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
      <h1 className="font-display text-4xl mb-8">Collections</h1>
      <CollectionCreateForm />
      <div className="overflow-x-auto border border-[color:var(--line)] bg-white/70">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[color:var(--line)] text-left">
              <th className="p-3">Title</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Sort</th>
              <th className="p-3">Published</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-[color:var(--line)]">
                <td className="p-3">{row.title}</td>
                <td className="p-3">{row.slug}</td>
                <td className="p-3">{row.sortOrder}</td>
                <td className="p-3">{row.published ? "Yes" : "No"}</td>
                <td className="p-3">
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
