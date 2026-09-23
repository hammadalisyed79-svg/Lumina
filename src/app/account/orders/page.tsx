import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { formatMoney } from "@/lib/utils";
import { toNumber } from "@/lib/pricing";
import { COPY } from "@/lib/copy";
import { EmptyState } from "@/components/commerce/EmptyState";

export const dynamic = "force-dynamic";

function friendly(status: string) {
  return status.toLowerCase().replace(/_/g, " ");
}

export default async function AccountOrdersPage() {
  const session = await requireUser();
  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
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
          {orders.map((o) => (
            <li key={o.id} className="surface-panel p-5 md:p-6">
              <div className="flex flex-wrap justify-between gap-4">
                <div>
                  <Link
                    href={`/order/${o.orderNumber}`}
                    className="font-medium underline underline-offset-4 hover:text-bronze"
                  >
                    {o.orderNumber}
                  </Link>
                  <p className="text-sm text-muted mt-1.5">
                    {new Date(o.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {" · "}
                    {friendly(o.status)}
                    {" · "}
                    {friendly(o.paymentStatus)}
                    {" · "}
                    {o.items.length} {o.items.length === 1 ? "item" : "items"}
                  </p>
                </div>
                <p className="font-medium">{formatMoney(toNumber(o.total))}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
