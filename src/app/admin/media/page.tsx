import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  const rows = await prisma.mediaAsset.findMany({
    
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return (
    <div>
      <h1 className="font-display text-4xl mb-8">Media</h1>
      <div className="overflow-x-auto border border-[color:var(--line)] bg-white/70">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[color:var(--line)] text-left">
              <th className="p-3">key</th>
              <th className="p-3">url</th>
              <th className="p-3">provider</th>
              <th className="p-3">createdAt</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-[color:var(--line)]">
                <td className="p-3">{String((row as Record<string, unknown>).key ?? "")}</td>
                <td className="p-3">{String((row as Record<string, unknown>).url ?? "")}</td>
                <td className="p-3">{String((row as Record<string, unknown>).provider ?? "")}</td>
                <td className="p-3">{String((row as Record<string, unknown>).createdAt ?? "")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
