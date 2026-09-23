import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { RoleChangeForm } from "@/components/admin/RoleChangeForm";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await requirePermission("users.view");
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  const canEdit = session.user.role === "SUPER_ADMIN";

  return (
    <div>
      <h1 className="admin-h1">Users</h1>
      <p className="admin-muted mb-4">
        Role changes require SUPER_ADMIN. Staff cannot elevate themselves.
      </p>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
              {canEdit && <th>Change role</th>}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name || "—"}</td>
                <td>{u.email}</td>
                <td>
                  <span className="admin-badge">{u.role}</span>
                </td>
                <td>{u.createdAt.toISOString().slice(0, 10)}</td>
                {canEdit && (
                  <td>
                    <RoleChangeForm userId={u.id} currentRole={u.role} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
