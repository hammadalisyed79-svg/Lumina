/** Presentational shape glyph for Design Your Shade — no geometry logic. */

type Props = {
  shapeKey: string;
  className?: string;
};

export function ShapeSilhouette({ shapeKey, className = "" }: Props) {
  const key = shapeKey.toLowerCase();
  return (
    <svg
      viewBox="0 0 48 56"
      className={`cfg-shape-sil ${className}`.trim()}
      aria-hidden
      focusable="false"
    >
      {key.includes("empire") ? (
        <path
          d="M14 10h20l6 36H8z"
          fill="currentColor"
          fillOpacity="0.14"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      ) : key.includes("coolie") ? (
        <path
          d="M18 12h12l10 34H8z"
          fill="currentColor"
          fillOpacity="0.14"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      ) : key.includes("oval") ? (
        <ellipse
          cx="24"
          cy="28"
          rx="14"
          ry="18"
          fill="currentColor"
          fillOpacity="0.14"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      ) : key.includes("square") || key.includes("rectangle") ? (
        <rect
          x="10"
          y="10"
          width="28"
          height="36"
          rx="1"
          fill="currentColor"
          fillOpacity="0.14"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      ) : key.includes("tier") ? (
        <>
          <path
            d="M16 8h16l4 14H12z"
            fill="currentColor"
            fillOpacity="0.12"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <path
            d="M12 22h24l5 24H7z"
            fill="currentColor"
            fillOpacity="0.16"
            stroke="currentColor"
            strokeWidth="1.4"
          />
        </>
      ) : key.includes("cone") || key.includes("french") ? (
        <path
          d="M20 8h8l12 40H8z"
          fill="currentColor"
          fillOpacity="0.14"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      ) : (
        /* drum / default cylinder */
        <path
          d="M12 12h24v32H12z"
          fill="currentColor"
          fillOpacity="0.14"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      )}
    </svg>
  );
}
