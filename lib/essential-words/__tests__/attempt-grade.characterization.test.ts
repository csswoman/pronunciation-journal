import { describe, it, expect } from "vitest";
import { attemptGrade, gradeToLegacyQuality, LOW_LATENCY_MS, type AttemptOutcome } from "../attempt-grade";

const outcome = (over: Partial<AttemptOutcome> = {}): AttemptOutcome => ({
  correct: true,
  hintsUsed: 0,
  rescued: false,
  typo: false,
  firstTryFailed: false,
  latencyMs: 1_000,
  ...over,
});

describe("attemptGrade — caracterización del comportamiento actual", () => {
  it("rescatado siempre es Again, incluso si la respuesta fue correcta", () => {
    expect(attemptGrade(outcome({ rescued: true, correct: true }))).toBe("Again");
  });

  it("fallo en el primer intento es Again aunque el retry acierte", () => {
    expect(attemptGrade(outcome({ firstTryFailed: true }))).toBe("Again");
  });

  it("dos o más pistas de pago son Again", () => {
    expect(attemptGrade(outcome({ hintsUsed: 2 }))).toBe("Again");
    expect(attemptGrade(outcome({ hintsUsed: 5 }))).toBe("Again");
  });

  it("una pista de pago es Hard", () => {
    expect(attemptGrade(outcome({ hintsUsed: 1 }))).toBe("Hard");
  });

  it("incorrecta sin pistas es Again", () => {
    expect(attemptGrade(outcome({ correct: false }))).toBe("Again");
  });

  it("correcta y rápida es Easy; el umbral es 25s", () => {
    expect(LOW_LATENCY_MS).toBe(25_000);
    expect(attemptGrade(outcome({ latencyMs: LOW_LATENCY_MS - 1 }))).toBe("Easy");
    expect(attemptGrade(outcome({ latencyMs: LOW_LATENCY_MS }))).toBe("Good");
  });

  it("typo no es una rama: se trata como correcta por el llamante", () => {
    expect(attemptGrade(outcome({ typo: true, correct: true }))).toBe("Easy");
  });

  it("el puente a quality 0-5 mantiene el corte en 3 = aprobado", () => {
    expect(gradeToLegacyQuality("Again")).toBe(2);
    expect(gradeToLegacyQuality("Hard")).toBe(3);
    expect(gradeToLegacyQuality("Good")).toBe(4);
    expect(gradeToLegacyQuality("Easy")).toBe(5);
  });
});
