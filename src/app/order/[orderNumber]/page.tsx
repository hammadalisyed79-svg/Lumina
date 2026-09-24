import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/utils";
import { toNumber } from "@/lib/pricing";
import { CommerceTrust } from "@/components/commerce/CommerceTrust";
import { PurchaseTracker } from "@/components/analytics/PurchaseTracker";
import { OrderTrackingPanel } from "@/components/commerce/OrderTrackingPanel";
import {
  formatOrderConfig,
  formatOrderStatus,
  formatPaymentStatus,
} from "@/lib/orders/customer";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ success?: string }>;
};

export default async function OrderConfirmationPage({ params, searchParams }: Props) {
  const { orderNumber } = await params;
  const sp = await searchParams;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });
  if (!order) notFound();

  const paid = order.paymentStatus === "PAID";
  const firePurchase = Boolean(sp.success) || paid;

  return (
    <div className="container-site section-pad max-w-2xl">
      <PurchaseTracker
        fire={firePurchase}
        orderNumber={order.orderNumber}
        value={toNumber(order.total)}
        items={order.items.map((i) => ({
          item_id: i.productId || i.sku || i.id,
          item_name: i.title,
          price: toNumber(i.unitPrice),
          quantity: i.quantity,
        }))}
      />
      <header className="mb-10">
        <p className="eyebrow mb-3 text-bronze">
          {sp.success || paid ? "Confirmed" : "Order received"}
        </p>
        <h1 className="section-title mb-3">
          {sp.success || paid ? "Thank you" : "Order details"}
        </h1>
        <div className="lux-rule" />
        <p className="prose-muted">
          Order <span className="text-ink font-medium">{order.orderNumber}</span>
          {" · "}
          Payment {formatPaymentStatus(order.paymentStatus)}
          {" · "}
          {formatOrderStatus(order.status)}
        </p>
        {(sp.success || paid) && (
          <p className="prose-muted mt-3 text-sm">
            A confirmation email is on its way to {order.email}. Made-to-order pieces begin in the
            studio after payment clears.
          </p>
        )}
      </header>

      <OrderTrackingPanel
        status={order.status}
        paymentStatus={order.paymentStatus}
        productionStatus={order.productionStatus}
        trackingProvider={order.trackingProvider}
        trackingNumber={order.trackingNumber}
        dispatchedAt={order.dispatchedAt}
      />

      <div className="surface-panel p-6 md:p-8 mb-8">
        <p className="eyebrow mb-4">Items</p>
        <ul className="space-y-5">
          {order.items.map((item) => {
            const config = formatOrderConfig(item.configJson);
            return (
              <li key={item.id} className="border-b border-line last:border-0 pb-5 last:pb-0">
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="font-medium">
                      {item.quantity}× {item.title}
                    </p>
                    {config && (
                      <p className="text-xs text-muted mt-1.5 leading-relaxed">{config}</p>
                    )}
                  </div>
                  <p className="shrink-0">{formatMoney(toNumber(item.lineTotal))}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="space-y-2 text-sm mb-8 max-w-sm">
        <div className="flex justify-between">
          <span className="text-muted">Subtotal</span>
          <span>{formatMoney(order.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Shipping</span>
          <span>{formatMoney(order.shippingTotal)}</span>
        </div>
        {toNumber(order.discountTotal) > 0 && (
          <div className="flex justify-between">
            <span className="text-muted">Discount</span>
            <span>−{formatMoney(order.discountTotal)}</span>
          </div>
        )}
        <div className="divider my-2" />
        <div className="flex justify-between font-medium text-base">
          <span>Total</span>
          <span>{formatMoney(order.total)}</span>
        </div>
      </div>

      <div className="mb-10">
        <CommerceTrust />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/shop/lampshades" className="btn-primary">
          Continue shopping
        </Link>
        <Link href="/account/orders" className="btn-secondary">
          Your orders
        </Link>
        <Link href="/contact" className="btn-quiet">
          Contact studio
        </Link>
      </div>
    </div>
  );
}
