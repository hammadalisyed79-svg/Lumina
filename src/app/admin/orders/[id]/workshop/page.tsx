import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/utils";
import { toNumber } from "@/lib/pricing";
import { SITE } from "@/lib/site";
import { requirePermission } from "@/lib/auth/guards";
import {
  isConfiguredSnapshot,
  workshopConfigRows,
  workshopMeasurements,
} from "@/lib/orders/workshop";
import { PrintButton } from "@/components/admin/PrintButton";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderWorkshopPackPage({ params }: Props) {
  await requirePermission("orders.view");
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, shippingMethod: true },
  });
  if (!order) notFound();

  return (
    <div className="admin-print-sheet admin-panel max-w-4xl mx-auto">
      <div className="admin-no-print admin-actions mb-4">
        <Link href={`/admin/orders/${order.id}`} className="admin-muted text-sm underline">
          ← Back to order
        </Link>
        <PrintButton />
      </div>

      <header className="mb-8 border-b border-line pb-4">
        <p className="admin-brand-kicker" style={{ color: "var(--admin-accent)" }}>
          Workshop order pack
        </p>
        <h1 className="admin-h1" style={{ marginBottom: 4 }}>
          {order.orderNumber}
        </h1>
        <p className="admin-muted text-sm">
          {SITE.name} · {order.createdAt.toLocaleString("en-GB")} · {order.email}
        </p>
        <p className="text-sm mt-2">
          Order: {order.status} · Payment: {order.paymentStatus} · Production:{" "}
          {order.productionStatus}
        </p>
      </header>

      <section className="mb-8">
        <h2 className="admin-h2">Ship to</h2>
        <p className="admin-body">
          {order.shippingName || "—"}
          <br />
          {[order.shippingLine1, order.shippingLine2].filter(Boolean).join(", ")}
          <br />
          {[order.shippingCity, order.shippingCounty, order.shippingPostcode]
            .filter(Boolean)
            .join(", ")}
          <br />
          {order.shippingCountry || "GB"}
        </p>
      </section>

      <section className="mb-8">
        <h2 className="admin-h2">Items ({order.items.length})</h2>
        <div className="space-y-6">
          {order.items.map((item, idx) => {
            const snap = isConfiguredSnapshot(item.configJson)
              ? item.configJson
              : null;
            return (
              <div
                key={item.id}
                className="border border-line p-4 break-inside-avoid"
                style={{ pageBreakInside: "avoid" }}
              >
                <div className="flex justify-between gap-4 mb-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted">
                      Item {idx + 1} of {order.items.length}
                    </p>
                    <p className="font-medium text-lg">
                      {item.quantity}× {item.title}
                    </p>
                    {item.sku && (
                      <p className="text-xs text-muted">SKU {item.sku}</p>
                    )}
                  </div>
                  <div className="text-right text-sm">
                    <p>{formatMoney(toNumber(item.unitPrice))} ea</p>
                    <p className="font-medium">
                      {formatMoney(toNumber(item.lineTotal))}
                    </p>
                    <Link
                      href={`/admin/orders/${order.id}/workshop/${item.id}`}
                      className="admin-no-print text-xs underline"
                    >
                      Item sheet
                    </Link>
                  </div>
                </div>
                {snap ? (
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <dl className="space-y-1">
                      {workshopConfigRows(snap).map((r) => (
                        <div key={r.label} className="flex justify-between gap-3">
                          <dt className="text-muted">{r.label}</dt>
                          <dd className="font-medium text-right">{r.value}</dd>
                        </div>
                      ))}
                    </dl>
                    <dl className="space-y-1">
                      {workshopMeasurements(snap).length ? (
                        workshopMeasurements(snap).map((r) => (
                          <div key={r.label} className="flex justify-between gap-3">
                            <dt className="text-muted">{r.label}</dt>
                            <dd className="font-medium text-right">{r.value}</dd>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted text-xs">
                          No stored measurements on snapshot.
                        </p>
                      )}
                      <p className="text-xs text-muted mt-2">{snap.leadTimeNote}</p>
                    </dl>
                  </div>
                ) : (
                  <p className="text-sm text-muted">Standard catalogue line.</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-t border-line pt-4 text-sm flex flex-wrap justify-between gap-4">
        <div>
          <p>Subtotal {formatMoney(toNumber(order.subtotal))}</p>
          <p>Shipping {formatMoney(toNumber(order.shippingTotal))}</p>
          <p>Discount −{formatMoney(toNumber(order.discountTotal))}</p>
          <p>Tax {formatMoney(toNumber(order.taxTotal))}</p>
          <p className="font-medium mt-1">
            Total {formatMoney(toNumber(order.total))}
          </p>
          <p className="text-xs text-muted mt-2">
            Order summary for workshop — not a VAT invoice.
          </p>
        </div>
        {order.staffNotes && (
          <div className="max-w-sm">
            <p className="admin-label">Internal notes</p>
            <p className="whitespace-pre-wrap">{order.staffNotes}</p>
          </div>
        )}
      </section>
    </div>
  );
}
