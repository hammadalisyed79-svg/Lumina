import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const rows = await prisma.coupon.findMany({
    
    orderBy: { code: 'asc' },
    take: 200,
  });

  return (
    <div>
      <h1 className="font-display text-4xl mb-8">Coupons</h1>
      <div className="overflow-x-auto border border-[color:var(--line)] bg-white/70">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[color:var(--line)] text-left">
              <th className="p-3">code</th>
              <th className="p-3">type</th>
              <th className="p-3">value</th>
              <th className="p-3">active</th>
              <th className="p-3">usedCount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-[color:var(--line)]">
                <td className="p-3">{String((row as Record<string, unknown>).code ?? "")}</td>
                <td className="p-3">{String((row as Record<string, unknown>).type ?? "")}</td>
                <td className="p-3">{String((row as Record<string, unknown>).value ?? "")}</td>
                <td className="p-3">{String((row as Record<string, unknown>).active ?? "")}</td>
                <td className="p-3">{String((row as Record<string, unknown>).usedCount ?? "")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
