import { prisma } from "@/lib/db";
import {
  InventoryAdjustForm,
  InventoryCreateForm,
  type InventoryRow,
} from "@/components/admin/InventoryForm";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  const rows = await prisma.inventoryItem.findMany({
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  const items: InventoryRow[] = rows.map((i) => ({
    id: i.id,
    sku: i.sku,
    name: i.name,
    kind: i.kind,
    available: i.available,
    reserved: i.reserved,
    reorderLevel: i.reorderLevel,
    trackStock: i.trackStock,
  }));

  return (
    <div>
      <h1 className="admin-h1">Inventory</h1>
      <p className="admin-muted mb-4">
        Track finished goods, kits, fabric and components. Adjust available counts inline; movements
        are logged automatically.
      </p>
      <InventoryCreateForm />
      <div className="admin-table-wrap mt-8">
        <table className="admin-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Name</th>
              <th>Kind</th>
              <th>Available</th>
              <th>Reserved</th>
              <th>Reorder</th>
              <th>Track</th>
              <th>Adjust</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td className="font-mono text-xs">{item.sku}</td>
                <td>{item.name}</td>
                <td>{item.kind}</td>
                <td>{item.available}</td>
                <td>{item.reserved}</td>
                <td>{item.reorderLevel}</td>
                <td>
                  <span className="admin-badge">{item.trackStock ? "Yes" : "No"}</span>
                </td>
                <td>
                  <InventoryAdjustForm item={item} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
