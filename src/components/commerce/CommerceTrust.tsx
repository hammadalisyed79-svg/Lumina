export function CommerceTrust({
  leadTimeDays,
  compact = false,
}: {
  leadTimeDays?: number | null;
  compact?: boolean;
}) {
  const items = [
    "Made to order in Britain",
    "Secure Stripe payment",
    "Shipping calculated at checkout",
  ];
  if (leadTimeDays && leadTimeDays > 0) {
    items.unshift(`Approx. ${leadTimeDays} working days`);
  }

  return (
    <div className={`trust-strip ${compact ? "gap-y-2" : ""}`} role="list">
      {items.map((label) => (
        <span key={label} role="listitem">
          {label}
        </span>
      ))}
    </div>
  );
}
