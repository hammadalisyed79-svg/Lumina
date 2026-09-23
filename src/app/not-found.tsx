import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-site section-pad max-w-xl text-center">
      <p className="eyebrow mb-3">404</p>
      <h1 className="font-display text-4xl md:text-5xl mb-4">Page not found</h1>
      <p className="prose-muted mb-8">
        That link may have moved. Browse lampshades, fabrics or cushions, or return home.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary">
          Home
        </Link>
        <Link href="/shop/lampshades" className="btn-secondary">
          Shop lampshades
        </Link>
        <Link href="/search" className="btn-quiet">
          Search
        </Link>
      </div>
    </div>
  );
}
