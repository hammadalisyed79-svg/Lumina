import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/utils";
import { ShapeCreateForm, ShapeEditForm, type ShapeRow } from "@/components/admin/ShapeForm";

export const dynamic = "force-dynamic";

export default async function AdminShapesPage() {
  const rows = await prisma.shape.findMany({
    orderBy: { sortOrder: "asc" },
    take: 200,
  });

  const shapes: ShapeRow[] = rows.map((s) => ({
    id: s.id,
    name: s.name,
    key: s.key,
    basePrice: String(s.basePrice),
    priceMod: String(s.priceMod),
    active: s.active,
    sortOrder: s.sortOrder,
    imageUrl: s.imageUrl,
  }));

  return (
    <div>
      <h1 className="admin-h1">Shapes</h1>
      <ShapeCreateForm />
      <div className="admin-table-wrap mt-8">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Key</th>
              <th>Base price</th>
              <th>Price mod</th>
              <th>Sort</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {shapes.map((shape) => (
              <tr key={shape.id}>
                <td>{shape.name}</td>
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
