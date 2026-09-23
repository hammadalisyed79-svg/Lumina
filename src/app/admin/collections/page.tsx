import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage() {
  const rows = await prisma.collection.findMany({
    
    orderBy: { sortOrder: 'asc' },
    take: 200,
  });

  return (
    <div>
      <h1 className="font-display text-4xl mb-8">Collections</h1>
      <div className="overflow-x-auto border border-[color:var(--line)] bg-white/70">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[color:var(--line)] text-left">
              <th className="p-3">title</th>
              <th className="p-3">slug</th>
              <th className="p-3">published</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-[color:var(--line)]">
                <td className="p-3">{String((row as Record<string, unknown>).title ?? "")}</td>
                <td className="p-3">{String((row as Record<string, unknown>).slug ?? "")}</td>
                <td className="p-3">{String((row as Record<string, unknown>).published ?? "")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
