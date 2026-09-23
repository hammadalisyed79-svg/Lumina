import { Role } from "@prisma/client";
import { prisma } from "../src/lib/db";
import { seedPermissions } from "../src/lib/auth/permissions";

async function main() {
  await seedPermissions();
  const email = (process.env.ADMIN_EMAIL || "admin@luminahub.co.uk").toLowerCase();
  const updated = await prisma.user.updateMany({
    where: { email },
    data: { role: Role.SUPER_ADMIN },
  });
  console.log(`Permissions seeded. Admin promoted: ${updated.count} (${email})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
