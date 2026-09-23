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
      <h1 className="font-display text-4xl mb-8">Shipping</h1>
      <ShippingCreateForm />
      <div className="overflow-x-auto border border-[color:var(--line)] bg-white/70">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[color:var(--line)] text-left">
              <th className="p-3">Name</th>
              <th className="p-3">Calc type</th>
              <th className="p-3">Price</th>
              <th className="p-3">Free above</th>
              <th className="p-3">Est. days</th>
              <th className="p-3">Sort</th>
              <th className="p-3">Active</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {methods.map((method) => (
              <tr key={method.id} className="border-b border-[color:var(--line)]">
                <td className="p-3">{method.name}</td>
                <td className="p-3">{method.calcType}</td>
                <td className="p-3">{formatMoney(method.price)}</td>
                <td className="p-3">{method.freeAbove ? formatMoney(method.freeAbove) : "—"}</td>
                <td className="p-3">{method.estimatedDays ?? "—"}</td>
                <td className="p-3">{method.sortOrder}</td>
                <td className="p-3">{method.active ? "Yes" : "No"}</td>
                <td className="p-3">
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
