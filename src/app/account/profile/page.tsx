import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { ProfileForm } from "@/components/account/ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await requireUser();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });

  return (
    <div className="container-site py-12 max-w-lg">
      <Link href="/account" className="text-sm text-[color:var(--muted)]">← Account</Link>
      <h1 className="font-display text-4xl mt-4 mb-8">Profile</h1>
      <ProfileForm name={user.name || ""} phone={user.phone || ""} email={user.email} />
    </div>
  );
}
