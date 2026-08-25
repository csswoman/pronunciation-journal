import { describe, expect, it } from "vitest";
import { ILLUSTRATIONS } from "@/lib/illustrations/registry";

describe("ILLUSTRATIONS registry", () => {
  it("has a component for every declared key", () => {
    const keys = Object.keys(ILLUSTRATIONS);
    expect(keys).toContain("emptyVocabulario");
    for (const key of keys) {
      expect(ILLUSTRATIONS[key as keyof typeof ILLUSTRATIONS]).toBeTruthy();
    }
  });
});
