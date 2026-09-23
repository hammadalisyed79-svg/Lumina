import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { formatMoney } from "@/lib/utils";
import { toNumber } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function SavedDesignsPage() {
  const session = await requireUser();
  const designs = await prisma.savedDesign.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { shape: true, fabric: true, size: true, lining: true, fitting: true },
  });

  return (
    <div className="container-site py-12 max-w-3xl">
      <Link href="/account" className="text-sm text-[color:var(--muted)]">
        ← Account
      </Link>
      <h1 className="font-display text-4xl mt-4 mb-8">Saved designs</h1>
      {designs.length === 0 && (
        <p className="prose-muted">
          No saved designs.{" "}
          <Link href="/design-your-shade" className="underline">
            Design your shade
          </Link>
        </p>
      )}
      <ul className="space-y-4">
        {designs.map((d) => {
          const parts = [
            d.shape?.name,
            d.fabric?.name,
            d.size?.name,
            d.lining?.name,
            d.fitting?.name,
          ].filter(Boolean);
          return (
            <li key={d.id} className="border border-[color:var(--line)] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-lg">{d.name || "Custom shade"}</p>
                  <p className="text-sm text-[color:var(--muted)] mt-1">{parts.join(" · ")}</p>
                  <p className="mt-2">{formatMoney(toNumber(d.unitPrice))}</p>
                  <p className="text-xs text-[color:var(--muted)] mt-2">
                    Saved {d.createdAt.toLocaleDateString("en-GB")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href="/design-your-shade" className="btn-secondary text-sm">
                    Open studio
                  </Link>
                  <Link href="/bespoke" className="btn-quiet text-sm">
                    Enquire
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
