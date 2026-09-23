import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AccountIndexPage() {
  const session = await auth();
  if (!session?.user) redirect("/account/login");

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
