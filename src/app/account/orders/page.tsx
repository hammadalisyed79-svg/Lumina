import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { formatMoney } from "@/lib/utils";
import { toNumber } from "@/lib/pricing";
import { COPY } from "@/lib/copy";
import { EmptyState } from "@/components/commerce/EmptyState";
import {
  formatOrderStatus,
  formatPaymentStatus,
  orderStatusTone,
} from "@/lib/orders/customer";

export const dynamic = "force-dynamic";

export default async function AccountOrdersPage() {
  const session = await requireUser();
  const email = session.user.email?.toLowerCase();

  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        ...(email ? [{ email: { equals: email, mode: "insensitive" as const } }] : []),
      ],
    },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div className="container-site section-pad max-w-3xl">
      <nav className="page-crumb">
        <Link href="/account">Account</Link>
        <span className="mx-2 text-line">/</span>
        <span className="text-ink">Orders</span>
      </nav>
      <header className="mb-10">
        <p className="eyebrow mb-3">Account</p>
        <h1 className="section-title mb-3">Orders</h1>
        <div className="lux-rule" />
        <p className="prose-muted">Track studio progress and delivery for each order.</p>
      </header>

      {orders.length === 0 ? (
        <EmptyState
          eyebrow="History"
          title={COPY.ordersEmpty.title}
          body={COPY.ordersEmpty.body}
          primary={{ href: "/shop/lampshades", label: COPY.ordersEmpty.cta }}
          secondary={{ href: "/design-your-shade", label: "Design a shade" }}
        />
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => {
            const tone = orderStatusTone(o.status);
            return (
              <li key={o.id} className="surface-panel p-5 md:p-6">
                <div className="flex flex-wrap justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Link
                        href={`/account/orders/${o.orderNumber}`}
                        className="font-medium underline underline-offset-4 hover:text-bronze"
                      >
                        {o.orderNumber}
                      </Link>
                      <span className={`order-status-chip is-${tone}`}>
                        {formatOrderStatus(o.status)}
                      </span>
                    </div>
                    <p className="text-sm text-muted">
                      {new Date(o.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                      {" · "}
                      {formatPaymentStatus(o.paymentStatus)}
                      {" · "}
                      {o.items.length} {o.items.length === 1 ? "item" : "items"}
                    </p>
                    {o.trackingNumber && (
                      <p className="text-xs text-muted mt-2">
                        Tracking
                        {o.trackingProvider ? ` (${o.trackingProvider})` : ""}:{" "}
                        <span className="font-mono text-ink">{o.trackingNumber}</span>
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-medium">{formatMoney(toNumber(o.total))}</p>
                    <Link
                      href={`/account/orders/${o.orderNumber}`}
                      className="text-xs underline underline-offset-4 text-muted hover:text-bronze mt-2 inline-block"
                    >
                      View progress
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
