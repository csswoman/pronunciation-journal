import { describe, expect, it } from "vitest";
import { attemptGrade } from "../../attempt-grade";
import { buildAssessment } from "../../verification/assessment";
import {
  buildCostCalibrationDataset,
  buildLatencyCalibrationDataset,
  DEFAULT_CALIBRATION_DATA_POLICY,
  DEFAULT_COST_FALLBACK,
  DEFAULT_LATENCY_FALLBACK,
  evaluateCalibrationGate,
  resolveCostEstimate,
  resolveLatencyThresholds,
  type CalibrationEvent,
} from "../dataset";
import type { InteractionTelemetry } from "../types";

const NOW = "2026-08-06T12:00:00.000Z";

function telemetry(
  overrides: Partial<InteractionTelemetry> = {},
): InteractionTelemetry {
  return {
    id: "tel-1",
    userId: "user-1",
    attemptId: "attempt-1",
    modality: "recognition",
    eventType: "scheduled-review",
    latencyMs: 3_000,
    interactionDurationMs: 9_000,
    correct: true,
    usedHints: false,
    rescued: false,
    acceptedVariant: false,
    firstTryFailed: false,
    freeAudioReplays: 0,
    priorScheduleState: "Review",
    occurredAt: NOW,
    telemetrySchemaVersion: "calibration-telemetry-v1",
    source: "empirical",
    ...overrides,
  };
}

function event(overrides: Partial<InteractionTelemetry> = {}): CalibrationEvent {
  return { telemetry: telemetry(overrides) };
}

describe("buildCostCalibrationDataset", () => {
  it("C/H: practice con hints e incorrectas pueden entrar en coste", () => {
    const dataset = buildCostCalibrationDataset([
      event({
        id: "a",
        attemptId: "a",
        eventType: "practice",
        usedHints: true,
        correct: false,
        interactionDurationMs: 15_000,
      }),
      event({
        id: "b",
        attemptId: "b",
        correct: false,
        interactionDurationMs: 11_000,
      }),
    ], DEFAULT_CALIBRATION_DATA_POLICY);

    expect(dataset.byModality.recognition.sampleCount).toBe(2);
    expect(dataset.byModality.recognition.values).toEqual([15_000, 11_000]);
  });

  it("I: technicalFailure/debug/interrupted quedan fuera del coste", () => {
    const dataset = buildCostCalibrationDataset([
      event({ technicalFailure: true }),
      event({ id: "d", attemptId: "d", debugSession: true }),
      event({ id: "i", attemptId: "i", interrupted: true }),
      event({ id: "ok", attemptId: "ok", interactionDurationMs: 8_000 }),
    ], DEFAULT_CALIBRATION_DATA_POLICY);

    expect(dataset.byModality.recognition.sampleCount).toBe(1);
    expect(dataset.byModality.recognition.values).toEqual([8_000]);
  });

  it("deduplica por attemptId", () => {
    const dataset = buildCostCalibrationDataset([
      event({ id: "1", attemptId: "same", interactionDurationMs: 8_000 }),
      event({ id: "2", attemptId: "same", interactionDurationMs: 99_000 }),
    ], DEFAULT_CALIBRATION_DATA_POLICY);
    expect(dataset.byModality.recognition.sampleCount).toBe(1);
    expect(dataset.byModality.recognition.values).toEqual([8_000]);
  });
});

describe("buildLatencyCalibrationDataset", () => {
  it("solo conserva muestras autónomas correctas", () => {
    const dataset = buildLatencyCalibrationDataset([
      event({ id: "ok", attemptId: "ok", latencyMs: 4_000 }),
      event({ id: "hint", attemptId: "hint", usedHints: true, latencyMs: 90_000 }),
      event({ id: "wrong", attemptId: "wrong", correct: false, latencyMs: 2_000 }),
      event({
        id: "learning",
        attemptId: "learning",
        priorScheduleState: "Learning",
        latencyMs: 2_000,
      }),
    ], DEFAULT_CALIBRATION_DATA_POLICY);

    expect(dataset.byModality.recognition.values).toEqual([4_000]);
  });
});

describe("fallback versionado", () => {
  it("O: fallback sigue disponible cuando dataset es insufficient-data", () => {
    const gate = evaluateCalibrationGate([], DEFAULT_CALIBRATION_DATA_POLICY);
    expect(gate.status).toBe("insufficient-data");

    const costs = resolveCostEstimate(gate, DEFAULT_COST_FALLBACK);
    const latency = resolveLatencyThresholds(gate, DEFAULT_LATENCY_FALLBACK);

    expect(costs.provenance).toBe("fallback");
    expect(latency.provenance).toBe("fallback");
    expect(costs.byModality.recognition).toBe(DEFAULT_COST_FALLBACK.byModality.recognition);
    expect(latency.byModality.listening).toBe(DEFAULT_LATENCY_FALLBACK.byModality.listening);
  });
});

describe("instrumentación observational-only", () => {
  it("R: instrumentación no cambia grading", () => {
    const outcome = {
      correct: true,
      hintsUsed: 0,
      rescued: false,
      typo: false,
      firstTryFailed: false,
      latencyMs: 3_000,
    };
    const before = attemptGrade(outcome);
    const assessment = buildAssessment(outcome, "recognition", {
      interactionDurationMs: 9_000,
    });
    const after = attemptGrade(outcome);

    expect(before).toBe(after);
    expect(assessment.grade).toBe(before);
    expect(assessment.interactionDurationMs).toBeGreaterThanOrEqual(assessment.latencyMs);
  });
});
