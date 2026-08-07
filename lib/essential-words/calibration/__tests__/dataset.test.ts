import { describe, expect, it } from "vitest";
import {
  DEFAULT_CALIBRATION_DATA_POLICY,
  evaluateCalibrationGate,
  isAutonomousLatencySample,
  toInteractionTelemetry,
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

function eventsForGate(options: {
  modalitySamples?: number;
  users?: number;
  modalities?: InteractionTelemetry["modality"][];
  source?: InteractionTelemetry["source"];
}): CalibrationEvent[] {
  const modalities = options.modalities ?? [
    "recognition",
    "listening",
    "production",
    "pronunciation",
  ];
  const samples = options.modalitySamples ?? 200;
  const users = options.users ?? 20;
  const source = options.source ?? "empirical";
  const result: CalibrationEvent[] = [];

  for (const modality of modalities) {
    for (let index = 0; index < samples; index += 1) {
      result.push({
        telemetry: telemetry({
          id: `${modality}-${index}`,
          attemptId: `${modality}-attempt-${index}`,
          userId: `user-${(index % users) + 1}`,
          modality,
          latencyMs: 2_000 + (index % 5) * 100,
          interactionDurationMs: 8_000 + (index % 5) * 100,
          source,
        }),
      });
    }
  }
  return result;
}

describe("InteractionTelemetry mapping", () => {
  it("A: interactionDurationMs y latencyMs permanecen separados", () => {
    const mapped = toInteractionTelemetry({
      id: "attempt-1",
      sessionId: "session-1",
      wordId: "c1k:on",
      userId: "user-1",
      assessment: {
        grade: "Good",
        modality: "listening",
        correct: true,
        latencyMs: 4_000,
        interactionDurationMs: 12_000,
        usedHints: false,
        rescued: false,
        acceptedVariant: false,
        firstTryFailed: false,
        freeAudioReplays: 0,
      },
      observations: [],
      eventType: "scheduled-review",
      occurredAt: NOW,
    });

    expect(mapped.latencyMs).toBe(4_000);
    expect(mapped.interactionDurationMs).toBe(12_000);
    expect(mapped.latencyMs).not.toBe(mapped.interactionDurationMs);
  });

  it("B: interactionDurationMs >= latencyMs en una interacción válida", () => {
    const valid = telemetry({ latencyMs: 5_000, interactionDurationMs: 5_000 });
    expect(valid.interactionDurationMs).toBeGreaterThanOrEqual(valid.latencyMs);

    const mapped = toInteractionTelemetry({
      id: "attempt-2",
      sessionId: "session-1",
      wordId: "c1k:on",
      assessment: {
        grade: "Easy",
        modality: "recognition",
        correct: true,
        latencyMs: 2_000,
        interactionDurationMs: 1_500,
        usedHints: false,
        rescued: false,
        acceptedVariant: false,
        firstTryFailed: false,
        freeAudioReplays: 0,
      },
      observations: [],
      eventType: "verification",
      occurredAt: NOW,
    });
    expect(mapped.interactionDurationMs).toBeGreaterThanOrEqual(mapped.latencyMs);
  });

  it("Q: serialización de calibración no incluye contenido pedagógico", () => {
    const mapped = toInteractionTelemetry({
      id: "attempt-3",
      sessionId: "session-1",
      wordId: "c1k:secret-word",
      userId: "user-9",
      assessment: {
        grade: "Good",
        modality: "production",
        correct: true,
        latencyMs: 3_000,
        interactionDurationMs: 10_000,
        usedHints: false,
        rescued: false,
        acceptedVariant: false,
        firstTryFailed: false,
        freeAudioReplays: 0,
      },
      observations: [],
      eventType: "scheduled-review",
      occurredAt: NOW,
    });
    const keys = Object.keys(mapped);
    expect(keys).not.toEqual(expect.arrayContaining([
      "wordId",
      "observations",
      "sentence",
      "translation",
      "prompt",
      "answerText",
      "audioUrl",
    ]));
    expect(JSON.stringify(mapped)).not.toContain("secret-word");
  });
});

describe("isAutonomousLatencySample", () => {
  it("C: practice con hints puede ser coste válido pero no latencia autónoma", () => {
    const withHints = telemetry({
      eventType: "practice",
      usedHints: true,
      correct: false,
    });
    expect(isAutonomousLatencySample(withHints)).toBe(false);
  });

  it("D–G: acceptedVariant, rescued, firstTryFailed y replays quedan fuera", () => {
    expect(isAutonomousLatencySample(telemetry({ acceptedVariant: true }))).toBe(false);
    expect(isAutonomousLatencySample(telemetry({ rescued: true }))).toBe(false);
    expect(isAutonomousLatencySample(telemetry({ firstTryFailed: true }))).toBe(false);
    expect(isAutonomousLatencySample(telemetry({
      modality: "listening",
      freeAudioReplays: 1,
    }))).toBe(false);
  });

  it("H: incorrectas autónomas no entran en latencia Easy/Good", () => {
    expect(isAutonomousLatencySample(telemetry({ correct: false }))).toBe(false);
  });

  it("I: background/technicalFailure/debug quedan fuera", () => {
    expect(isAutonomousLatencySample(telemetry({ interrupted: true }))).toBe(false);
    expect(isAutonomousLatencySample(telemetry({ technicalFailure: true }))).toBe(false);
    expect(isAutonomousLatencySample(telemetry({ debugSession: true }))).toBe(false);
  });
});

describe("evaluateCalibrationGate", () => {
  it("J: 199 muestras de una modalidad -> insufficient-data", () => {
    const result = evaluateCalibrationGate(
      eventsForGate({ modalitySamples: 199, users: 20 }),
      DEFAULT_CALIBRATION_DATA_POLICY,
    );
    expect(result.status).toBe("insufficient-data");
    if (result.status === "insufficient-data") {
      expect(result.missing.some((gap) => (
        gap.samples < gap.samplesRequired
      ))).toBe(true);
    }
  });

  it("K: 200 muestras pero solo 19 usuarios -> insufficient-data", () => {
    const result = evaluateCalibrationGate(
      eventsForGate({ modalitySamples: 200, users: 19 }),
      DEFAULT_CALIBRATION_DATA_POLICY,
    );
    expect(result.status).toBe("insufficient-data");
    if (result.status === "insufficient-data") {
      expect(result.missing.some((gap) => (
        gap.distinctUsers < gap.distinctUsersRequired
      ))).toBe(true);
    }
  });

  it("L: 200 muestras y 20 usuarios por modalidad -> ready", () => {
    const result = evaluateCalibrationGate(
      eventsForGate({ modalitySamples: 200, users: 20 }),
      DEFAULT_CALIBRATION_DATA_POLICY,
    );
    expect(result.status).toBe("ready");
  });

  it("M: una modalidad insuficiente impide ready global", () => {
    const full = eventsForGate({ modalitySamples: 200, users: 20 });
    const withoutPronunciation = full.filter((event) => (
      event.telemetry.modality !== "pronunciation"
    ));
    const result = evaluateCalibrationGate(
      withoutPronunciation,
      DEFAULT_CALIBRATION_DATA_POLICY,
    );
    expect(result.status).toBe("insufficient-data");
  });

  it("P: dataset sintético no puede etiquetarse como empirical/ready", () => {
    const result = evaluateCalibrationGate(
      eventsForGate({ modalitySamples: 200, users: 20, source: "synthetic" }),
      DEFAULT_CALIBRATION_DATA_POLICY,
    );
    expect(result.status).toBe("insufficient-data");
  });
});
