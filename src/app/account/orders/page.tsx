import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { formatMoney } from "@/lib/utils";
import { toNumber } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function AccountOrdersPage() {
  const session = await requireUser();
  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div className="container-site py-12 max-w-3xl">
      <Link href="/account" className="text-sm text-[color:var(--muted)]">← Account</Link>
      <h1 className="font-display text-4xl mt-4 mb-8">Orders</h1>
      {orders.length === 0 && <p className="prose-muted">No orders yet.</p>}
      <ul className="space-y-4">
        {orders.map((o) => (
          <li key={o.id} className="border border-[color:var(--line)] p-4 bg-white/50">
            <div className="flex justify-between gap-4">
              <div>
                <Link href={`/order/${o.orderNumber}`} className="font-medium underline">
                  {o.orderNumber}
                </Link>
                <p className="text-sm text-[color:var(--muted)] mt-1">
                  {o.status} · {o.paymentStatus} · {o.items.length} items
                </p>
              </div>
              <p>{formatMoney(toNumber(o.total))}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
