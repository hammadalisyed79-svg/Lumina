import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  subject: z.string().optional(),
  message: z.string().min(5),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }
  const { name, email, subject, message } = parsed.data;
  const result = getDb()
    .prepare(
      `INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)`
    )
    .run(name, email, subject || null, message);
  return NextResponse.json({ ok: true, id: result.lastInsertRowid });
}

export async function GET() {
  const messages = getDb()
    .prepare("SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 100")
    .all();
  return NextResponse.json({ messages });
}
