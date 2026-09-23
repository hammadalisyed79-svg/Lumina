import { prisma } from "@/lib/db";
import { ProductCreateForm } from "@/components/admin/ProductCreateForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const fabrics = await prisma.fabric.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  return (
    <div>
      <h1 className="font-display text-4xl mb-8">New product</h1>
      <ProductCreateForm fabrics={fabrics.map((f) => ({ id: f.id, name: f.name }))} />
    </div>
  );
}
