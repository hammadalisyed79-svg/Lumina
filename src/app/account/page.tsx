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
    <div className="container-site py-12 max-w-2xl">
      <h1 className="font-display text-4xl mb-2">Account</h1>
      <p className="prose-muted mb-8">Signed in as {session.user.email}</p>
      <ul className="space-y-3">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="block border border-[color:var(--line)] p-4 hover:border-[color:var(--bronze)] bg-white/50">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
      {session.user.role === "ADMIN" && (
        <Link href="/admin" className="btn-primary mt-8 inline-flex">
          Admin dashboard
        </Link>
      )}
      <form action="/api/auth/signout" method="POST" className="mt-6">
        <Link href="/api/auth/signout" className="text-sm underline text-[color:var(--muted)]">
          Sign out via menu — use the button below
        </Link>
      </form>
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
