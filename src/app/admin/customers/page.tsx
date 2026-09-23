import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const rows = await prisma.user.findMany({
    where: { role: { in: ["CUSTOMER", "TRADE"] } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return (
    <div>
      <h1 className="admin-h1">Customers</h1>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>name</th>
              <th>email</th>
              <th>role</th>
              <th>createdAt</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{String((row as Record<string, unknown>).name ?? "")}</td>
                <td>{String((row as Record<string, unknown>).email ?? "")}</td>
                <td>
                  <span className="admin-badge">
                    {String((row as Record<string, unknown>).role ?? "")}
                  </span>
                </td>
                <td>{String((row as Record<string, unknown>).createdAt ?? "")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
