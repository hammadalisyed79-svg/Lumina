import { describe, expect, it } from "vitest";
import { textSuggestsPlan } from "@/lib/product-images";

describe("textSuggestsPlan", () => {
  it("detects plan / flat metreage cues", () => {
    expect(textSuggestsPlan({ url: "/media/x.jpg", alt: "Fabric plan view" })).toBe(
      true
    );
    expect(
      textSuggestsPlan({ url: "/media/flat-lay-swatch.jpg", alt: "Velvet" })
    ).toBe(true);
    expect(textSuggestsPlan({ url: "/media/x.jpg", alt: "metreage detail" })).toBe(
      true
    );
  });

  it("detects wrinkle / drape cues", () => {
    expect(textSuggestsPlan({ url: "/media/x.jpg", alt: "Draped velvet swirl" })).toBe(
      false
    );
    expect(
      textSuggestsPlan({ url: "/media/lifestyle-room.jpg", alt: "In situ" })
    ).toBe(false);
  });

  it("does not treat plant as plan", () => {
    expect(
      textSuggestsPlan({
        url: "/media/02.jpg",
        alt: "Floral plant pattern velvet",
      })
    ).toBeNull();
  });
});
