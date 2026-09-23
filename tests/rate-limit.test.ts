import { describe, expect, it } from "vitest";
import { rateLimit } from "../src/lib/security/rate-limit";

describe("rate limit", () => {
  it("allows within limit then blocks", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      expect(rateLimit(key, 3, 60_000).ok).toBe(true);
    }
    expect(rateLimit(key, 3, 60_000).ok).toBe(false);
  });
});
