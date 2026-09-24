import Link from "next/link";
import { MediaImage } from "@/components/media/MediaImage";

type Cta = {
  href: string;
  label: string;
  variant?: "primary" | "secondary" | "quiet";
};

export function ContentHero({
  eyebrow,
  title,
  subtitle,
  image,
  alt,
  ctas,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  image: string;
  alt: string;
  ctas?: Cta[];
}) {
  return (
    <div className="relative min-h-[42vh] md:min-h-[52vh] flex items-end overflow-hidden bg-ink">
      <MediaImage
        src={image}
        alt={alt}
        fill
        className="object-cover object-center opacity-90"
        sizes="100vw"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[rgba(20,17,14,0.78)] via-[rgba(20,17,14,0.28)] to-transparent" />
      <div className="relative container-site py-14 md:py-20 text-white max-w-3xl">
        <p className="eyebrow text-champagne mb-3">{eyebrow}</p>
        <h1 className="font-display text-5xl md:text-7xl tracking-tight leading-[0.95]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-5 text-base md:text-lg text-white/80 max-w-xl leading-relaxed">
            {subtitle}
          </p>
        )}
        {ctas && ctas.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-8">
            {ctas.map((c) => (
              <Link
                key={c.href + c.label}
                href={c.href}
                className={
                  c.variant === "secondary"
                    ? "btn-secondary !border-white/40 !text-white hover:!bg-white/10"
                    : c.variant === "quiet"
                      ? "btn-quiet !text-white/85 hover:!text-white"
                      : "btn-primary"
                }
              >
                {c.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ContentCtas({
  primary,
  secondary,
  tertiary,
}: {
  primary?: Cta;
  secondary?: Cta;
  tertiary?: Cta;
}) {
  const items = [primary, secondary, tertiary].filter(Boolean) as Cta[];
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-3 mt-12">
      {items.map((c) => (
        <Link
          key={c.href + c.label}
          href={c.href}
          className={
            c.variant === "secondary"
              ? "btn-secondary"
              : c.variant === "quiet"
                ? "btn-quiet"
                : "btn-primary"
          }
        >
          {c.label}
        </Link>
      ))}
    </div>
  );
}
