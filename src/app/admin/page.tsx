import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/utils";
import { toNumber } from "@/lib/pricing";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [orders, products, customers, pendingReviews, tradePending, bespokeNew, revenue] =
    await Promise.all([
      prisma.order.count(),
      prisma.product.count({ where: { published: true } }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.review.count({ where: { status: "PENDING" } }),
      prisma.tradeApplication.count({ where: { status: "PENDING" } }),
      prisma.bespokeEnquiry.count({ where: { status: "NEW" } }),
      prisma.order.aggregate({
        where: { paymentStatus: "PAID" },
        _sum: { total: true },
      }),
    ]);

  const recent = await prisma.order.findMany({
    take: 8,
    orderBy: { createdAt: "desc" },
  });

  const cards = [
    { label: "Orders", value: String(orders), href: "/admin/orders" },
    { label: "Products", value: String(products), href: "/admin/products" },
    { label: "Customers", value: String(customers), href: "/admin/customers" },
    {
      label: "Paid revenue",
      value: formatMoney(toNumber(revenue._sum.total || 0)),
      href: "/admin/orders",
    },
    { label: "Reviews pending", value: String(pendingReviews), href: "/admin/reviews" },
    { label: "Trade pending", value: String(tradePending), href: "/admin/trade" },
    { label: "Bespoke new", value: String(bespokeNew), href: "/admin/bespoke" },
  ];

  return (
    <div>
      <h1 className="font-display text-4xl mb-8">Dashboard</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="border border-[color:var(--line)] bg-white/70 p-5 hover:border-[color:var(--bronze)]"
          >
            <p className="eyebrow mb-2">{c.label}</p>
            <p className="font-display text-3xl">{c.value}</p>
          </Link>
        ))}
      </div>
      <h2 className="font-display text-2xl mb-4">Recent orders</h2>
      <div className="overflow-x-auto border border-[color:var(--line)] bg-white/70">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[color:var(--line)] text-left">
              <th className="p-3">Order</th>
              <th className="p-3">Email</th>
              <th className="p-3">Status</th>
              <th className="p-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((o) => (
              <tr key={o.id} className="border-b border-[color:var(--line)]">
                <td className="p-3">
                  <Link href={`/admin/orders/${o.id}`} className="underline">
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="p-3">{o.email}</td>
                <td className="p-3">
                  {o.status} / {o.paymentStatus}
                </td>
                <td className="p-3">{formatMoney(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
