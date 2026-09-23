import { NextResponse } from "next/server";
import OpenAI from "openai";
import { buildStudioKnowledge } from "@/lib/chat/knowledge";

export const runtime = "nodejs";

type ChatMessage = { role: "user" | "assistant"; content: string };

const MAX_HISTORY = 12;
const MAX_CONTENT = 1200;

function getClient() {
  let key =
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.OPENAI_KEY?.trim() ||
    "";
  // Tolerate accidental wrappers from paste: quotes or "openai KEY: …"
  key = key.replace(/^["']|["']$/g, "");
  key = key.replace(/^openai\s*key\s*[:=]\s*/i, "").trim();
  if (!key || key.includes("placeholder") || key === "sk-...") {
    if (process.env.VERCEL) {
      console.error(
        "[chat] OPENAI_API_KEY missing in this deployment. Set it in Vercel → Settings → Environment Variables (Production) and Redeploy."
      );
    }
    return null;
  }
  return new OpenAI({ apiKey: key });
}

export async function POST(req: Request) {
  const client = getClient();
  if (!client) {
    return NextResponse.json(
      { error: "Studio chat is not configured yet." },
      { status: 503 }
    );
  }

  let body: { messages?: ChatMessage[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const incoming = Array.isArray(body.messages) ? body.messages : [];
  const cleaned: ChatMessage[] = [];
  for (const m of incoming.slice(-MAX_HISTORY)) {
    if (!m || (m.role !== "user" && m.role !== "assistant")) continue;
    const content = String(m.content || "").trim().slice(0, MAX_CONTENT);
    if (!content) continue;
    cleaned.push({ role: m.role, content });
  }

  if (!cleaned.length || cleaned[cleaned.length - 1]?.role !== "user") {
    return NextResponse.json({ error: "Send a message to continue." }, { status: 400 });
  }

  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini",
      temperature: 0.45,
      max_tokens: 420,
      messages: [
        { role: "system", content: buildStudioKnowledge() },
        ...cleaned,
      ],
    });

    const reply =
      completion.choices[0]?.message?.content?.trim() ||
      "I’m sorry — I couldn’t form a reply. Please try again or contact the studio.";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[chat]", err instanceof Error ? err.message : "unknown");
    return NextResponse.json(
      { error: "The studio assistant is briefly unavailable. Please try again shortly." },
      { status: 502 }
    );
  }
}
