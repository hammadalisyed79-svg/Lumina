import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/utils";
import {
  ShippingCreateForm,
  ShippingEditForm,
  type ShippingRow,
} from "@/components/admin/ShippingForm";

export const dynamic = "force-dynamic";

export default async function AdminShippingPage() {
  const rows = await prisma.shippingMethod.findMany({
    orderBy: { sortOrder: "asc" },
    take: 200,
  });

  const methods: ShippingRow[] = rows.map((m) => ({
    id: m.id,
    name: m.name,
    calcType: m.calcType,
    price: String(m.price),
    freeAbove: m.freeAbove != null ? String(m.freeAbove) : null,
    estimatedDays: m.estimatedDays,
    active: m.active,
    sortOrder: m.sortOrder,
  }));

  return (
    <div>
      <h1 className="admin-h1">Shipping</h1>
      <ShippingCreateForm />
      <div className="admin-table-wrap mt-8">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Calc type</th>
              <th>Price</th>
              <th>Free above</th>
              <th>Est. days</th>
              <th>Sort</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {methods.map((method) => (
              <tr key={method.id}>
                <td>{method.name}</td>
                <td>{method.calcType}</td>
                <td>{formatMoney(method.price)}</td>
                <td>{method.freeAbove ? formatMoney(method.freeAbove) : "—"}</td>
                <td>{method.estimatedDays ?? "—"}</td>
                <td>{method.sortOrder}</td>
                <td>
                  <span className="admin-badge">{method.active ? "Yes" : "No"}</span>
                </td>
                <td>
                  <ShippingEditForm method={method} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
