/** Lightweight analytics hooks — no credentials required. */

type Payload = Record<string, unknown>;

export function trackConfigurator(event: string, payload: Payload = {}) {
  if (typeof window === "undefined") return;
  try {
    const detail = { event, ...payload, t: Date.now() };
    window.dispatchEvent(new CustomEvent("lumina:configurator", { detail }));
    const w = window as Window & { dataLayer?: Payload[] };
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ event: `configurator_${event}`, ...payload });
  } catch {
    /* no-op */
  }
}
