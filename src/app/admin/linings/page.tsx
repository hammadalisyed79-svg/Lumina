import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/utils";
import { toNumber } from "@/lib/pricing";
import { LiningCreateForm, LiningEditForm, type LiningRow } from "@/components/admin/LiningForm";

export const dynamic = "force-dynamic";

export default async function AdminLiningsPage() {
  const rows = await prisma.lining.findMany({
    orderBy: { sortOrder: "asc" },
    take: 200,
  });

  const linings: LiningRow[] = rows.map((l) => ({
    id: l.id,
    name: l.name,
    slug: l.slug,
    colour: l.colour,
    swatchUrl: l.swatchUrl,
    description: l.description,
    priceMod: String(toNumber(l.priceMod)),
    active: l.active,
    sortOrder: l.sortOrder,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="admin-h1">Linings</h1>
        <p className="text-sm text-[color:var(--admin-muted)] mt-1">
          Interior linings shown in the design studio.
        </p>
      </div>
      <LiningCreateForm />
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Colour</th>
              <th>Mod</th>
              <th>Sort</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {linings.map((lining) => (
              <tr key={lining.id}>
                <td>
                  <div className="font-medium">{lining.name}</div>
                  <div className="text-xs text-[color:var(--admin-muted)]">{lining.slug}</div>
                </td>
                <td>{lining.colour || "—"}</td>
                <td>{formatMoney(lining.priceMod)}</td>
                <td>{lining.sortOrder}</td>
                <td>
                  <span className="admin-badge">{lining.active ? "Yes" : "No"}</span>
                </td>
                <td>
                  <LiningEditForm lining={lining} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
