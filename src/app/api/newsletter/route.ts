import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  try {
    getDb()
      .prepare(`INSERT INTO newsletter (email) VALUES (?)`)
      .run(parsed.data.email.toLowerCase());
  } catch {
    return NextResponse.json({ ok: true, already: true });
  }
  return NextResponse.json({ ok: true });
}
