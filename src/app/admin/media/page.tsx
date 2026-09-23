import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  const rows = await prisma.mediaAsset.findMany({
    
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return (
    <div>
      <h1 className="admin-h1">Media</h1>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>key</th>
              <th>url</th>
              <th>provider</th>
              <th>createdAt</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{String((row as Record<string, unknown>).key ?? "")}</td>
                <td>{String((row as Record<string, unknown>).url ?? "")}</td>
                <td>{String((row as Record<string, unknown>).provider ?? "")}</td>
                <td>{String((row as Record<string, unknown>).createdAt ?? "")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
