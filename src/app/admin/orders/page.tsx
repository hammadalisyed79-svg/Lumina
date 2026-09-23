import { prisma } from "@/lib/db";
import Link from "next/link";
import { formatMoney } from "@/lib/utils";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { items: true },
  });

  return (
    <div>
      <h1 className="admin-h1">Orders</h1>
      <div className="space-y-4">
        {orders.map((o) => (
          <div key={o.id} className="admin-panel">
            <div className="flex flex-wrap justify-between gap-3 mb-3">
              <div>
                <Link href={`/order/${o.orderNumber}`} className="font-medium underline">
                  {o.orderNumber}
                </Link>
                <p className="admin-muted text-sm">
                  {o.email} · {o.items.length} items · {formatMoney(o.total)}
                </p>
              </div>
              <OrderStatusForm
                id={o.id}
                status={o.status}
                paymentStatus={o.paymentStatus}
              />
            </div>
            <ul className="admin-muted text-xs space-y-1">
              {o.items.map((i) => (
                <li key={i.id}>
                  {i.quantity}× {i.title}
                  {i.configJson ? ` · ${JSON.stringify(i.configJson)}` : ""}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
