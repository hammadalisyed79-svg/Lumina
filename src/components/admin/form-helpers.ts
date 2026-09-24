export function fdStr(fd: FormData, key: string) {
  return String(fd.get(key) || "").trim();
}

export function fdNum(fd: FormData, key: string, fallback = 0) {
  const n = Number(fd.get(key));
  return Number.isFinite(n) ? n : fallback;
}

export function fdNumOrNull(fd: FormData, key: string): number | null {
  const raw = String(fd.get(key) ?? "").trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function fdChecked(fd: FormData, key: string) {
  return fd.get(key) === "on";
}
