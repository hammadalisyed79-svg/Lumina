import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/utils";
import { toNumber } from "@/lib/pricing";
import { FabricCreateForm, FabricEditForm, type FabricRow } from "@/components/admin/FabricForm";

export const dynamic = "force-dynamic";

export default async function AdminFabricsPage() {
  const rows = await prisma.fabric.findMany({
    orderBy: { sortOrder: "asc" },
    take: 200,
  });

  const fabrics: FabricRow[] = rows.map((f) => ({
    id: f.id,
    name: f.name,
    slug: f.slug,
    internalCode: f.internalCode,
    description: f.description,
    colour: f.colour,
    material: f.material,
    pattern: f.pattern,
    imageUrl: f.imageUrl,
    swatchUrl: f.swatchUrl,
    textureImage: f.textureImage,
    patternScale: f.patternScale,
    patternOffsetX: f.patternOffsetX,
    patternOffsetY: f.patternOffsetY,
    patternRotation: f.patternRotation,
    repeatMode: f.repeatMode,
    usableAsTexture: f.usableAsTexture,
    priceMod: String(toNumber(f.priceMod)),
    stockQty: f.stockQty,
    active: f.active,
    sortOrder: f.sortOrder,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="admin-h1">Fabrics</h1>
        <p className="text-sm text-[color:var(--admin-muted)] mt-1">
          Cloth options for the studio swatch grid and product links.
        </p>
      </div>
      <FabricCreateForm />
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Material</th>
              <th>Colour</th>
              <th>Mod</th>
              <th>Sort</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {fabrics.map((fabric) => (
              <tr key={fabric.id}>
                <td>
                  <div className="font-medium">{fabric.name}</div>
                  <div className="text-xs text-[color:var(--admin-muted)]">{fabric.slug}</div>
                </td>
                <td>{fabric.material || "—"}</td>
                <td>{fabric.colour || "—"}</td>
                <td>{formatMoney(fabric.priceMod)}</td>
                <td>{fabric.sortOrder}</td>
                <td>
                  <span className="admin-badge">{fabric.active ? "Yes" : "No"}</span>
                </td>
                <td>
                  <FabricEditForm fabric={fabric} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
