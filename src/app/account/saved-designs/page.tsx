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
    include: { shape: true, fabric: true, size: true },
  });

  return (
    <div className="container-site py-12 max-w-3xl">
      <Link href="/account" className="text-sm text-[color:var(--muted)]">← Account</Link>
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
        {designs.map((d) => (
          <li key={d.id} className="border border-[color:var(--line)] p-4">
            <p className="font-medium">{d.name || "Custom shade"}</p>
            <p className="text-sm text-[color:var(--muted)] mt-1">
              {d.shape?.name} · {d.fabric?.name} · {d.size?.name}
            </p>
            <p className="mt-2">{formatMoney(toNumber(d.unitPrice))}</p>
            <pre className="text-xs mt-3 text-[color:var(--muted)] whitespace-pre-wrap font-sans">
              {JSON.stringify(d.configJson, null, 2)}
            </pre>
          </li>
        ))}
      </ul>
    </div>
  );
}
