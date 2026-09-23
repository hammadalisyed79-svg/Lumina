import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(
  amount: number | string | { toNumber?: () => number; toString: () => string },
  currency = "GBP",
  locale = "en-GB",
): string {
  let n: number;
  if (typeof amount === "number") n = amount;
  else if (typeof amount === "string") n = Number(amount);
  else if (amount && typeof amount.toNumber === "function") n = amount.toNumber();
  else n = Number(amount.toString());
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(n);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function orderNumber(): string {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `LH-${stamp}-${rand}`;
}

/** Short shop/card title — does not alter stored product descriptions. */
export function shortDisplayTitle(title: string, max = 52): string {
  let t = String(title || "")
    .replace(/^(handmade by order|made by order|print by order|circular)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
  // Drop trailing catalogue boilerplate
  t = t
    .replace(/\b(all shapes?( and sizes)?|all sizes?( and shapes)?|available|on demand|custom size|sold by (the )?meter|140cm wide)\b/gi, "")
    .replace(/[·|,/-]+\s*$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (t.length <= max) return t || title;
  const cut = t.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 24 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

export function isWebImageUrl(url?: string | null): boolean {
  if (!url) return false;
  const u = url.toLowerCase();
  return !u.includes(".heic") && !u.includes("placeholder") && !u.includes("/demo-assets/");
}
