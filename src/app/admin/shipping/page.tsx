import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminShippingPage() {
  const rows = await prisma.shippingMethod.findMany({
    
    orderBy: { sortOrder: 'asc' },
    take: 200,
  });

  return (
    <div>
      <h1 className="font-display text-4xl mb-8">Shipping</h1>
      <div className="overflow-x-auto border border-[color:var(--line)] bg-white/70">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[color:var(--line)] text-left">
              <th className="p-3">name</th>
              <th className="p-3">calcType</th>
              <th className="p-3">price</th>
              <th className="p-3">active</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-[color:var(--line)]">
                <td className="p-3">{String((row as Record<string, unknown>).name ?? "")}</td>
                <td className="p-3">{String((row as Record<string, unknown>).calcType ?? "")}</td>
                <td className="p-3">{String((row as Record<string, unknown>).price ?? "")}</td>
                <td className="p-3">{String((row as Record<string, unknown>).active ?? "")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
