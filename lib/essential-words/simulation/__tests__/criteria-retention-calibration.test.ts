import { describe, expect, it } from "vitest";
import type {
  AttemptEventType,
  AttemptLog,
  ItemSchedule,
  SrsReviewEvent,
} from "../../verification/types";
import {
  DEFAULT_CALIBRATION_Z_CRITICAL,
  meanRetrievabilityAtReview,
  retentionCalibrationWithinExpected,
} from "../criteria";

/**
 * Task 8.9i, Decisión 2 — C11 pasa a validar calibración (recalled vs
 * retrievability calculada), no un umbral fijo de producto. Ver
 * docs/superpowers/plans/notes/2026-08-07-fase8-9h-decision-record.md.
 */
function attempt(
  index: number,
  correct: boolean,
  eventType: AttemptEventType = "scheduled-review",
): AttemptLog {
  return {
    id: `attempt-${eventType}-${index}`,
    sessionId: `session-${index}`,
    wordId: `c1k:word-${index}`,
    assessment: {
      grade: correct ? "Good" : "Again",
      modality: "recognition",
      correct,
      latencyMs: 2_000,
      interactionDurationMs: 4_000,
      usedHints: false,
      rescued: false,
      acceptedVariant: false,
      firstTryFailed: false,
      freeAudioReplays: 0,
    },
    observations: [],
    eventType,
    occurredAt: "2026-08-01T00:00:00.000Z",
  };
}

function reviewSchedule(stability: number): ItemSchedule {
  return {
    kind: "fsrs",
    dueAt: "2026-08-01T00:00:00.000Z",
    stability,
    difficulty: 5,
    state: "Review",
  };
}

function event(
  source: AttemptLog,
  retrievabilityBeforeReview: number | undefined,
  priorSchedule: ItemSchedule = reviewSchedule(10),
): SrsReviewEvent {
  return {
    id: `event-${source.id}`,
    attemptLogId: source.id,
    learningItemId: `${source.wordId}#meaning`,
    grade: source.assessment.grade,
    assessment: source.assessment,
    priorSchedule,
    resultingSchedule: reviewSchedule(1),
    occurredAt: source.occurredAt,
    affectsSchedule: true,
    fsrsAudit: {
      schedulerVersion: "test",
      desiredRetention: 0.9,
      retrievabilityBeforeReview,
    },
  };
}

/** Builds n reviews with a fixed retrievability, exactly `correct` of them recalled. */
function calibratedSample(
  total: number,
  correctCount: number,
  retrievability: number,
  priorSchedule: ItemSchedule = reviewSchedule(10),
  startIndex = 0,
): { attempts: AttemptLog[]; events: SrsReviewEvent[] } {
  const attempts = Array.from({ length: total }, (_, index) => (
    attempt(startIndex + index, index < correctCount)
  ));
  return {
    attempts,
    events: attempts.map((source) => event(source, retrievability, priorSchedule)),
  };
}

describe("retentionCalibrationWithinExpected (C11, Task 8.9i)", () => {
  it("observed === expected exactamente => PASS con z=0", () => {
    const sample = calibratedSample(200, 180, 0.9); // 180/200 = 0.9 = retrievability

    const result = retentionCalibrationWithinExpected(sample.attempts, sample.events, 50);

    expect(result.passed).toBe(true);
    expect(result.sampleSize).toBe(200);
    expect(result.expectedRetention).toBeCloseTo(0.9, 9);
    expect(result.observedRetentionValue).toBeCloseTo(0.9, 9);
    expect(result.zScore).toBeCloseTo(0, 9);
  });

  it("calibrado con retrievability baja (no cerca de 0.90) igual PASA: C11 no exige 0.90", () => {
    // Mitad de las reviews a R=0.6, mitad a R=0.95 -> expected = 0.775.
    // observed también 0.775 (155/200) -> perfectamente calibrado pese a
    // estar lejos de 0.90 en ambos lados. Esto es exactamente lo que
    // separa C11 (calibración) de meanRetrievabilityAtReview (scheduling).
    const low = calibratedSample(100, 60, 0.6, reviewSchedule(0.3), 0);
    const high = calibratedSample(100, 95, 0.95, reviewSchedule(10), 100);

    const result = retentionCalibrationWithinExpected(
      [...low.attempts, ...high.attempts],
      [...low.events, ...high.events],
      50,
    );

    expect(result.expectedRetention).toBeCloseTo(0.775, 5);
    expect(result.observedRetentionValue).toBeCloseTo(0.775, 5);
    expect(result.passed).toBe(true);
  });

  it("descalibrado: observed muy distinto de expected con n grande => FAIL", () => {
    // expected=0.9, pero solo la mitad de las reviews se marcan correctas:
    // esto es justo lo que un bug (p.ej. accuracyByModality filtrándose a
    // `correct`) produciría.
    const sample = calibratedSample(200, 100, 0.9);

    const result = retentionCalibrationWithinExpected(sample.attempts, sample.events, 50);

    expect(result.passed).toBe(false);
    expect(Math.abs(result.zScore ?? 0)).toBeGreaterThan(DEFAULT_CALIBRATION_Z_CRITICAL);
  });

  it("muestra insuficiente => FAIL explícito, no éxito vacuo", () => {
    const sample = calibratedSample(49, 44, 0.9);

    const result = retentionCalibrationWithinExpected(sample.attempts, sample.events, 50);

    expect(result).toMatchObject({ passed: false, sampleSize: 49, expectedRetention: null });
    expect(result.detail).toContain("insufficient-data");
  });

  it("excluye verification/learning-step/practice igual que el predicado canónico de C11", () => {
    const scheduled = calibratedSample(60, 54, 0.9);
    const nonEligible = calibratedSample(100, 0, 0.9, reviewSchedule(10), 1000);
    const nonEligibleAttempts = nonEligible.attempts.map((a) => (
      { ...a, eventType: "learning-step" as AttemptEventType }
    ));

    const result = retentionCalibrationWithinExpected(
      [...scheduled.attempts, ...nonEligibleAttempts],
      [...scheduled.events, ...nonEligible.events],
      50,
    );

    expect(result.sampleSize).toBe(60);
    expect(result.passed).toBe(true);
  });

  it("no usa thresholds por perfil ni accuracyByModality: la firma no los acepta", () => {
    // Prueba de contrato: la función solo toma (attempts, events, minimumReviews, zCriticalValue).
    expect(retentionCalibrationWithinExpected.length).toBeLessThanOrEqual(4);
  });
});

describe("meanRetrievabilityAtReview (métrica separada de scheduling, Task 8.9i)", () => {
  it("segmenta stable vs low-stability-post-lapse y nunca decide pass/fail", () => {
    const stable = calibratedSample(30, 27, 0.9, reviewSchedule(10), 0);
    const lowStability = calibratedSample(20, 13, 0.65, reviewSchedule(0.3), 1000);

    const segments = meanRetrievabilityAtReview([
      ...stable.attempts,
      ...lowStability.attempts,
    ], [
      ...stable.events,
      ...lowStability.events,
    ]);

    const stableSegment = segments.find((s) => s.segment === "stable");
    const lowSegment = segments.find((s) => s.segment === "low-stability-post-lapse");

    expect(stableSegment?.sampleSize).toBe(30);
    expect(stableSegment?.meanRetrievability).toBeCloseTo(0.9, 9);
    expect(lowSegment?.sampleSize).toBe(20);
    expect(lowSegment?.meanRetrievability).toBeCloseTo(0.65, 9);
    expect(stableSegment).not.toHaveProperty("passed");
  });

  it("no confunde una retrievability baja bien calibrada con un fallo de C11", () => {
    // Mismo escenario que el test de calibración baja arriba: C11 pasa,
    // pero la métrica de scheduling debe seguir revelando que el segmento
    // low-stability está lejos de 0.90.
    const lowStability = calibratedSample(100, 60, 0.6, reviewSchedule(0.3));

    const c11 = retentionCalibrationWithinExpected(
      lowStability.attempts,
      lowStability.events,
      50,
    );
    const segments = meanRetrievabilityAtReview(lowStability.attempts, lowStability.events);
    const lowSegment = segments.find((s) => s.segment === "low-stability-post-lapse");

    expect(c11.passed).toBe(true);
    expect(lowSegment?.meanRetrievability).toBeCloseTo(0.6, 5);
    expect(lowSegment?.meanRetrievability).not.toBeCloseTo(0.9, 1);
  });
});
