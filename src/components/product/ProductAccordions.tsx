"use client";

import Link from "next/link";
import { useId, useState, type ReactNode } from "react";

export function ProductAccordions({
  description,
  leadTimeDays,
  productType,
}: {
  description: string;
  leadTimeDays: number;
  productType?: string;
}) {
  const baseId = useId();
  const [open, setOpen] = useState(0);
  const days = Math.max(1, leadTimeDays || 10);
  const isShade = !productType || productType === "LAMPSHADE";

  const items: {
    title: string;
    body: ReactNode;
  }[] = [
    {
      title: "Details",
      body: <p className="prose-muted text-sm leading-relaxed whitespace-pre-line">{description}</p>,
    },
    {
      title: "Lead time & shipping",
      body: (
        <div className="space-y-3 text-sm prose-muted leading-relaxed">
          <p>
            Made to order in approximately <strong className="text-ink font-medium">{days} working
            days</strong>{" "}
            from payment. Timing can vary slightly for bespoke sizes or peak periods.
          </p>
          <p>
            UK delivery options and costs are confirmed at Stripe checkout from studio shipping
            rates. International requests are handled case by case via the studio.
          </p>
          <p>
            <Link href="/shipping" className="underline underline-offset-4 hover:text-bronze">
              Shipping guide
            </Link>
            {" · "}
            <Link href="/size-guide" className="underline underline-offset-4 hover:text-bronze">
              Size guide
            </Link>
          </p>
        </div>
      ),
    },
    {
      title: "Care",
      body: (
        <div className="space-y-3 text-sm prose-muted leading-relaxed">
          <p>
            Dust gently with a soft brush or dry microfibre cloth. Avoid water, steam and harsh
            cleaners on fabric or foil linings.
          </p>
          {isShade ? (
            <p>
              Prefer LED bulbs within the recommended wattage. Keep shades clear of open flame and
              prolonged harsh sun where possible.
            </p>
          ) : (
            <p>Follow any finish notes on this page; store textiles dry and unfolded when possible.</p>
          )}
          <p>
            <Link href="/care" className="underline underline-offset-4 hover:text-bronze">
              Full care notes
            </Link>
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="mt-10 border-t border-line">
      {items.map((item, i) => {
        const panelId = `${baseId}-panel-${i}`;
        const btnId = `${baseId}-btn-${i}`;
        const isOpen = open === i;
        return (
          <div key={item.title} className="border-b border-line">
            <button
              type="button"
              id={btnId}
              className="w-full flex justify-between items-center py-4 text-left group"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpen(isOpen ? -1 : i)}
            >
              <span className="eyebrow text-ink group-hover:text-bronze transition-colors">
                {item.title}
              </span>
              <span className="text-muted text-lg leading-none" aria-hidden>
                {isOpen ? "−" : "+"}
              </span>
            </button>
            {isOpen && (
              <div id={panelId} role="region" aria-labelledby={btnId} className="pb-5 max-w-prose">
                {item.body}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
