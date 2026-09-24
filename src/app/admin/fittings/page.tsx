import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/utils";
import { toNumber } from "@/lib/pricing";
import {
  FittingCreateForm,
  FittingEditForm,
  type FittingRow,
} from "@/components/admin/FittingForm";

export const dynamic = "force-dynamic";

export default async function AdminFittingsPage() {
  const rows = await prisma.fitting.findMany({
    orderBy: { sortOrder: "asc" },
    take: 200,
  });

  const fittings: FittingRow[] = rows.map((f) => ({
    id: f.id,
    name: f.name,
    slug: f.slug,
    description: f.description,
    imageUrl: f.imageUrl,
    compatibility: f.compatibility,
    priceMod: String(toNumber(f.priceMod)),
    active: f.active,
    sortOrder: f.sortOrder,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="admin-h1">Fittings</h1>
        <p className="text-sm text-[color:var(--admin-muted)] mt-1">
          Pendant, table and floor fittings for the studio.
        </p>
      </div>
      <FittingCreateForm />
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Compatibility</th>
              <th>Mod</th>
              <th>Sort</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {fittings.map((fitting) => (
              <tr key={fitting.id}>
                <td>
                  <div className="font-medium">{fitting.name}</div>
                  <div className="text-xs text-[color:var(--admin-muted)]">{fitting.slug}</div>
                </td>
                <td>{fitting.compatibility || "—"}</td>
                <td>{formatMoney(fitting.priceMod)}</td>
                <td>{fitting.sortOrder}</td>
                <td>
                  <span className="admin-badge">{fitting.active ? "Yes" : "No"}</span>
                </td>
                <td>
                  <FittingEditForm fitting={fitting} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
