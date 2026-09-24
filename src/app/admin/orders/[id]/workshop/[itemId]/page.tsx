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

type Props = { params: Promise<{ id: string; itemId: string }> };

export default async function AdminOrderItemWorkshopPage({ params }: Props) {
  await requirePermission("orders.view");
  const { id, itemId } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) notFound();
  const item = order.items.find((i) => i.id === itemId);
  if (!item) notFound();

  const snap = isConfiguredSnapshot(item.configJson) ? item.configJson : null;
  const idx = order.items.findIndex((i) => i.id === itemId) + 1;

  return (
    <div className="admin-print-sheet admin-panel max-w-2xl mx-auto">
      <div className="admin-no-print admin-actions mb-4">
        <Link
          href={`/admin/orders/${order.id}/workshop`}
          className="admin-muted text-sm underline"
        >
          ← Order pack
        </Link>
        <PrintButton />
      </div>

      <header className="mb-6 border-b border-line pb-4">
        <p className="admin-brand-kicker" style={{ color: "var(--admin-accent)" }}>
          Manufacturing sheet
        </p>
        <h1 className="admin-h1" style={{ marginBottom: 4 }}>
          {order.orderNumber}
        </h1>
        <p className="admin-muted text-sm">
          Item {idx} of {order.items.length} · {SITE.name}
        </p>
      </header>

      <h2 className="font-display text-2xl mb-2">
        {item.quantity}× {item.title}
      </h2>
      {item.sku && <p className="text-sm text-muted mb-4">SKU {item.sku}</p>}

      {snap ? (
        <>
          <section className="mb-6">
            <h3 className="admin-h2">Configuration snapshot</h3>
            <dl className="space-y-2 text-sm">
              {workshopConfigRows(snap).map((r) => (
                <div
                  key={r.label}
                  className="flex justify-between gap-4 border-b border-line/60 pb-2"
                >
                  <dt className="text-muted uppercase text-[11px] tracking-wide">
                    {r.label}
                  </dt>
                  <dd className="font-medium text-right">{r.value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="mb-6">
            <h3 className="admin-h2">Measurements</h3>
            {workshopMeasurements(snap).length ? (
              <dl className="space-y-2 text-sm">
                {workshopMeasurements(snap).map((r) => (
                  <div
                    key={r.label}
                    className="flex justify-between gap-4 border-b border-line/60 pb-2"
                  >
                    <dt className="text-muted">{r.label}</dt>
                    <dd className="font-medium">{r.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-muted">
                No measurements stored — do not invent dimensions on the shop floor.
              </p>
            )}
          </section>
          <p className="text-sm mb-6">{snap.leadTimeNote}</p>
          <p className="text-xs text-muted font-mono break-all">
            Line key: {snap.lineKey}
          </p>
        </>
      ) : (
        <p className="text-sm text-muted mb-6">
          Standard catalogue item — use SKU and title above.
        </p>
      )}

      <div className="mt-8 border-t border-line pt-4 text-sm flex justify-between">
        <span>Unit {formatMoney(toNumber(item.unitPrice))}</span>
        <span className="font-medium">
          Line {formatMoney(toNumber(item.lineTotal))}
        </span>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-6 text-sm">
        <div className="border border-dashed border-line p-4 min-h-[5rem]">
          <p className="text-xs uppercase text-muted mb-2">Cutter</p>
        </div>
        <div className="border border-dashed border-line p-4 min-h-[5rem]">
          <p className="text-xs uppercase text-muted mb-2">Maker / QC</p>
        </div>
      </div>
    </div>
  );
}
