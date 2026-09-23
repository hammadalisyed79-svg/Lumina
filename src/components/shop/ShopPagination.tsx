import Link from "next/link";

export function ShopPagination({
  slug,
  page,
  pageSize,
  total,
  current,
}: {
  slug: string;
  page: number;
  pageSize: number;
  total: number;
  current: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  function href(p: number) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(current)) {
      if (v && k !== "page") params.set(k, v);
    }
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/shop/${slug}?${qs}` : `/shop/${slug}`;
  }

  return (
    <nav
      className="mt-10 flex flex-wrap items-center justify-center gap-3"
      aria-label="Pagination"
    >
      {page > 1 ? (
        <Link href={href(page - 1)} className="btn-secondary">
          Previous
        </Link>
      ) : (
        <span className="btn-secondary opacity-40 pointer-events-none">Previous</span>
      )}
      <p className="text-sm text-[color:var(--muted)]">
        Page {page} of {totalPages}
      </p>
      {page < totalPages ? (
        <Link href={href(page + 1)} className="btn-secondary">
          Next
        </Link>
      ) : (
        <span className="btn-secondary opacity-40 pointer-events-none">Next</span>
      )}
    </nav>
  );
}
