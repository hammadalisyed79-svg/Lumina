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
      body: `Made to order in approximately ${leadTimeDays} working days. UK mainland delivery from £4.95, complimentary over £75.`,
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
            className="w-full flex justify-between items-center py-4 text-left"
            onClick={() => setOpen(open === i ? -1 : i)}
          >
            <span className="font-medium">{item.title}</span>
            <span>{open === i ? "−" : "+"}</span>
          </button>
          {open === i && <p className="prose-muted pb-4 text-sm">{item.body}</p>}
        </div>
      ))}
    </div>
  );
}
