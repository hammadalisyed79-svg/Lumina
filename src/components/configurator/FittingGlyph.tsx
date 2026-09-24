/** Presentational fitting glyph — display only, no compatibility logic. */

type Props = {
  name: string;
  slug?: string | null;
  className?: string;
};

export function FittingGlyph({ name, slug, className = "" }: Props) {
  const hay = `${name} ${slug || ""}`.toLowerCase();
  const kind = hay.includes("uno")
    ? "uno"
    : hay.includes("clip")
      ? "clip"
      : hay.includes("gimbal") || hay.includes("duplex")
        ? "duplex"
        : "spider";

  return (
    <svg
      viewBox="0 0 40 40"
      className={`cfg-fitting-glyph ${className}`.trim()}
      aria-hidden
      focusable="false"
    >
      {kind === "uno" ? (
        <>
          <circle cx="20" cy="20" r="11" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="20" cy="20" r="4" fill="currentColor" fillOpacity="0.35" />
          <path d="M20 9v4M20 27v4" stroke="currentColor" strokeWidth="1.4" />
        </>
      ) : kind === "clip" ? (
        <>
          <path
            d="M12 14h16v12H12z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path d="M16 14V10h8v4M18 26v4h4v-4" stroke="currentColor" strokeWidth="1.4" />
        </>
      ) : kind === "duplex" ? (
        <>
          <circle cx="20" cy="20" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10 20h20M20 10v20" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="20" cy="20" r="3" fill="currentColor" fillOpacity="0.3" />
        </>
      ) : (
        <>
          <circle cx="20" cy="20" r="3.5" fill="currentColor" fillOpacity="0.4" />
          <path
            d="M20 8v9M20 23v9M8 20h9M23 20h9M11.5 11.5l6.2 6.2M22.3 22.3l6.2 6.2M28.5 11.5l-6.2 6.2M17.7 22.3l-6.2 6.2"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}
