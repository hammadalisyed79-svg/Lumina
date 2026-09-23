import { prisma } from "@/lib/db";
import { ProductCreateForm } from "@/components/admin/ProductCreateForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const fabrics = await prisma.fabric.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  return (
    <div>
      <h1 className="admin-h1">New product</h1>
      <p className="admin-muted mb-6">Create a catalogue entry with pricing and options.</p>
      <ProductCreateForm fabrics={fabrics.map((f) => ({ id: f.id, name: f.name }))} />
    </div>
  );
}
