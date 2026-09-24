import { prisma } from "@/lib/db";

/**
 * Sequential order numbers: LH-000001, LH-000002, …
 * Uses a single-row counter table with atomic increment.
 */
export async function nextOrderNumber(): Promise<string> {
  const row = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      INSERT INTO "OrderSequence" ("id", "nextValue")
      VALUES (1, 1)
      ON CONFLICT ("id") DO NOTHING
    `;
    const updated = await tx.$queryRaw<{ nextValue: number }[]>`
      UPDATE "OrderSequence"
      SET "nextValue" = "nextValue" + 1
      WHERE "id" = 1
      RETURNING ("nextValue" - 1) AS "nextValue"
    `;
    return updated[0];
  });

  const n = row?.nextValue ?? 1;
  return `LH-${String(n).padStart(6, "0")}`;
}

/** Legacy helper kept for non-order contexts; prefer nextOrderNumber for orders. */
export function formatOrderNumber(n: number): string {
  return `LH-${String(n).padStart(6, "0")}`;
}
