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
      <h1 className="font-display text-4xl mb-8">Shapes</h1>
      <ShapeCreateForm />
      <div className="overflow-x-auto border border-[color:var(--line)] bg-white/70 mt-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[color:var(--line)] text-left">
              <th className="p-3">Name</th>
              <th className="p-3">Key</th>
              <th className="p-3">Base price</th>
              <th className="p-3">Price mod</th>
              <th className="p-3">Sort</th>
              <th className="p-3">Active</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shapes.map((shape) => (
              <tr key={shape.id} className="border-b border-[color:var(--line)]">
                <td className="p-3">{shape.name}</td>
                <td className="p-3">{shape.key}</td>
                <td className="p-3">{formatMoney(shape.basePrice)}</td>
                <td className="p-3">{formatMoney(shape.priceMod)}</td>
                <td className="p-3">{shape.sortOrder}</td>
                <td className="p-3">{shape.active ? "Yes" : "No"}</td>
                <td className="p-3">
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
