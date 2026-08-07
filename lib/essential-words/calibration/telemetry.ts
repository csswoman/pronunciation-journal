import type {
  AttemptLog,
  ItemSchedule,
} from "../verification/types";
import type { InteractionTelemetry } from "./types";
import { TELEMETRY_SCHEMA_VERSION } from "./types";

function scheduleState(
  schedule?: ItemSchedule,
): InteractionTelemetry["priorScheduleState"] {
  if (!schedule || schedule.kind === "none") return "none";
  if (schedule.kind === "provisional") return "provisional";
  return schedule.state;
}

/**
 * Maps AttemptLog (+ optional prior schedule / quality flags) into calibration
 * telemetry without copying pedagogical payloads.
 *
 * interactionDurationMs — full interaction cost (presentation → feedback).
 * latencyMs — response window for Easy/Good only.
 * Mapping enforces interactionDurationMs >= latencyMs for finite timings.
 */
export function toInteractionTelemetry(
  attempt: AttemptLog & { userId?: string },
  options: {
    priorSchedule?: ItemSchedule;
    interrupted?: boolean;
    technicalFailure?: boolean;
    debugSession?: boolean;
    foregroundDurationMs?: number;
    source?: InteractionTelemetry["source"];
  } = {},
): InteractionTelemetry {
  const { assessment } = attempt;
  const latencyMs = Number.isFinite(assessment.latencyMs)
    ? Math.max(0, assessment.latencyMs)
    : 0;
  const rawDuration = Number.isFinite(assessment.interactionDurationMs)
    ? assessment.interactionDurationMs
    : latencyMs;
  const interactionDurationMs = Math.max(rawDuration, latencyMs);

  return {
    id: `telemetry:${attempt.id}`,
    ...(attempt.userId ? { userId: attempt.userId } : {}),
    attemptId: attempt.id,
    modality: assessment.modality,
    eventType: attempt.eventType,
    latencyMs,
    interactionDurationMs,
    correct: assessment.correct,
    usedHints: assessment.usedHints,
    rescued: assessment.rescued,
    acceptedVariant: assessment.acceptedVariant,
    firstTryFailed: assessment.firstTryFailed,
    freeAudioReplays: assessment.freeAudioReplays,
    priorScheduleState: scheduleState(options.priorSchedule),
    ...(options.foregroundDurationMs !== undefined
      ? { foregroundDurationMs: options.foregroundDurationMs }
      : {}),
    ...(options.interrupted !== undefined ? { interrupted: options.interrupted } : {}),
    ...(options.technicalFailure !== undefined
      ? { technicalFailure: options.technicalFailure }
      : {}),
    ...(options.debugSession !== undefined ? { debugSession: options.debugSession } : {}),
    occurredAt: attempt.occurredAt,
    telemetrySchemaVersion: TELEMETRY_SCHEMA_VERSION,
    source: options.source ?? "empirical",
  };
}

export function hasValidTiming(telemetry: InteractionTelemetry): boolean {
  return Number.isFinite(telemetry.latencyMs)
    && Number.isFinite(telemetry.interactionDurationMs)
    && telemetry.latencyMs >= 0
    && telemetry.interactionDurationMs >= 0
    && telemetry.interactionDurationMs >= telemetry.latencyMs;
}

export function isExcludedQuality(telemetry: InteractionTelemetry): boolean {
  return Boolean(
    telemetry.technicalFailure
    || telemetry.interrupted
    || telemetry.debugSession,
  );
}

/**
 * Autonomous latency samples feed Easy/Good calibration only.
 * Requires scheduled Review prior state plus unassisted success.
 */
export function isAutonomousLatencySample(
  telemetry: InteractionTelemetry,
): boolean {
  if (telemetry.source === "synthetic") return false;
  if (!hasValidTiming(telemetry) || isExcludedQuality(telemetry)) return false;
  if (telemetry.priorScheduleState !== "Review") return false;
  return telemetry.correct
    && !telemetry.usedHints
    && !telemetry.rescued
    && !telemetry.acceptedVariant
    && !telemetry.firstTryFailed
    && telemetry.freeAudioReplays === 0;
}
