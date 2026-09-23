import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function NewsletterPage() {
  await requirePermission("newsletter.view");
  const rows = await prisma.newsletterSubscriber.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <h1 className="admin-h1">Newsletter</h1>
      <p className="admin-muted mb-4">{rows.length} subscribers (CSV export in a later phase).</p>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Status</th>
              <th>Source</th>
              <th>Subscribed</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.email}</td>
                <td>
                  <span className="admin-badge">{r.status}</span>
                </td>
                <td>{r.source || "—"}</td>
                <td>{r.createdAt.toISOString().slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
