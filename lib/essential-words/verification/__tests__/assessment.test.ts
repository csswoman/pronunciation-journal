import { describe, expect, it } from "vitest";
import type { AttemptOutcome } from "../../attempt-grade";
import { buildAssessment } from "../assessment";

const outcome = (overrides: Partial<AttemptOutcome> = {}): AttemptOutcome => ({
  correct: true,
  hintsUsed: 0,
  rescued: false,
  typo: false,
  firstTryFailed: false,
  latencyMs: 3_000,
  ...overrides,
});

describe("buildAssessment", () => {
  it("preserva el grade base", () => {
    expect(buildAssessment(outcome(), "recognition", {
      interactionDurationMs: 8_000,
    }).grade).toBe("Easy");
    expect(buildAssessment(outcome({ hintsUsed: 1 }), "recognition", {
      interactionDurationMs: 8_000,
    }).grade).toBe("Hard");
  });

  it("conserva la modalidad del intento", () => {
    expect(buildAssessment(outcome(), "listening", {
      interactionDurationMs: 8_000,
    }).modality).toBe("listening");
  });

  it("nunca deja la duracion total por debajo de la latencia", () => {
    const assessment = buildAssessment(outcome({ latencyMs: 9_000 }), "production", {
      interactionDurationMs: 2_000,
    });

    expect(assessment.interactionDurationMs).toBe(9_000);
  });

  it("marca un typo aceptado como correcto y como variante aceptada", () => {
    const assessment = buildAssessment(outcome({ typo: true }), "production", {
      interactionDurationMs: 8_000,
    });

    expect(assessment.correct).toBe(true);
    expect(assessment.acceptedVariant).toBe(true);
  });

  it("una respuesta revelada o un primer fallo nunca reciben Easy ni Good", () => {
    const rescued = buildAssessment(outcome({ rescued: true }), "recognition", {
      interactionDurationMs: 8_000,
    });
    const retry = buildAssessment(outcome({ firstTryFailed: true }), "recognition", {
      interactionDurationMs: 8_000,
    });

    expect(rescued.grade).toBe("Again");
    expect(retry.grade).toBe("Again");
  });

  it("conserva los replays gratuitos sin convertirlos en pistas de pago", () => {
    const assessment = buildAssessment(outcome(), "listening", {
      interactionDurationMs: 8_000,
      freeAudioReplays: 3,
    });

    expect(assessment.freeAudioReplays).toBe(3);
    expect(assessment.usedHints).toBe(false);
  });

  it("conserva firstTryFailed de forma explicita", () => {
    expect(buildAssessment(outcome({ firstTryFailed: true }), "production", {
      interactionDurationMs: 8_000,
    }).firstTryFailed).toBe(true);
  });
});
