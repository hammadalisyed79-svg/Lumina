import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/utils";
import { toNumber } from "@/lib/pricing";
import {
  SizeCreateForm,
  SizeEditForm,
  type ShapeOption,
  type SizeRow,
} from "@/components/admin/SizeForm";

export const dynamic = "force-dynamic";

export default async function AdminSizesPage() {
  const [rows, shapeRows] = await Promise.all([
    prisma.size.findMany({
      orderBy: { sortOrder: "asc" },
      take: 200,
      include: { shape: { select: { id: true, name: true, key: true } } },
    }),
    prisma.shape.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, key: true },
    }),
  ]);

  const shapes: ShapeOption[] = shapeRows;
  const sizes: SizeRow[] = rows.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    shapeId: s.shapeId,
    shapeName: s.shape?.name ?? null,
    diameterCm: s.diameterCm != null ? String(toNumber(s.diameterCm)) : null,
    heightCm: s.heightCm != null ? String(toNumber(s.heightCm)) : null,
    widthCm: s.widthCm != null ? String(toNumber(s.widthCm)) : null,
    depthCm: s.depthCm != null ? String(toNumber(s.depthCm)) : null,
    displayUnit: s.displayUnit,
    priceMod: String(toNumber(s.priceMod)),
    active: s.active,
    sortOrder: s.sortOrder,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="admin-h1">Sizes</h1>
        <p className="text-sm text-[color:var(--admin-muted)] mt-1">
          Dimensions and shape scoping for the design studio.
        </p>
      </div>
      <SizeCreateForm shapes={shapes} />
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Shape</th>
              <th>Dims</th>
              <th>Mod</th>
              <th>Sort</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sizes.map((size) => (
              <tr key={size.id}>
                <td>
                  <div className="font-medium">{size.name}</div>
                  <div className="text-xs text-[color:var(--admin-muted)]">{size.slug}</div>
                </td>
                <td>{size.shapeName || "Any"}</td>
                <td className="text-xs whitespace-nowrap">
                  {[
                    size.diameterCm != null ? `Ø ${size.diameterCm}` : null,
                    size.heightCm != null ? `H ${size.heightCm}` : null,
                    size.widthCm != null ? `W ${size.widthCm}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </td>
                <td>{formatMoney(size.priceMod)}</td>
                <td>{size.sortOrder}</td>
                <td>
                  <span className="admin-badge">{size.active ? "Yes" : "No"}</span>
                </td>
                <td>
                  <SizeEditForm size={size} shapes={shapes} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
