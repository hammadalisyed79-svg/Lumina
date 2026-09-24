"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function TrackingCopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 text-xs underline underline-offset-4 hover:text-bronze"
      onClick={copy}
    >
      {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
      {copied ? "Copied" : "Copy number"}
    </button>
  );
}
