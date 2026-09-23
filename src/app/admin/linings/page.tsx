import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminLiningsPage() {
  const rows = await prisma.lining.findMany({
    
    orderBy: { sortOrder: 'asc' },
    take: 200,
  });

  return (
    <div>
      <h1 className="font-display text-4xl mb-8">Linings</h1>
      <div className="overflow-x-auto border border-[color:var(--line)] bg-white/70">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[color:var(--line)] text-left">
              <th className="p-3">name</th>
              <th className="p-3">slug</th>
              <th className="p-3">priceMod</th>
              <th className="p-3">active</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-[color:var(--line)]">
                <td className="p-3">{String((row as Record<string, unknown>).name ?? "")}</td>
                <td className="p-3">{String((row as Record<string, unknown>).slug ?? "")}</td>
                <td className="p-3">{String((row as Record<string, unknown>).priceMod ?? "")}</td>
                <td className="p-3">{String((row as Record<string, unknown>).active ?? "")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
