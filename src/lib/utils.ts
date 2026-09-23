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
