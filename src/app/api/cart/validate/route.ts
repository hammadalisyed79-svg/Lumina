import { NextResponse } from "next/server";
import { z } from "zod";
import {
  validateCartLines,
  type CartValidateInput,
} from "@/lib/cart/validate";

const lineSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("configured"),
    quantity: z.number().int().min(1).max(20),
    clientLineId: z.string().optional(),
    config: z.object({
      shapeKey: z.string().min(1),
      sizeSlug: z.string().min(1),
      fabricSlug: z.string().min(1),
      liningSlug: z.string().min(1),
      fittingSlug: z.string().min(1),
      useType: z.string().nullable().optional(),
      personalisation: z.string().max(200).optional(),
      unitPrice: z.number().optional(),
    }),
  }),
  z.object({
    kind: z.literal("product"),
    quantity: z.number().int().min(1).max(20),
    clientLineId: z.string().optional(),
    productId: z.string().min(1),
    variantId: z.string().optional(),
  }),
]);

const schema = z.object({
  lines: z.array(lineSchema).min(1).max(40),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid cart payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await validateCartLines(parsed.data.lines as CartValidateInput[]);
  return NextResponse.json(result, { status: result.ok ? 200 : 409 });
}
