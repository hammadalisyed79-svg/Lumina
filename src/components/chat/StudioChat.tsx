"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import Link from "next/link";

type Msg = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "How do I design a shade?",
  "What shapes do you offer?",
  "How does checkout work?",
  "Do you work with designers?",
];

export function StudioChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hello — I’m the Lumina Hub studio assistant. Ask about shapes, fabrics, Design your shade, trade, or checkout.",
    },
  ]);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, loading]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    setError("");
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.filter((m) => m.role === "user" || m.role === "assistant").slice(-12),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setError("Could not reach the studio assistant.");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void send(input);
  }

  return (
    <div className="fixed bottom-[max(5.25rem,calc(env(safe-area-inset-bottom)+4.5rem))] right-[max(1.25rem,env(safe-area-inset-right))] z-40 flex flex-col items-end gap-3 md:bottom-[max(1.25rem,env(safe-area-inset-bottom))]">
      {open && (
        <div
          className="flex w-[min(100vw-2rem,380px)] h-[min(70vh,520px)] flex-col overflow-hidden border border-line bg-ivory shadow-[0_18px_50px_rgba(20,17,14,0.14)]"
          role="dialog"
          aria-label="Studio chat"
        >
          <div className="flex items-start justify-between gap-3 border-b border-line bg-charcoal px-4 py-3 text-ivory">
            <div>
              <p className="text-[10px] tracking-[0.18em] uppercase text-champagne">Studio</p>
              <p className="font-display text-xl tracking-tight">Ask Lumina Hub</p>
            </div>
            <button
              type="button"
              aria-label="Close chat"
              className="mt-1 text-ivory/80 hover:text-ivory"
              onClick={() => setOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          <div ref={scroller} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={`max-w-[92%] text-sm leading-relaxed ${
                  m.role === "user"
                    ? "ml-auto bg-ink text-ivory px-3 py-2"
                    : "mr-auto bg-stone/60 text-ink px-3 py-2"
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <p className="text-xs tracking-[0.12em] uppercase text-muted">Thinking…</p>
            )}
            {error && <p className="text-sm text-red-700">{error}</p>}
          </div>

          {messages.length < 3 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="text-[11px] tracking-wide border border-line px-2 py-1 text-muted hover:border-bronze hover:text-ink"
                  onClick={() => void send(s)}
                  disabled={loading}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={onSubmit} className="border-t border-line p-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about shades, sizing, trade…"
              className="input !py-2.5 text-sm"
              disabled={loading}
              maxLength={1200}
              aria-label="Chat message"
            />
            <button
              type="submit"
              className="btn-primary !px-3 shrink-0"
              disabled={loading || !input.trim()}
              aria-label="Send"
            >
              <Send size={16} />
            </button>
          </form>
          <p className="px-3 pb-2 text-[10px] text-muted">
            Prefer a person?{" "}
            <Link href="/contact" className="underline hover:text-bronze" onClick={() => setOpen(false)}>
              Contact
            </Link>
          </p>
        </div>
      )}

      <button
        type="button"
        aria-label={open ? "Close studio chat" : "Open studio chat"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-12 w-12 items-center justify-center bg-ink text-ivory shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze"
      >
        {open ? <X size={20} strokeWidth={1.75} /> : <MessageCircle size={20} strokeWidth={1.75} />}
      </button>
    </div>
  );
}
