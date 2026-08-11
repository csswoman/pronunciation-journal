import { describe, expect, it } from "vitest";
import { attributionForRenderedAttempt } from "../runtime-attribution";
import type { AttemptOutcome } from "../attempt-grade";

const outcome = (overrides: Partial<AttemptOutcome> = {}): AttemptOutcome => ({
  correct: true,
  hintsUsed: 0,
  rescued: false,
  typo: false,
  firstTryFailed: false,
  latencyMs: 3_000,
  ...overrides,
});

describe("attributionForRenderedAttempt", () => {
  it("acredita un dictado a listening y production, no a meaning", () => {
    const attribution = attributionForRenderedAttempt("dictation_sentence", outcome({
      evidencia: [
        { habilidad: "listening", veredicto: "acierto" },
        { habilidad: "production", veredicto: "fallo" },
      ],
      resultado: "casi",
    }));

    expect(attribution.assessment.modality).toBe("listening");
    expect(attribution.observations).toEqual([
      expect.objectContaining({ skill: "listening", outcome: "success" }),
      expect.objectContaining({ skill: "production", outcome: "failure" }),
    ]);
    expect(attribution.assessmentsBySkill?.production?.grade).toBe("Hard");
  });

  it("deriva la modalidad de lo mostrado, no de un item previamente planificado", () => {
    expect(attributionForRenderedAttempt("recognize_audio", outcome()).assessment.modality)
      .toBe("listening");
    expect(attributionForRenderedAttempt("listening_cloze_sentence", outcome()).assessment.modality)
      .toBe("listening");
    expect(attributionForRenderedAttempt("recall_translation", outcome()).assessment.modality)
      .toBe("production");
  });
});
