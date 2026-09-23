import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireStaff();
  const { q: raw } = await searchParams;
  const q = (raw || "").trim();

  if (!q) {
    return (
      <div>
        <h1 className="admin-h1">Search</h1>
        <p className="admin-muted">Type in the top bar or add ?q= to the URL.</p>
      </div>
    );
  }

  const [orders, products, customers, enquiries] = await Promise.all([
    prisma.order.findMany({
      where: {
        OR: [
          { orderNumber: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 10,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
          { variants: { some: { sku: { contains: q, mode: "insensitive" } } } },
        ],
      },
      take: 10,
    }),
    prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 10,
    }),
    prisma.contactEnquiry.findMany({
      where: {
        OR: [
          { email: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
          { subject: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 10,
    }),
  ]);

  return (
    <div>
      <h1 className="admin-h1">Search results</h1>
      <p className="admin-muted mb-4">Query: {q}</p>

      <section className="admin-panel mb-4">
        <h2 className="admin-h2">Orders</h2>
        {orders.length === 0 ? (
          <p className="admin-muted">None</p>
        ) : (
          <ul className="admin-body list-none p-0 m-0 space-y-1">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="underline">
                  {o.orderNumber}
                </Link>{" "}
                · {o.email}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="admin-panel mb-4">
        <h2 className="admin-h2">Products</h2>
        {products.length === 0 ? (
          <p className="admin-muted">None</p>
        ) : (
          <ul className="admin-body list-none p-0 m-0 space-y-1">
            {products.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/products/${p.id}`} className="underline">
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="admin-panel mb-4">
        <h2 className="admin-h2">Customers</h2>
        {customers.length === 0 ? (
          <p className="admin-muted">None</p>
        ) : (
          <ul className="admin-body list-none p-0 m-0 space-y-1">
            {customers.map((u) => (
              <li key={u.id}>
                {u.name || "—"} · {u.email} · {u.role}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="admin-panel">
        <h2 className="admin-h2">Contact enquiries</h2>
        {enquiries.length === 0 ? (
          <p className="admin-muted">None</p>
        ) : (
          <ul className="admin-body list-none p-0 m-0 space-y-1">
            {enquiries.map((e) => (
              <li key={e.id}>
                {e.name} · {e.email} · {e.subject || "No subject"}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
