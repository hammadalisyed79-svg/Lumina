import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/utils";
import { ShapeCreateForm, ShapeEditForm, type ShapeRow } from "@/components/admin/ShapeForm";
import { ShapeEligibilityEditor } from "@/components/admin/ShapeEligibilityEditor";

export const dynamic = "force-dynamic";

export default async function AdminShapesPage() {
  const [rows, sizes, fabrics, linings, fittings, shapeSizes, shapeFabrics, shapeLinings, shapeFittings] =
    await Promise.all([
      prisma.shape.findMany({ orderBy: { sortOrder: "asc" }, take: 200 }),
      prisma.size.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
      prisma.fabric.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
      prisma.lining.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
      prisma.fitting.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
      prisma.shapeSize.findMany(),
      prisma.shapeFabric.findMany(),
      prisma.shapeLining.findMany(),
      prisma.shapeFitting.findMany(),
    ]);

  const sizeOpts = sizes.map((s) => ({ id: s.id, label: s.name }));
  const fabricOpts = fabrics.map((f) => ({ id: f.id, label: f.name }));
  const liningOpts = linings.map((l) => ({ id: l.id, label: l.name }));
  const fittingOpts = fittings.map((f) => ({ id: f.id, label: f.name }));

  const shapes: ShapeRow[] = rows.map((s) => ({
    id: s.id,
    name: s.name,
    key: s.key,
    basePrice: String(s.basePrice),
    priceMod: String(s.priceMod),
    active: s.active,
    sortOrder: s.sortOrder,
    imageUrl: s.imageUrl,
    description: s.description,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="admin-h1">Shapes</h1>
        <p className="text-sm text-[color:var(--admin-muted)] mt-1">
          Silhouettes for the design studio — manage size/fabric/lining/fitting eligibility per shape.
        </p>
      </div>
      <ShapeCreateForm />
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Key</th>
              <th>Base price</th>
              <th>Mod</th>
              <th>Sort</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {shapes.map((shape) => (
              <tr key={shape.id}>
                <td>
                  <div className="font-medium">{shape.name}</div>
                  {shape.description && (
                    <div className="text-xs text-[color:var(--admin-muted)] mt-0.5 line-clamp-1">
                      {shape.description}
                    </div>
                  )}
                  <div className="mt-2">
                    <ShapeEligibilityEditor
                      shapeId={shape.id}
                      shapeName={shape.name}
                      sizes={sizeOpts}
                      fabrics={fabricOpts}
                      linings={liningOpts}
                      fittings={fittingOpts}
                      selectedSizeIds={shapeSizes
                        .filter((r) => r.shapeId === shape.id)
                        .map((r) => r.sizeId)}
                      selectedFabricIds={shapeFabrics
                        .filter((r) => r.shapeId === shape.id)
                        .map((r) => r.fabricId)}
                      selectedLiningIds={shapeLinings
                        .filter((r) => r.shapeId === shape.id)
                        .map((r) => r.liningId)}
                      selectedFittingIds={shapeFittings
                        .filter((r) => r.shapeId === shape.id)
                        .map((r) => r.fittingId)}
                    />
                  </div>
                </td>
                <td>{shape.key}</td>
                <td>{formatMoney(shape.basePrice)}</td>
                <td>{formatMoney(shape.priceMod)}</td>
                <td>{shape.sortOrder}</td>
                <td>
                  <span className="admin-badge">{shape.active ? "Yes" : "No"}</span>
                </td>
                <td>
                  <ShapeEditForm shape={shape} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
