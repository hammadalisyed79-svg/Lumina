import { prisma } from "@/lib/db";

export async function writeAuditLog(input: {
  userId?: string | null;
  action: string;
  entity?: string;
  entityId?: string;
  meta?: unknown;
  ip?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? undefined,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        meta: input.meta as object | undefined,
        ip: input.ip,
      },
    });
  } catch {
    // Never block primary flows on audit failure
  }
}
