import { prisma } from "@/lib/db";
import Link from "next/link";
import {
  InventoryAdjustForm,
  InventoryCreateForm,
  type InventoryRow,
} from "@/components/admin/InventoryForm";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ low?: string }>;
};

export default async function AdminInventoryPage({ searchParams }: Props) {
  const sp = await searchParams;
  const lowOnly = sp.low === "1";

  const rows = await prisma.inventoryItem.findMany({
    where: lowOnly ? { trackStock: true } : undefined,
    orderBy: lowOnly ? { available: "asc" } : { updatedAt: "desc" },
    take: 200,
  });

  const filtered = lowOnly
    ? rows.filter((i) => i.available <= i.reorderLevel)
    : rows;

  const items: InventoryRow[] = filtered.map((i) => ({
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
      <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="admin-h1">Inventory</h1>
          <p className="admin-muted mb-0">
            Track finished goods, kits, fabric and components. Adjust available counts inline;
            movements are logged automatically.
          </p>
        </div>
        <div className="admin-filters mb-0">
          <Link
            href="/admin/inventory"
            className={`admin-filter-chip ${!lowOnly ? "active" : ""}`}
          >
            All
          </Link>
          <Link
            href="/admin/inventory?low=1"
            className={`admin-filter-chip ${lowOnly ? "active" : ""}`}
          >
            Low stock
          </Link>
        </div>
      </div>

      {!lowOnly && <InventoryCreateForm />}

      <div className={`admin-table-wrap ${lowOnly ? "" : "mt-8"}`}>
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
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="admin-muted">
                  {lowOnly
                    ? "No items at or below reorder level."
                    : "No inventory rows yet."}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td className="font-mono text-xs">{item.sku}</td>
                  <td>{item.name}</td>
                  <td>{item.kind}</td>
                  <td>
                    {item.available}
                    {item.trackStock && item.available <= item.reorderLevel ? (
                      <span className="admin-badge is-danger ml-2">Low</span>
                    ) : null}
                  </td>
                  <td>{item.reserved}</td>
                  <td>{item.reorderLevel}</td>
                  <td>
                    <span className="admin-badge">{item.trackStock ? "Yes" : "No"}</span>
                  </td>
                  <td>
                    <InventoryAdjustForm item={item} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
