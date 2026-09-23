"use client";

import { useState } from "react";

export function ProductAccordions({
  description,
  leadTimeDays,
}: {
  description: string;
  leadTimeDays: number;
}) {
  const items = [
    { title: "Details", body: description },
    {
      title: "Lead time & shipping",
      body: `Made to order in approximately ${leadTimeDays} working days. Delivery options and costs are confirmed at Stripe checkout from studio rates.`,
    },
    {
      title: "Care",
      body: "Dust gently with a soft brush or microfibre cloth. Avoid harsh cleaners. Keep away from open flame and excessive moisture.",
    },
  ];
  const [open, setOpen] = useState(0);

  return (
    <div className="mt-10 border-t border-[color:var(--line)]">
      {items.map((item, i) => (
        <div key={item.title} className="border-b border-[color:var(--line)]">
          <button
            type="button"
            className="w-full flex justify-between items-center py-4 text-left group"
            onClick={() => setOpen(open === i ? -1 : i)}
          >
            <span className="eyebrow text-ink group-hover:text-bronze transition-colors">{item.title}</span>
            <span className="text-muted text-lg leading-none">{open === i ? "−" : "+"}</span>
          </button>
          {open === i && <p className="prose-muted pb-5 text-sm max-w-prose">{item.body}</p>}
        </div>
      ))}
    </div>
  );
}
