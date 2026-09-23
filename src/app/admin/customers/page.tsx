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
      <h1 className="font-display text-4xl mb-8">Customers</h1>
      <div className="overflow-x-auto border border-[color:var(--line)] bg-white/70">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[color:var(--line)] text-left">
              <th className="p-3">name</th>
              <th className="p-3">email</th>
              <th className="p-3">role</th>
              <th className="p-3">createdAt</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-[color:var(--line)]">
                <td className="p-3">{String((row as Record<string, unknown>).name ?? "")}</td>
                <td className="p-3">{String((row as Record<string, unknown>).email ?? "")}</td>
                <td className="p-3">{String((row as Record<string, unknown>).role ?? "")}</td>
                <td className="p-3">{String((row as Record<string, unknown>).createdAt ?? "")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
