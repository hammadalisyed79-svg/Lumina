import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/utils";
import { toNumber } from "@/lib/pricing";
import Link from "next/link";
import {
  endOfDay,
  startOfDay,
  startOfYear,
  subDays,
  eachDayOfInterval,
  format,
} from "date-fns";
import { orderBadgeClass, paymentBadgeClass } from "@/lib/admin/orders";

export const dynamic = "force-dynamic";

type RangeKey = "today" | "7d" | "30d" | "90d" | "ytd" | "custom";

function resolveRange(sp: {
  range?: string;
  from?: string;
  to?: string;
}): { key: RangeKey; from: Date; to: Date; label: string } {
  const now = new Date();
  const to = sp.to ? endOfDay(new Date(sp.to)) : endOfDay(now);
  const key = (sp.range as RangeKey) || "30d";

  if (key === "custom" && sp.from) {
    return {
      key: "custom",
      from: startOfDay(new Date(sp.from)),
      to,
      label: "Custom",
    };
  }
  if (key === "today") {
    return { key, from: startOfDay(now), to: endOfDay(now), label: "Today" };
  }
  if (key === "7d") {
    return { key, from: startOfDay(subDays(now, 6)), to: endOfDay(now), label: "7 days" };
  }
  if (key === "90d") {
    return { key, from: startOfDay(subDays(now, 89)), to: endOfDay(now), label: "90 days" };
  }
  if (key === "ytd") {
    return { key, from: startOfYear(now), to: endOfDay(now), label: "This year" };
  }
  return { key: "30d", from: startOfDay(subDays(now, 29)), to: endOfDay(now), label: "30 days" };
}

function Sparkline({
  points,
  max,
}: {
  points: { x: number; y: number }[];
  max: number;
}) {
  const w = 400;
  const h = 140;
  const pad = 8;
  if (!points.length || max <= 0) {
    return (
      <svg className="admin-chart" viewBox={`0 0 ${w} ${h}`}>
        <text x={pad} y={h / 2} fill="#9ca3af" fontSize="12">
          No paid sales in this range
        </text>
      </svg>
    );
  }
  const coords = points
    .map((p, i) => {
      const x = pad + (i / Math.max(points.length - 1, 1)) * (w - pad * 2);
      const y = h - pad - (p.y / max) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg className="admin-chart" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline fill="none" stroke="#111827" strokeWidth="2" points={coords} />
    </svg>
  );
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const range = resolveRange(sp);
  const paidWhere = {
    paymentStatus: "PAID" as const,
    createdAt: { gte: range.from, lte: range.to },
  };

  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const monthStart = startOfDay(subDays(new Date(), 29));

  const [
    todaySales,
    todayOrders,
    todayCustomers,
    rangeOrders,
    rangeRevenue,
    rangeUnits,
    rangeRefunds,
    rangeDiscount,
    rangeShipping,
    recent,
    pendingReviews,
    tradePending,
    bespokeNew,
    contactNew,
    lowStock,
    topProducts,
    unpaidCount,
    unpaidTotal,
    awaitingPayment,
    packedCount,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { paymentStatus: "PAID", createdAt: { gte: todayStart, lte: todayEnd } },
      _sum: { total: true },
    }),
    prisma.order.count({
      where: { createdAt: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.user.count({
      where: {
        role: { in: ["CUSTOMER", "TRADE"] },
        createdAt: { gte: todayStart, lte: todayEnd },
      },
    }),
    prisma.order.count({ where: { createdAt: { gte: range.from, lte: range.to } } }),
    prisma.order.aggregate({ where: paidWhere, _sum: { total: true }, _count: true }),
    prisma.orderItem.aggregate({
      where: { order: paidWhere },
      _sum: { quantity: true },
    }),
    prisma.order.aggregate({
      where: {
        status: "REFUNDED",
        createdAt: { gte: range.from, lte: range.to },
      },
      _sum: { total: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: range.from, lte: range.to } },
      _sum: { discountTotal: true },
    }),
    prisma.order.aggregate({
      where: paidWhere,
      _sum: { shippingTotal: true },
    }),
    prisma.order.findMany({ take: 8, orderBy: { createdAt: "desc" } }),
    prisma.review.count({ where: { status: "PENDING" } }),
    prisma.tradeApplication.count({ where: { status: { in: ["NEW", "PENDING", "REVIEWING"] } } }),
    prisma.bespokeEnquiry.count({ where: { status: "NEW" } }),
    prisma.contactEnquiry.count({ where: { status: "NEW" } }),
    prisma.inventoryItem.findMany({
      where: { trackStock: true },
      take: 8,
      orderBy: { available: "asc" },
    }),
    prisma.orderItem.groupBy({
      by: ["productId", "title"],
      where: {
        productId: { not: null },
        order: { paymentStatus: "PAID", createdAt: { gte: monthStart, lte: todayEnd } },
      },
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    prisma.order.count({
      where: {
        paymentStatus: { in: ["UNPAID", "PENDING", "FAILED"] },
        status: { notIn: ["CANCELLED", "REFUNDED"] },
      },
    }),
    prisma.order.aggregate({
      where: {
        paymentStatus: { in: ["UNPAID", "PENDING", "FAILED"] },
        status: { notIn: ["CANCELLED", "REFUNDED"] },
      },
      _sum: { total: true },
    }),
    prisma.order.count({
      where: {
        status: "AWAITING_PAYMENT",
        paymentStatus: { in: ["UNPAID", "PENDING"] },
      },
    }),
    prisma.order.count({
      where: { status: { in: ["PACKED", "QC"] } },
    }),
  ]);

  const paidOrdersInRange = rangeRevenue._count;
  const revenueNum = toNumber(rangeRevenue._sum.total || 0);
  const aov = paidOrdersInRange > 0 ? revenueNum / paidOrdersInRange : 0;
  const todayRev = toNumber(todaySales._sum.total || 0);
  const todayAov = todayOrders > 0 ? todayRev / todayOrders : 0;

  const days = eachDayOfInterval({ start: range.from, end: range.to });
  const paidInRange = await prisma.order.findMany({
    where: paidWhere,
    select: { createdAt: true, total: true },
  });
  const byDay = new Map<string, { sales: number; orders: number }>();
  for (const d of days) {
    byDay.set(format(d, "yyyy-MM-dd"), { sales: 0, orders: 0 });
  }
  for (const o of paidInRange) {
    const key = format(o.createdAt, "yyyy-MM-dd");
    const row = byDay.get(key);
    if (row) {
      row.sales += toNumber(o.total);
      row.orders += 1;
    }
  }
  const series = [...byDay.entries()].map(([, v]) => ({ x: 0, y: v.sales }));
  const orderSeries = [...byDay.entries()].map(([, v]) => ({ x: 0, y: v.orders }));
  const maxSales = Math.max(...series.map((p) => p.y), 0);
  const maxOrders = Math.max(...orderSeries.map((p) => p.y), 0);

  const filters: { key: RangeKey; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "7d", label: "7 days" },
    { key: "30d", label: "30 days" },
    { key: "90d", label: "90 days" },
    { key: "ytd", label: "This year" },
  ];

  const lowStockFiltered = lowStock.filter((i) => i.available <= i.reorderLevel);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="admin-h1 mb-0">Dashboard</h1>
        <div className="admin-filters mb-0">
          {filters.map((f) => (
            <Link
              key={f.key}
              href={`/admin?range=${f.key}`}
              className={
                range.key === f.key ? "admin-filter-chip active" : "admin-filter-chip"
              }
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      <p className="admin-muted mb-3">Range: {range.label}</p>

      <h2 className="admin-h2">Ops</h2>
      <div className="admin-kpi-grid">
        <Link href="/admin/orders?payment=UNPAID" className="admin-kpi">
          <p className="admin-kpi-label">Unpaid / pending</p>
          <p className="admin-kpi-value">{unpaidCount}</p>
          <p className="admin-muted text-xs mt-1">
            {formatMoney(toNumber(unpaidTotal._sum.total || 0))} open
          </p>
        </Link>
        <Link href="/admin/orders?status=AWAITING_PAYMENT" className="admin-kpi">
          <p className="admin-kpi-label">Awaiting payment</p>
          <p className="admin-kpi-value">{awaitingPayment}</p>
        </Link>
        <Link href="/admin/inventory?low=1" className="admin-kpi">
          <p className="admin-kpi-label">Low stock</p>
          <p className="admin-kpi-value">{lowStockFiltered.length}</p>
          <p className="admin-muted text-xs mt-1">at or below reorder</p>
        </Link>
        <Link href="/admin/orders?status=PACKED" className="admin-kpi">
          <p className="admin-kpi-label">Ready to ship</p>
          <p className="admin-kpi-value">{packedCount}</p>
          <p className="admin-muted text-xs mt-1">packed / QC</p>
        </Link>
      </div>

      <h2 className="admin-h2">Today</h2>
      <div className="admin-kpi-grid">
        <div className="admin-kpi">
          <p className="admin-kpi-label">Sales</p>
          <p className="admin-kpi-value">{formatMoney(todayRev)}</p>
        </div>
        <div className="admin-kpi">
          <p className="admin-kpi-label">Orders</p>
          <p className="admin-kpi-value">{todayOrders}</p>
        </div>
        <div className="admin-kpi">
          <p className="admin-kpi-label">Customers</p>
          <p className="admin-kpi-value">{todayCustomers}</p>
        </div>
        <div className="admin-kpi">
          <p className="admin-kpi-label">AOV</p>
          <p className="admin-kpi-value">{formatMoney(todayAov)}</p>
        </div>
      </div>

      <h2 className="admin-h2">Period ({range.label})</h2>
      <div className="admin-kpi-grid">
        <Link href="/admin/orders" className="admin-kpi">
          <p className="admin-kpi-label">Revenue (paid)</p>
          <p className="admin-kpi-value">{formatMoney(revenueNum)}</p>
        </Link>
        <div className="admin-kpi">
          <p className="admin-kpi-label">Orders</p>
          <p className="admin-kpi-value">{rangeOrders}</p>
        </div>
        <div className="admin-kpi">
          <p className="admin-kpi-label">Units sold</p>
          <p className="admin-kpi-value">{rangeUnits._sum.quantity || 0}</p>
        </div>
        <div className="admin-kpi">
          <p className="admin-kpi-label">Refunds</p>
          <p className="admin-kpi-value">
            {rangeRefunds._count} · {formatMoney(toNumber(rangeRefunds._sum.total || 0))}
          </p>
        </div>
        <div className="admin-kpi">
          <p className="admin-kpi-label">Discounts</p>
          <p className="admin-kpi-value">
            {formatMoney(toNumber(rangeDiscount._sum.discountTotal || 0))}
          </p>
        </div>
        <div className="admin-kpi">
          <p className="admin-kpi-label">Shipping income</p>
          <p className="admin-kpi-value">
            {formatMoney(toNumber(rangeShipping._sum.shippingTotal || 0))}
          </p>
        </div>
        <div className="admin-kpi">
          <p className="admin-kpi-label">AOV (paid)</p>
          <p className="admin-kpi-value">{formatMoney(aov)}</p>
        </div>
      </div>

      <div className="admin-grid-2 mb-4">
        <div className="admin-panel">
          <h2 className="admin-h2">Sales by day</h2>
          <Sparkline points={series} max={maxSales} />
        </div>
        <div className="admin-panel">
          <h2 className="admin-h2">Orders by day (paid)</h2>
          <Sparkline points={orderSeries} max={maxOrders} />
        </div>
      </div>

      <div className="admin-widgets mb-4">
        <div className="admin-panel">
          <h2 className="admin-h2">Attention</h2>
          <ul className="admin-body space-y-2 list-none p-0 m-0">
            <li>
              <Link href="/admin/reviews" className="underline">
                Pending reviews: {pendingReviews}
              </Link>
            </li>
            <li>
              <Link href="/admin/bespoke" className="underline">
                Bespoke new: {bespokeNew}
              </Link>
            </li>
            <li>
              <Link href="/admin/trade" className="underline">
                Trade open: {tradePending}
              </Link>
            </li>
            <li>
              <Link href="/admin/enquiries" className="underline">
                Contact new: {contactNew}
              </Link>
            </li>
            <li>
              <Link href="/admin/inventory?low=1" className="underline">
                Low stock: {lowStockFiltered.length}
              </Link>
              {lowStockFiltered.length === 0 && (
                <span className="admin-muted"> (none at reorder)</span>
              )}
            </li>
            <li>
              <Link href="/admin/orders?payment=UNPAID" className="underline">
                Unpaid orders: {unpaidCount}
              </Link>
            </li>
          </ul>
        </div>
        <div className="admin-panel">
          <h2 className="admin-h2">Top products (30d paid)</h2>
          {topProducts.length === 0 ? (
            <p className="admin-muted">No paid order lines yet.</p>
          ) : (
            <ul className="admin-body space-y-2 list-none p-0 m-0">
              {topProducts.map((p) => (
                <li key={`${p.productId}-${p.title}`}>
                  {p.title}{" "}
                  <span className="admin-muted">
                    ×{p._sum.quantity || 0} · {formatMoney(toNumber(p._sum.lineTotal || 0))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <h2 className="admin-h2">Recent orders</h2>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Email</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 ? (
              <tr>
                <td colSpan={5} className="admin-muted">
                  No orders yet. Orders appear here after customers complete studio checkout via
                  Stripe.
                </td>
              </tr>
            ) : (
              recent.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/admin/orders/${o.id}`} className="underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td>{o.email}</td>
                  <td>
                    <span className={orderBadgeClass(o.status)}>{o.status}</span>
                  </td>
                  <td>
                    <span className={paymentBadgeClass(o.paymentStatus)}>
                      {o.paymentStatus}
                    </span>
                  </td>
                  <td>{formatMoney(o.total)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
