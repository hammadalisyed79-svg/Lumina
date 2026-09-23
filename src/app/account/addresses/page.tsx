import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { AddressForm } from "@/components/account/AddressForm";

export const dynamic = "force-dynamic";

export default async function AddressesPage() {
  const session = await requireUser();
  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container-site py-12 max-w-2xl">
      <Link href="/account" className="text-sm text-[color:var(--muted)]">← Account</Link>
      <h1 className="font-display text-4xl mt-4 mb-8">Addresses</h1>
      <ul className="space-y-4 mb-10">
        {addresses.map((a) => (
          <li key={a.id} className="border border-[color:var(--line)] p-4 text-sm">
            <p className="font-medium">{a.fullName}{a.isDefault ? " · Default" : ""}</p>
            <p>{a.line1}</p>
            {a.line2 && <p>{a.line2}</p>}
            <p>
              {a.city}
              {a.county ? `, ${a.county}` : ""} {a.postcode}
            </p>
          </li>
        ))}
      </ul>
      <h2 className="font-display text-2xl mb-4">Add address</h2>
      <AddressForm />
    </div>
  );
}
