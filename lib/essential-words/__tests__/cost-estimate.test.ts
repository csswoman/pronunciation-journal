import { describe, expect, it } from "vitest";
import {
  DEFAULT_SECONDS_BY_MODALITY,
  estimateFromAttempts,
  estimateItemsSeconds,
} from "../cost-estimate";
import type { PlannedItem } from "../planning-types";
import type { AttemptLog, AttemptModality } from "../verification/types";

const item = (modality: AttemptModality): PlannedItem => ({
  itemId: `c1k:${modality}#meaning`,
  wordId: `c1k:${modality}`,
  skill: "meaning",
  modality,
  dueAt: "2026-08-06T00:00:00.000Z",
});

const attempt = (
  id: string,
  modality: AttemptModality,
  interactionDurationMs: number,
  eventType: AttemptLog["eventType"] = "scheduled-review",
): AttemptLog => ({
  id,
  sessionId: "session-1",
  wordId: "c1k:on",
  assessment: {
    grade: "Good",
    modality,
    correct: true,
    latencyMs: interactionDurationMs,
    interactionDurationMs,
    usedHints: false,
    rescued: false,
    acceptedVariant: false,
    firstTryFailed: false,
    freeAudioReplays: 0,
  },
  observations: [],
  eventType,
  occurredAt: "2026-08-06T00:00:00.000Z",
});

describe("estimateItemsSeconds", () => {
  it("suma el coste de cada modalidad planificada", () => {
    expect(estimateItemsSeconds([
      item("recognition"),
      item("production"),
      item("listening"),
    ], DEFAULT_SECONDS_BY_MODALITY)).toBe(57);
  });
});

describe("estimateFromAttempts", () => {
  it("declara un coste inicial por modalidad", () => {
    expect(DEFAULT_SECONDS_BY_MODALITY.listening)
      .toBeGreaterThan(DEFAULT_SECONDS_BY_MODALITY.recognition);
  });

  it("cuenta una producción una sola vez aunque aparezca dos veces", () => {
    const production = attempt("attempt-production", "production", 25_000);

    expect(estimateFromAttempts(
      [production, { ...production }],
      DEFAULT_SECONDS_BY_MODALITY,
      1,
    ).production).toBe(25);
  });

  it("conserva el fallback cuando una modalidad tiene menos muestras del mínimo", () => {
    const estimates = estimateFromAttempts([
      attempt("attempt-listening", "listening", 10_000),
    ], DEFAULT_SECONDS_BY_MODALITY, 2);

    expect(estimates.listening).toBe(DEFAULT_SECONDS_BY_MODALITY.listening);
  });

  it("calibra cada modalidad de forma independiente desde interactionDurationMs", () => {
    const estimates = estimateFromAttempts([
      attempt("attempt-recognition-1", "recognition", 10_000),
      attempt("attempt-recognition-2", "recognition", 14_000),
      attempt("attempt-listening-1", "listening", 30_000),
      attempt("attempt-listening-2", "listening", 34_000),
    ], DEFAULT_SECONDS_BY_MODALITY, 2);

    expect(estimates.recognition).toBe(12);
    expect(estimates.listening).toBe(32);
    expect(estimates.production).toBe(DEFAULT_SECONDS_BY_MODALITY.production);
  });

  it("excluye la práctica intra-sesión del coste SRS", () => {
    const estimates = estimateFromAttempts([
      attempt("practice-production", "production", 90_000, "practice"),
      attempt("scheduled-production", "production", 20_000),
    ], DEFAULT_SECONDS_BY_MODALITY, 1);

    expect(estimates.production).toBe(20);
  });
});
