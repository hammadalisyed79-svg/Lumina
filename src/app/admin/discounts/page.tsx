import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DiscountsPage() {
  await requirePermission("discounts.view");
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" }, take: 100 });

  return (
    <div>
      <h1 className="admin-h1">Discounts</h1>
      <p className="admin-muted mb-4">
        Full promotion rules (collections, usage limits) arrive in Phase 11. Existing coupon codes
        below.
      </p>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Type</th>
              <th>Value</th>
              <th>Uses</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id}>
                <td>{c.code}</td>
                <td>{c.type}</td>
                <td>{String(c.value)}</td>
                <td>
                  {c.usedCount}
                  {c.maxUses != null ? ` / ${c.maxUses}` : ""}
                </td>
                <td>
                  <span className="admin-badge">{c.active ? "Active" : "Off"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="admin-muted mt-4 text-sm">
        Legacy path <Link href="/admin/coupons">/admin/coupons</Link> redirects here.
      </p>
    </div>
  );
}
