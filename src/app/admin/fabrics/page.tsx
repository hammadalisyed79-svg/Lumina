import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminFabricsPage() {
  const rows = await prisma.fabric.findMany({
    
    orderBy: { sortOrder: 'asc' },
    take: 200,
  });

  return (
    <div>
      <h1 className="admin-h1">Fabrics</h1>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>name</th>
              <th>slug</th>
              <th>colour</th>
              <th>priceMod</th>
              <th>active</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{String((row as Record<string, unknown>).name ?? "")}</td>
                <td>{String((row as Record<string, unknown>).slug ?? "")}</td>
                <td>{String((row as Record<string, unknown>).colour ?? "")}</td>
                <td>{String((row as Record<string, unknown>).priceMod ?? "")}</td>
                <td>
                  <span className="admin-badge">
                    {String((row as Record<string, unknown>).active ?? "")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
