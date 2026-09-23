import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/utils";
import { toNumber } from "@/lib/pricing";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";
import { OrderFulfillmentForm } from "@/components/admin/OrderFulfillmentForm";
import {
  formatConfigSnippet,
  orderBadgeClass,
  paymentBadgeClass,
} from "@/lib/admin/orders";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      events: { orderBy: { createdAt: "desc" }, take: 20 },
      shippingMethod: true,
    },
  });
  if (!order) notFound();

  return (
    <div>
      <div className="admin-no-print mb-4">
        <Link href="/admin/orders" className="admin-muted text-sm hover:underline">
          ← Orders
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6 admin-no-print">
        <div>
          <h1 className="admin-h1">{order.orderNumber}</h1>
          <p className="admin-muted">
            {order.email} · {order.createdAt.toLocaleString("en-GB")}
          </p>
          <div className="admin-actions mt-2">
            <span className={orderBadgeClass(order.status)}>{order.status}</span>
            <span className={paymentBadgeClass(order.paymentStatus)}>
              {order.paymentStatus}
            </span>
            <span className="admin-badge is-muted">{order.productionStatus}</span>
          </div>
        </div>
        <div className="admin-actions">
          <Link href={`/admin/orders/${order.id}/print`} className="btn-secondary">
            Packing note
          </Link>
          <Link href={`/order/${order.orderNumber}`} className="btn-quiet text-sm">
            Customer view
          </Link>
        </div>
      </div>

      <div className="admin-grid-2 mb-4">
        <div className="admin-panel">
          <h2 className="admin-h2">Ship to</h2>
          <p className="admin-body">
            {order.shippingName || "—"}
            <br />
            {order.shippingLine1}
            {order.shippingLine2 ? (
              <>
                <br />
                {order.shippingLine2}
              </>
            ) : null}
            <br />
            {[order.shippingCity, order.shippingCounty, order.shippingPostcode]
              .filter(Boolean)
              .join(", ")}
            <br />
            {order.shippingCountry || "GB"}
            {order.shippingPhone ? (
              <>
                <br />
                {order.shippingPhone}
              </>
            ) : null}
          </p>
          {order.shippingMethod && (
            <p className="admin-muted text-sm mt-3">
              Method: {order.shippingMethod.name} · {formatMoney(order.shippingTotal)}
            </p>
          )}
        </div>
        <div className="admin-panel">
          <h2 className="admin-h2">Payment</h2>
          <ul className="admin-body space-y-1 list-none p-0 m-0 text-sm">
            <li>Subtotal: {formatMoney(order.subtotal)}</li>
            <li>Shipping: {formatMoney(order.shippingTotal)}</li>
            <li>Discount: −{formatMoney(order.discountTotal)}</li>
            <li>Tax: {formatMoney(order.taxTotal)}</li>
            <li className="font-medium pt-2">Total: {formatMoney(order.total)}</li>
            {order.couponCode && <li className="admin-muted">Coupon: {order.couponCode}</li>}
            {order.stripePaymentIntent && (
              <li className="admin-muted break-all">PI: {order.stripePaymentIntent}</li>
            )}
          </ul>
          <div className="mt-4">
            <OrderStatusForm
              id={order.id}
              status={order.status}
              paymentStatus={order.paymentStatus}
            />
          </div>
        </div>
      </div>

      <div className="admin-panel mb-4">
        <h2 className="admin-h2">Line items</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>SKU</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Line</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((i) => (
                <tr key={i.id}>
                  <td>
                    {i.title}
                    {i.configJson ? (
                      <span className="admin-muted block text-xs">
                        {formatConfigSnippet(i.configJson)}
                      </span>
                    ) : null}
                  </td>
                  <td>{i.sku || "—"}</td>
                  <td>{i.quantity}</td>
                  <td>{formatMoney(toNumber(i.unitPrice))}</td>
                  <td>{formatMoney(toNumber(i.lineTotal))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-no-print mb-4">
        <OrderFulfillmentForm
          id={order.id}
          trackingProvider={order.trackingProvider}
          trackingNumber={order.trackingNumber}
          staffNotes={order.staffNotes}
          productionStatus={order.productionStatus}
        />
      </div>

      <div className="admin-panel admin-no-print">
        <h2 className="admin-h2">Timeline</h2>
        {order.events.length === 0 ? (
          <p className="admin-muted">No events yet.</p>
        ) : (
          <ul className="admin-body space-y-2 list-none p-0 m-0 text-sm">
            {order.events.map((e) => (
              <li key={e.id}>
                <span className="admin-muted">
                  {e.createdAt.toLocaleString("en-GB")} · {e.type}
                </span>
                <br />
                {e.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
