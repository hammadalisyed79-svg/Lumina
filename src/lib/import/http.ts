const BASE = "https://www.luminahub.co.uk";

export async function fetchJson<T>(
  url: string,
  opts?: { retries?: number; timeoutMs?: number }
): Promise<T> {
  const retries = opts?.retries ?? 3;
  const timeoutMs = opts?.timeoutMs ?? 45_000;
  let lastErr: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      const res = await fetch(url, {
        headers: {
          "User-Agent": "LuminaHubCatalogueMigration/1.0 (+owner migration)",
          Accept: "application/json",
        },
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (res.status === 429 || res.status >= 500) {
        throw new Error(`HTTP ${res.status}`);
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
      return (await res.json()) as T;
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
      const delay = 600 * Math.pow(2, attempt) + Math.floor(Math.random() * 200);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr || new Error(`Failed ${url}`);
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export { BASE };
