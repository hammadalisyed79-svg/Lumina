import Link from "next/link";
import { CollectionCreateForm } from "@/components/admin/CollectionForm";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsNewPage() {
  return (
    <div>
      <Link href="/admin/collections" className="admin-muted text-sm hover:underline">
        ← Collections
      </Link>
      <h1 className="admin-h1 mt-3">New collection</h1>
      <p className="admin-muted mb-6">Create a collection, then assign products on the edit screen.</p>
      <CollectionCreateForm />
    </div>
  );
}
