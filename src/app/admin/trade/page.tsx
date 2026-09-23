import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminTradePage() {
  const rows = await prisma.tradeApplication.findMany({
    
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return (
    <div>
      <h1 className="admin-h1">Trade</h1>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>businessName</th>
              <th>email</th>
              <th>status</th>
              <th>createdAt</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{String((row as Record<string, unknown>).businessName ?? "")}</td>
                <td>{String((row as Record<string, unknown>).email ?? "")}</td>
                <td>
                  <span className="admin-badge">
                    {String((row as Record<string, unknown>).status ?? "")}
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
