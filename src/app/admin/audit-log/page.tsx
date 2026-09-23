import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AuditLogPage() {
  await requirePermission("audit.view");
  const logs = await prisma.auditLog.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true, name: true } } },
  });

  return (
    <div>
      <h1 className="admin-h1">Audit log</h1>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>When</th>
              <th>User</th>
              <th>Action</th>
              <th>Entity</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="whitespace-nowrap">
                  {l.createdAt.toISOString().slice(0, 19).replace("T", " ")}
                </td>
                <td>{l.user?.email || "—"}</td>
                <td>{l.action}</td>
                <td>
                  {l.entity || "—"}
                  {l.entityId ? (
                    <span className="admin-muted"> · {l.entityId.slice(0, 8)}</span>
                  ) : null}
                </td>
                <td>{l.ip || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
