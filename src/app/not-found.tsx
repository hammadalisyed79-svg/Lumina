import Link from "next/link";
import { EmptyState } from "@/components/commerce/EmptyState";

export default function NotFound() {
  return (
    <div className="container-site section-pad">
      <EmptyState
        eyebrow="404"
        title="Page not found"
        body="That link may have moved. Browse lampshades, open the studio, or return home."
        primary={{ href: "/shop/lampshades", label: "Shop lampshades" }}
        secondary={{ href: "/", label: "Home", variant: "secondary" }}
      />
      <div className="flex justify-center -mt-4">
        <Link href="/search" className="btn-quiet">
          Search the catalogue
        </Link>
      </div>
    </div>
  );
}
