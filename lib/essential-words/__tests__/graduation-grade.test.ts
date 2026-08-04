import { describe, expect, it } from "vitest";
import { graduationGrade, LOW_LATENCY_MS } from "../graduation-grade";

describe("graduationGrade", () => {
  it("returns Easy for clean, fast cloze_sentence performance", () => {
    expect(
      graduationGrade({ hintsUsed: 0, latencyMs: LOW_LATENCY_MS - 1, mode: "cloze_sentence" }),
    ).toBe("Easy");
  });

  it("returns Easy for clean, fast dictation_sentence performance", () => {
    expect(
      graduationGrade({
        hintsUsed: 0,
        latencyMs: LOW_LATENCY_MS - 1,
        mode: "dictation_sentence",
      }),
    ).toBe("Easy");
  });

  it("returns Good when latency is not low", () => {
    expect(
      graduationGrade({ hintsUsed: 0, latencyMs: LOW_LATENCY_MS + 1, mode: "cloze_sentence" }),
    ).toBe("Good");
  });

  it("returns Good when any hint was used", () => {
    expect(graduationGrade({ hintsUsed: 1, latencyMs: 500, mode: "cloze_sentence" })).toBe("Good");
  });

  it("caps speak_sentence at Good", () => {
    expect(
      graduationGrade({ hintsUsed: 0, latencyMs: LOW_LATENCY_MS - 1, mode: "speak_sentence" }),
    ).toBe("Good");
  });

  it("caps recall_translation at Good", () => {
    expect(
      graduationGrade({ hintsUsed: 0, latencyMs: LOW_LATENCY_MS - 1, mode: "recall_translation" }),
    ).toBe("Good");
  });

  it("never returns Again or Hard", () => {
    const modes = [
      "cloze_sentence",
      "dictation_sentence",
      "speak_sentence",
      "recall_translation",
    ] as const;
    for (const mode of modes) {
      for (const hintsUsed of [0, 1, 3]) {
        expect(["Easy", "Good"]).toContain(
          graduationGrade({ hintsUsed, latencyMs: 1000, mode }),
        );
      }
    }
  });
});
