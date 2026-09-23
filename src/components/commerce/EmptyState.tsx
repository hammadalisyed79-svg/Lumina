import Link from "next/link";

type Action = { href: string; label: string; variant?: "primary" | "secondary" | "quiet" };

export function EmptyState({
  eyebrow = "Nothing here",
  title,
  body,
  primary,
  secondary,
  className = "",
}: {
  eyebrow?: string;
  title: string;
  body: string;
  primary?: Action;
  secondary?: Action;
  className?: string;
}) {
  const btn = (a: Action) => {
    const cls =
      a.variant === "quiet"
        ? "btn-quiet"
        : a.variant === "secondary"
          ? "btn-secondary"
          : "btn-primary";
    return (
      <Link key={a.href + a.label} href={a.href} className={cls}>
        {a.label}
      </Link>
    );
  };

  return (
    <div className={`py-14 text-center max-w-md mx-auto ${className}`}>
      <p className="eyebrow mb-3">{eyebrow}</p>
      <h2 className="font-display text-3xl md:text-4xl tracking-tight mb-3">{title}</h2>
      <div className="lux-rule mx-auto" />
      <p className="prose-muted mb-8">{body}</p>
      {(primary || secondary) && (
        <div className="flex flex-wrap justify-center gap-3">
          {primary && btn(primary)}
          {secondary && btn({ ...secondary, variant: secondary.variant || "secondary" })}
        </div>
      )}
    </div>
  );
}
