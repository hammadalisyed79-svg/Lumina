import Link from "next/link";

/** Customer-facing shipment / progress panel for order pages. */
export function OrderTrackingPanel({
  status,
  paymentStatus,
  productionStatus,
  trackingProvider,
  trackingNumber,
  dispatchedAt,
}: {
  status: string;
  paymentStatus: string;
  productionStatus?: string | null;
  trackingProvider?: string | null;
  trackingNumber?: string | null;
  dispatchedAt?: Date | null;
}) {
  const shipped =
    Boolean(trackingNumber) ||
    ["SHIPPED", "DISPATCHED", "DELIVERED"].includes(status) ||
    productionStatus === "DISPATCHED" ||
    productionStatus === "COMPLETE";

  const steps = [
    {
      key: "paid",
      label: "Payment",
      done: paymentStatus === "PAID",
      detail:
        paymentStatus === "PAID"
          ? "Confirmed"
          : paymentStatus === "PENDING"
            ? "Awaiting Stripe"
            : paymentStatus.toLowerCase().replace(/_/g, " "),
    },
    {
      key: "studio",
      label: "Studio",
      done: ["PROCESSING", "PRODUCTION", "QC", "PACKED", "SHIPPED", "DISPATCHED", "DELIVERED"].includes(
        status
      ),
      detail: productionStatus && productionStatus !== "NONE"
        ? productionStatus.toLowerCase().replace(/_/g, " ")
        : status.toLowerCase().replace(/_/g, " "),
    },
    {
      key: "ship",
      label: "Dispatch",
      done: shipped,
      detail: shipped
        ? dispatchedAt
          ? `Dispatched ${dispatchedAt.toLocaleDateString("en-GB")}`
          : "On its way"
        : "After packing",
    },
  ];

  return (
    <div className="surface-panel p-6 md:p-8 mb-8">
      <p className="eyebrow mb-4">Progress</p>
      <ol className="grid sm:grid-cols-3 gap-4 mb-0 list-none p-0">
        {steps.map((s) => (
          <li key={s.key} className="border-t border-line pt-3">
            <p className={`text-sm font-medium ${s.done ? "text-ink" : "text-muted"}`}>
              {s.done ? "●" : "○"} {s.label}
            </p>
            <p className="text-xs text-muted mt-1 capitalize">{s.detail}</p>
          </li>
        ))}
      </ol>

      {trackingNumber && (
        <div className="mt-6 pt-5 border-t border-line">
          <p className="label mb-1">Tracking</p>
          <p className="font-medium">
            {trackingProvider ? `${trackingProvider} · ` : ""}
            <span className="font-mono text-sm">{trackingNumber}</span>
          </p>
          <p className="text-xs text-muted mt-2">
            Questions about delivery?{" "}
            <Link href="/contact" className="underline hover:text-bronze">
              Contact the studio
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
