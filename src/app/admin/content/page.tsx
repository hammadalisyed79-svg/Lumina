import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  await requirePermission("content.view");
  const pages = await prisma.cmsPage.findMany({ orderBy: { updatedAt: "desc" } });

  return (
    <div>
      <h1 className="admin-h1">Content</h1>
      <p className="admin-muted mb-4">
        CMS page records. Full editable marketing content expands in Phase 10.
      </p>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Slug</th>
              <th>Published</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => (
              <tr key={p.id}>
                <td>{p.title}</td>
                <td>{p.slug}</td>
                <td>
                  <span className="admin-badge">{p.published ? "Yes" : "No"}</span>
                </td>
                <td>{p.updatedAt.toISOString().slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
