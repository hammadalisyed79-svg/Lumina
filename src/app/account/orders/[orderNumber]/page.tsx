import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/utils";
import { toNumber } from "@/lib/pricing";
import { CommerceTrust } from "@/components/commerce/CommerceTrust";
import { OrderTrackingPanel } from "@/components/commerce/OrderTrackingPanel";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ orderNumber: string }> };

function formatConfig(configJson: unknown): string | null {
  if (!configJson || typeof configJson !== "object") return null;
  const c = configJson as Record<string, unknown>;
  const parts = [
    c.shapeName || c.shapeKey,
    c.fabricName || c.fabricSlug,
    c.sizeName || c.sizeSlug,
    c.liningName || c.liningSlug,
    c.fittingName || c.fittingSlug,
  ]
    .filter((x) => typeof x === "string" && x)
    .map(String);
  return parts.length ? parts.join(" · ") : null;
}

function friendly(status: string) {
  return status.toLowerCase().replace(/_/g, " ");
}

export default async function AccountOrderDetailPage({ params }: Props) {
  const session = await requireUser();
  const { orderNumber } = await params;

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true, shippingMethod: true },
  });
  if (!order) notFound();

  const owns =
    order.userId === session.user.id ||
    (session.user.email &&
      order.email.toLowerCase() === session.user.email.toLowerCase());
  if (!owns) redirect("/account/orders");

  return (
    <div className="container-site section-pad max-w-2xl">
      <nav className="page-crumb">
        <Link href="/account">Account</Link>
        <span className="mx-2 text-line">/</span>
        <Link href="/account/orders">Orders</Link>
        <span className="mx-2 text-line">/</span>
        <span className="text-ink">{order.orderNumber}</span>
      </nav>

      <header className="mb-8">
        <p className="eyebrow mb-3">Your order</p>
        <h1 className="section-title mb-3">{order.orderNumber}</h1>
        <div className="lux-rule" />
        <p className="prose-muted">
          {order.createdAt.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          {" · "}
          Payment {friendly(order.paymentStatus)}
          {" · "}
          {friendly(order.status)}
        </p>
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
            const config = formatConfig(item.configJson);
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

      {(order.shippingName || order.shippingLine1) && (
        <div className="surface-panel p-6 md:p-8 mb-8">
          <p className="eyebrow mb-3">Ship to</p>
          <p className="text-sm leading-relaxed">
            {order.shippingName}
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
          </p>
          {order.shippingMethod && (
            <p className="text-xs text-muted mt-3">{order.shippingMethod.name}</p>
          )}
        </div>
      )}

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

      <div className="mb-8">
        <CommerceTrust />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/account/orders" className="btn-secondary">
          All orders
        </Link>
        <Link href={`/order/${order.orderNumber}`} className="btn-quiet">
          Public confirmation
        </Link>
        <Link href="/contact" className="btn-quiet">
          Contact studio
        </Link>
      </div>
    </div>
  );
}
