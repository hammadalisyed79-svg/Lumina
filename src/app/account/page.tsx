import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

const TRADE_LABEL: Record<string, string> = {
  NEW: "Received",
  PENDING: "Pending review",
  REVIEWING: "Under review",
  APPROVED: "Approved",
  REJECTED: "Not approved",
};

export default async function AccountIndexPage() {
  const session = await auth();
  if (!session?.user) redirect("/account/login");

  const email = session.user.email || "";
  const tradeApp = await prisma.tradeApplication.findFirst({
    where: {
      OR: [
        ...(session.user.id ? [{ userId: session.user.id }] : []),
        ...(email ? [{ email: { equals: email, mode: "insensitive" as const } }] : []),
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  const links = [
    { href: "/account/orders", label: "Orders" },
    { href: "/account/addresses", label: "Addresses" },
    { href: "/account/wishlist", label: "Wishlist" },
    { href: "/account/saved-designs", label: "Saved designs" },
    { href: "/account/profile", label: "Profile" },
  ];

  return (
    <div className="container-site section-pad max-w-2xl">
      <p className="eyebrow mb-3">Your studio</p>
      <h1 className="section-title mb-3">Account</h1>
      <div className="lux-rule" />
      <p className="prose-muted mb-10">Signed in as {session.user.email}</p>

      <div className="surface-panel p-5 mb-8">
        <p className="eyebrow mb-2">Trade</p>
        {tradeApp ? (
          <>
            <p className="font-display text-xl mb-1">{tradeApp.businessName}</p>
            <p className="text-sm mb-3">
              Status:{" "}
              <span className="font-medium">
                {TRADE_LABEL[tradeApp.status] || tradeApp.status}
              </span>
            </p>
            <p className="prose-muted text-sm mb-0">
              Submitted {tradeApp.createdAt.toLocaleDateString("en-GB")}
              {tradeApp.status === "APPROVED" && tradeApp.tradePricingEnabled
                ? " · Trade pricing is active on your account."
                : tradeApp.status === "APPROVED"
                  ? " · Our team will confirm pricing shortly."
                  : tradeApp.status === "REJECTED"
                    ? " · Questions? Email the studio."
                    : " · We typically reply within a few working days."}
            </p>
            {tradeApp.status === "REJECTED" && (
              <Link href="/trade" className="btn-secondary mt-4 inline-flex text-sm">
                Apply again
              </Link>
            )}
          </>
        ) : (
          <>
            <p className="prose-muted text-sm mb-4">
              Interior designers and retailers can request trade terms.
            </p>
            <Link href="/trade" className="btn-secondary inline-flex text-sm">
              Apply for trade
            </Link>
          </>
        )}
      </div>

      <ul className="space-y-3">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="block surface-panel p-5 transition-colors hover:border-bronze group"
            >
              <span className="font-display text-lg group-hover:text-bronze transition-colors">
                {l.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {(session.user.role === "ADMIN" ||
        session.user.role === "SUPER_ADMIN" ||
        session.user.role === "STAFF") && (
        <Link href="/admin" className="btn-primary mt-10 inline-flex">
          Admin dashboard
        </Link>
      )}
      <SignOutButton />
    </div>
  );
}

function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        const { signOut } = await import("@/lib/auth");
        await signOut({ redirectTo: "/" });
      }}
    >
      <button type="submit" className="btn-secondary mt-4">
        Sign out
      </button>
    </form>
  );
}
