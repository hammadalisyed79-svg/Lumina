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
      <h1 className="font-display text-4xl mb-8">Inventory</h1>
      <p className="text-sm text-[color:var(--muted)] mb-6">
        Track finished goods, kits, fabric and components. Adjust available counts inline; movements
        are logged automatically.
      </p>
      <InventoryCreateForm />
      <div className="overflow-x-auto border border-[color:var(--line)] bg-white/70">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[color:var(--line)] text-left">
              <th className="p-3">SKU</th>
              <th className="p-3">Name</th>
              <th className="p-3">Kind</th>
              <th className="p-3">Available</th>
              <th className="p-3">Reserved</th>
              <th className="p-3">Reorder</th>
              <th className="p-3">Track</th>
              <th className="p-3">Adjust</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-[color:var(--line)]">
                <td className="p-3 font-mono text-xs">{item.sku}</td>
                <td className="p-3">{item.name}</td>
                <td className="p-3">{item.kind}</td>
                <td className="p-3">{item.available}</td>
                <td className="p-3">{item.reserved}</td>
                <td className="p-3">{item.reorderLevel}</td>
                <td className="p-3">{item.trackStock ? "Yes" : "No"}</td>
                <td className="p-3">
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
