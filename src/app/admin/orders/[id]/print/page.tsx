import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/utils";
import { toNumber } from "@/lib/pricing";
import { SITE } from "@/lib/site";
import { formatConfigSnippet } from "@/lib/admin/orders";
import { PrintButton } from "@/components/admin/PrintButton";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderPrintPage({ params }: Props) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, shippingMethod: true },
  });
  if (!order) notFound();

  return (
    <div className="admin-print-sheet admin-panel max-w-3xl mx-auto">
      <div className="admin-no-print admin-actions mb-4">
        <Link href={`/admin/orders/${order.id}`} className="admin-muted text-sm underline">
          ← Back to order
        </Link>
        <PrintButton />
      </div>

      <div className="flex justify-between gap-6 mb-8">
        <div>
          <p className="admin-brand-kicker" style={{ color: "var(--admin-accent)" }}>
            Packing note
          </p>
          <h1 className="admin-h1" style={{ marginBottom: 4 }}>
            {order.orderNumber}
          </h1>
          <p className="admin-muted text-sm">
            {SITE.name} · {SITE.address}
          </p>
        </div>
        <div className="text-sm text-right">
          <p>{order.createdAt.toLocaleDateString("en-GB")}</p>
          <p className="admin-muted">{order.email}</p>
        </div>
      </div>

      <div className="mb-6">
        <p className="admin-label">Ship to</p>
        <p className="admin-body">
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
          <br />
          {order.shippingCountry || "GB"}
        </p>
      </div>

      <table className="admin-table" style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>Qty</th>
            <th>Item</th>
            <th>SKU</th>
            <th>Config</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((i) => (
            <tr key={i.id}>
              <td>{i.quantity}</td>
              <td>{i.title}</td>
              <td>{i.sku || "—"}</td>
              <td className="text-xs">{formatConfigSnippet(i.configJson) || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 text-sm flex justify-between">
        <span>{order.shippingMethod?.name || "Shipping"}</span>
        <span className="font-medium">Total {formatMoney(toNumber(order.total))}</span>
      </div>

      {order.staffNotes && (
        <p className="mt-6 text-sm">
          <strong>Notes:</strong> {order.staffNotes}
        </p>
      )}
    </div>
  );
}
