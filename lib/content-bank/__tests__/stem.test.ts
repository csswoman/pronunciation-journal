import { describe, it, expect } from "vitest";
import { extractStemFromPayload } from "../stem";

describe("extractStemFromPayload", () => {
  it("extracts normalized stem from question", () => {
    const stem = extractStemFromPayload({ question: "What is your name?" });
    expect(stem).toBe("what is your name?");
  });

  it("returns null for empty payload", () => {
    const stem = extractStemFromPayload({});
    expect(stem).toBeNull();
  });
});
