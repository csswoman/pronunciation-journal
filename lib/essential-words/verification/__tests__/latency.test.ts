import { describe, expect, it } from "vitest";
import type { AttemptOutcome } from "../../attempt-grade";
import { buildAssessment } from "../assessment";
import {
  calibrateLatencyThresholds,
  LATENCY_THRESHOLDS_MS,
} from "../latency";
import type { AttemptAssessment, SrsReviewEvent } from "../types";

const outcome = (overrides: Partial<AttemptOutcome> = {}): AttemptOutcome => ({
  correct: true,
  hintsUsed: 0,
  rescued: false,
  typo: false,
  firstTryFailed: false,
  latencyMs: 10_000,
  ...overrides,
});

const event = (
  id: string,
  modality: AttemptAssessment["modality"],
  latencyMs: number,
  overrides: Partial<SrsReviewEvent["assessment"]> & Partial<SrsReviewEvent> = {},
): SrsReviewEvent => {
  const assessment: AttemptAssessment = {
    grade: "Good",
    modality,
    correct: true,
    latencyMs,
    interactionDurationMs: latencyMs,
    usedHints: false,
    rescued: false,
    acceptedVariant: false,
    firstTryFailed: false,
    freeAudioReplays: 0,
    ...overrides,
  };

  return {
    id,
    attemptLogId: `attempt-${id}`,
    learningItemId: `item-${id}`,
    grade: "Good",
    assessment,
    priorSchedule: { kind: "none" },
    resultingSchedule: {
      kind: "fsrs",
      dueAt: "2026-08-07T00:00:00.000Z",
      stability: 1,
      difficulty: 5,
      state: "Learning",
    },
    occurredAt: "2026-08-06T00:00:00.000Z",
    affectsSchedule: true,
    fsrsAudit: { schedulerVersion: "test", desiredRetention: 0.9 },
    ...overrides,
  };
};

describe("umbrales de latencia por modalidad", () => {
  it("declara un umbral inicial para cada modalidad", () => {
    expect(LATENCY_THRESHOLDS_MS).toEqual({
      recognition: 8_000,
      production: 25_000,
      listening: 30_000,
      pronunciation: 20_000,
    });
  });

  it("la misma latencia puede ser rápida en producción y lenta en reconocimiento", () => {
    const context = { interactionDurationMs: 12_000 };

    expect(buildAssessment(outcome(), "production", context).grade).toBe("Easy");
    expect(buildAssessment(outcome(), "recognition", context).grade).toBe("Good");
  });

  it("Again y Hard conservan su causa pedagógica", () => {
    const context = { interactionDurationMs: 1_000 };

    expect(buildAssessment(outcome({ hintsUsed: 1 }), "recognition", context).grade).toBe("Hard");
    expect(buildAssessment(outcome({ rescued: true }), "production", context).grade).toBe("Again");
  });
});

describe("calibrateLatencyThresholds", () => {
  it("excluye muestras asistidas de la calibración", () => {
    const thresholds = calibrateLatencyThresholds([
      event("one", "recognition", 4_000),
      event("two", "recognition", 6_000),
      event("hint", "recognition", 90_000, { usedHints: true }),
      event("rescue", "recognition", 90_000, { rescued: true }),
      event("variant", "recognition", 90_000, { acceptedVariant: true }),
      event("first-fail", "recognition", 90_000, { firstTryFailed: true }),
      event("replay", "recognition", 90_000, { freeAudioReplays: 1 }),
      event("hard", "recognition", 90_000, { grade: "Hard" }),
    ], LATENCY_THRESHOLDS_MS, 2);

    expect(thresholds.recognition).toBe(5_000);
  });

  it("con menos del mínimo conserva el fallback", () => {
    const fallback = { ...LATENCY_THRESHOLDS_MS, listening: 27_000 };
    const thresholds = calibrateLatencyThresholds([
      event("one", "listening", 10_000),
    ], fallback, 2);

    expect(thresholds.listening).toBe(27_000);
  });

  it("calcula una mediana determinista por modalidad", () => {
    const samples = [
      event("a", "production", 16_000),
      event("b", "production", 8_000),
      event("c", "production", 24_000),
    ];

    expect(calibrateLatencyThresholds(samples, LATENCY_THRESHOLDS_MS, 3).production).toBe(16_000);
    expect(calibrateLatencyThresholds([...samples].reverse(), LATENCY_THRESHOLDS_MS, 3).production)
      .toBe(16_000);
  });
});
