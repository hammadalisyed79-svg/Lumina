import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function EnquiriesPage() {
  await requirePermission("enquiries.view");
  const rows = await prisma.contactEnquiry.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="admin-h1">Contact enquiries</h1>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Name</th>
              <th>Email</th>
              <th>Subject</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="admin-muted">
                  No contact enquiries yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.createdAt.toISOString().slice(0, 16).replace("T", " ")}</td>
                  <td>{r.name}</td>
                  <td>{r.email}</td>
                  <td>{r.subject || "—"}</td>
                  <td>
                    <span className="admin-badge">{r.status}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
