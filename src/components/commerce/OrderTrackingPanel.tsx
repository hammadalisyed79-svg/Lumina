import Link from "next/link";
import {
  formatOrderStatus,
  formatPaymentStatus,
  formatProductionStatus,
  trackingUrl,
} from "@/lib/orders/customer";
import { TrackingCopyButton } from "@/components/commerce/TrackingCopyButton";

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
  const paid = paymentStatus === "PAID";
  const delivered = status === "DELIVERED";
  const shipped =
    delivered ||
    Boolean(trackingNumber) ||
    ["SHIPPED", "DISPATCHED"].includes(status) ||
    productionStatus === "DISPATCHED" ||
    productionStatus === "COMPLETE";
  const inStudio =
    paid ||
    [
      "CONFIRMED",
      "PROCESSING",
      "PRODUCTION",
      "QC",
      "PACKED",
      "SHIPPED",
      "DISPATCHED",
      "DELIVERED",
    ].includes(status);

  const steps = [
    {
      key: "paid",
      label: "Payment",
      done: paid,
      detail: formatPaymentStatus(paymentStatus),
    },
    {
      key: "studio",
      label: "Studio",
      done: inStudio && (shipped || ["PACKED", "QC", "PRODUCTION", "PROCESSING", "CONFIRMED"].includes(status)),
      detail:
        productionStatus && productionStatus !== "NONE"
          ? formatProductionStatus(productionStatus)
          : formatOrderStatus(status),
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
    {
      key: "done",
      label: "Delivered",
      done: delivered,
      detail: delivered ? "Complete" : "When carrier confirms",
    },
  ];

  let foundCurrent = false;
  const normalized = steps.map((s) => {
    if (s.done) return { ...s, current: false };
    if (!foundCurrent) {
      foundCurrent = true;
      return { ...s, current: true };
    }
    return { ...s, current: false };
  });

  const trackHref = trackingUrl(trackingProvider, trackingNumber);

  return (
    <div className="surface-panel p-6 md:p-8 mb-8">
      <p className="eyebrow mb-4">Progress</p>
      <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-0 list-none p-0">
        {normalized.map((s) => (
          <li
            key={s.key}
            className={`border-t pt-3 ${
              s.current ? "border-bronze" : "border-line"
            }`}
          >
            <p
              className={`text-sm font-medium ${
                s.done ? "text-ink" : s.current ? "text-bronze" : "text-muted"
              }`}
            >
              {s.done ? "●" : s.current ? "◐" : "○"} {s.label}
            </p>
            <p className="text-xs text-muted mt-1">{s.detail}</p>
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
          <div className="mt-3 flex flex-wrap items-center gap-4">
            {trackHref && (
              <a
                href={trackHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-sm !py-2"
              >
                Track parcel
              </a>
            )}
            <TrackingCopyButton value={trackingNumber} />
          </div>
          <p className="text-xs text-muted mt-3">
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
