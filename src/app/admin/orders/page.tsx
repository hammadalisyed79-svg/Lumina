import { prisma } from "@/lib/db";
import Link from "next/link";
import { formatMoney } from "@/lib/utils";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";
import {
  formatConfigSnippet,
  orderBadgeClass,
  paymentBadgeClass,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
} from "@/lib/admin/orders";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    status?: string;
    payment?: string;
    q?: string;
  }>;
};

export default async function AdminOrdersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const where: Prisma.OrderWhereInput = {};
  if (sp.status && ORDER_STATUSES.includes(sp.status as (typeof ORDER_STATUSES)[number])) {
    where.status = sp.status as (typeof ORDER_STATUSES)[number];
  }
  if (sp.payment && PAYMENT_STATUSES.includes(sp.payment as (typeof PAYMENT_STATUSES)[number])) {
    where.paymentStatus = sp.payment as (typeof PAYMENT_STATUSES)[number];
  }
  if (sp.q?.trim()) {
    const q = sp.q.trim();
    where.OR = [
      { orderNumber: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { shippingName: { contains: q, mode: "insensitive" } },
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { items: true },
  });

  function href(next: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { status: sp.status, payment: sp.payment, q: sp.q, ...next };
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v);
    }
    const s = params.toString();
    return s ? `/admin/orders?${s}` : "/admin/orders";
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="admin-h1">Orders</h1>
          <p className="admin-muted mb-0">
            {orders.length} shown{sp.status || sp.payment || sp.q ? " (filtered)" : ""}
          </p>
        </div>
        <form className="admin-actions" method="get">
          {sp.status && <input type="hidden" name="status" value={sp.status} />}
          {sp.payment && <input type="hidden" name="payment" value={sp.payment} />}
          <input
            name="q"
            defaultValue={sp.q || ""}
            placeholder="Search order / email"
            className="admin-input"
            style={{ width: 220 }}
          />
          <button type="submit" className="btn-secondary text-sm">
            Search
          </button>
        </form>
      </div>

      <div className="admin-filters">
        <Link href={href({ status: undefined })} className={`admin-filter-chip ${!sp.status ? "active" : ""}`}>
          All status
        </Link>
        {["AWAITING_PAYMENT", "PAID", "PROCESSING", "PACKED", "SHIPPED", "CANCELLED"].map((s) => (
          <Link
            key={s}
            href={href({ status: s })}
            className={`admin-filter-chip ${sp.status === s ? "active" : ""}`}
          >
            {s}
          </Link>
        ))}
      </div>
      <div className="admin-filters">
        <Link href={href({ payment: undefined })} className={`admin-filter-chip ${!sp.payment ? "active" : ""}`}>
          All payment
        </Link>
        {["UNPAID", "PENDING", "PAID", "FAILED"].map((s) => (
          <Link
            key={s}
            href={href({ payment: s })}
            className={`admin-filter-chip ${sp.payment === s ? "active" : ""}`}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Total</th>
              <th>Quick update</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="admin-muted">
                  No orders match these filters.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/admin/orders/${o.id}`} className="underline font-medium">
                      {o.orderNumber}
                    </Link>
                    <p className="admin-muted text-xs mt-1">
                      {o.createdAt.toLocaleDateString("en-GB")}
                    </p>
                  </td>
                  <td>
                    <p>{o.email}</p>
                    {o.shippingName && (
                      <p className="admin-muted text-xs">{o.shippingName}</p>
                    )}
                  </td>
                  <td className="text-xs">
                    {o.items.slice(0, 2).map((i) => (
                      <p key={i.id}>
                        {i.quantity}× {i.title}
                        {i.configJson ? (
                          <span className="admin-muted block">
                            {formatConfigSnippet(i.configJson)}
                          </span>
                        ) : null}
                      </p>
                    ))}
                    {o.items.length > 2 && (
                      <p className="admin-muted">+{o.items.length - 2} more</p>
                    )}
                  </td>
                  <td>
                    <span className={orderBadgeClass(o.status)}>{o.status}</span>
                  </td>
                  <td>
                    <span className={paymentBadgeClass(o.paymentStatus)}>{o.paymentStatus}</span>
                  </td>
                  <td>{formatMoney(o.total)}</td>
                  <td>
                    <OrderStatusForm
                      id={o.id}
                      status={o.status}
                      paymentStatus={o.paymentStatus}
                    />
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
