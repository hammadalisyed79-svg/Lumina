import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

export const dynamic = "force-dynamic";

export default async function HomepageAdminPage() {
  await requirePermission("content.view");
  const sections = await prisma.homepageSection.findMany({
    orderBy: { sortOrder: "asc" },
  });

  if (sections.length === 0) {
    return (
      <AdminPlaceholder
        title="Homepage"
        phase="Phase 10"
        description="Reorderable hero, shop-by-shape, editorial and newsletter sections will be managed here. No sections seeded yet."
      />
    );
  }

  return (
    <div>
      <h1 className="admin-h1">Homepage sections</h1>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Type</th>
              <th>Title</th>
              <th>Enabled</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((s) => (
              <tr key={s.id}>
                <td>{s.sortOrder}</td>
                <td>{s.type}</td>
                <td>{s.title || "—"}</td>
                <td>
                  <span className="admin-badge">{s.enabled ? "On" : "Off"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
