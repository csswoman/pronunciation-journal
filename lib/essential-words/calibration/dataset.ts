import type { AttemptEventType, AttemptModality } from "../verification/types";
import {
  DEFAULT_CALIBRATION_DATA_POLICY,
  DEFAULT_COST_FALLBACK,
  DEFAULT_LATENCY_FALLBACK,
} from "./policy";
import { filterMadOutliers, median } from "./robust-estimate";
import {
  hasValidTiming,
  isAutonomousLatencySample,
  isExcludedQuality,
} from "./telemetry";
import type {
  CalibrationDataPolicy,
  CalibrationDataset,
  CalibrationDatasetStatus,
  CalibrationEvent,
  CalibrationGap,
  CalibrationSummary,
  InteractionTelemetry,
  ModalitySampleSummary,
  ResolvedEstimate,
  VersionedFallbackPolicy,
} from "./types";

export type {
  CalibrationDataPolicy,
  CalibrationDataset,
  CalibrationDatasetStatus,
  CalibrationEvent,
  CalibrationGap,
  CalibrationSummary,
  InteractionTelemetry,
  ResolvedEstimate,
  VersionedFallbackPolicy,
} from "./types";
export { TELEMETRY_SCHEMA_VERSION } from "./types";
export {
  DEFAULT_CALIBRATION_DATA_POLICY,
  DEFAULT_COST_FALLBACK,
  DEFAULT_LATENCY_FALLBACK,
} from "./policy";
export {
  isAutonomousLatencySample,
  toInteractionTelemetry,
} from "./telemetry";

const MODALITIES: AttemptModality[] = [
  "recognition",
  "production",
  "listening",
  "pronunciation",
];

function emptySummaries(): Record<AttemptModality, ModalitySampleSummary> {
  return {
    recognition: { modality: "recognition", sampleCount: 0, distinctUsers: 0, values: [] },
    production: { modality: "production", sampleCount: 0, distinctUsers: 0, values: [] },
    listening: { modality: "listening", sampleCount: 0, distinctUsers: 0, values: [] },
    pronunciation: { modality: "pronunciation", sampleCount: 0, distinctUsers: 0, values: [] },
  };
}

function finalizeSummaries(
  summaries: Record<AttemptModality, ModalitySampleSummary>,
  policy: CalibrationDataPolicy,
): Record<AttemptModality, ModalitySampleSummary> {
  const result = emptySummaries();
  for (const modality of MODALITIES) {
    const filtered = filterMadOutliers(
      summaries[modality].values,
      policy.outlierPolicy.multiplier,
    );
    result[modality] = {
      modality,
      sampleCount: filtered.length,
      distinctUsers: summaries[modality].distinctUsers,
      values: filtered,
      estimateMs: median(filtered),
    };
  }
  return result;
}

function collectUsersAndValues(
  events: readonly CalibrationEvent[],
  include: (telemetry: InteractionTelemetry) => boolean,
  valueOf: (telemetry: InteractionTelemetry) => number,
): Record<AttemptModality, ModalitySampleSummary> {
  const summaries = emptySummaries();
  const users = {
    recognition: new Set<string>(),
    production: new Set<string>(),
    listening: new Set<string>(),
    pronunciation: new Set<string>(),
  };
  const seenAttempts = new Set<string>();

  for (const { telemetry } of events) {
    const attemptKey = telemetry.attemptId ?? telemetry.id;
    if (seenAttempts.has(attemptKey) || !include(telemetry)) continue;
    seenAttempts.add(attemptKey);
    const modality = telemetry.modality;
    summaries[modality].values.push(valueOf(telemetry));
    if (telemetry.userId) users[modality].add(telemetry.userId);
  }

  for (const modality of MODALITIES) {
    summaries[modality].sampleCount = summaries[modality].values.length;
    summaries[modality].distinctUsers = users[modality].size;
  }
  return summaries;
}

function isCostEligible(
  telemetry: InteractionTelemetry,
  policy: CalibrationDataPolicy,
): boolean {
  if (telemetry.source === "synthetic") return false;
  if (!hasValidTiming(telemetry) || isExcludedQuality(telemetry)) return false;
  return policy.costEventTypes.includes(telemetry.eventType as AttemptEventType);
}

export function buildCostCalibrationDataset(
  events: readonly CalibrationEvent[],
  policy: CalibrationDataPolicy,
): CalibrationDataset {
  return {
    kind: "cost",
    byModality: finalizeSummaries(
      collectUsersAndValues(
        events,
        (telemetry) => isCostEligible(telemetry, policy),
        (telemetry) => telemetry.interactionDurationMs,
      ),
      policy,
    ),
  };
}

export function buildLatencyCalibrationDataset(
  events: readonly CalibrationEvent[],
  policy: CalibrationDataPolicy,
): CalibrationDataset {
  const collected = collectUsersAndValues(
    events,
    isAutonomousLatencySample,
    (telemetry) => telemetry.latencyMs,
  );
  return { kind: "latency", byModality: finalizeSummaries(collected, policy) };
}

function gapsForDataset(
  dataset: CalibrationDataset,
  policy: CalibrationDataPolicy,
): CalibrationGap[] {
  const gaps: CalibrationGap[] = [];
  for (const modality of MODALITIES) {
    const summary = dataset.byModality[modality];
    if (
      summary.sampleCount < policy.minSamplesPerModality
      || summary.distinctUsers < policy.minDistinctUsersPerModality
    ) {
      gaps.push({
        modality,
        dataset: dataset.kind,
        samples: summary.sampleCount,
        samplesRequired: policy.minSamplesPerModality,
        distinctUsers: summary.distinctUsers,
        distinctUsersRequired: policy.minDistinctUsersPerModality,
      });
    }
  }
  return gaps;
}

function toSummary(
  dataset: CalibrationDataset,
  policy: CalibrationDataPolicy,
): CalibrationSummary {
  const byModality = { ...DEFAULT_COST_FALLBACK.byModality };
  const sampleCounts = {
    recognition: 0, production: 0, listening: 0, pronunciation: 0,
  };
  const distinctUsers = { ...sampleCounts };
  for (const modality of MODALITIES) {
    const summary = dataset.byModality[modality];
    sampleCounts[modality] = summary.sampleCount;
    distinctUsers[modality] = summary.distinctUsers;
    if (summary.estimateMs !== undefined) {
      byModality[modality] = dataset.kind === "cost"
        ? summary.estimateMs / 1_000
        : summary.estimateMs;
    }
  }
  return {
    provenance: "empirical",
    datasetVersion: `${dataset.kind}-${policy.version}`,
    policyVersion: policy.version,
    byModality,
    sampleCounts,
    distinctUsers,
  };
}

function emptyGaps(policy: CalibrationDataPolicy): CalibrationGap[] {
  return MODALITIES.flatMap((modality) => ([
    {
      modality,
      dataset: "cost" as const,
      samples: 0,
      samplesRequired: policy.minSamplesPerModality,
      distinctUsers: 0,
      distinctUsersRequired: policy.minDistinctUsersPerModality,
    },
    {
      modality,
      dataset: "latency" as const,
      samples: 0,
      samplesRequired: policy.minSamplesPerModality,
      distinctUsers: 0,
      distinctUsersRequired: policy.minDistinctUsersPerModality,
    },
  ]));
}

/**
 * Empirical gate. Synthetic-only cohorts never become ready.
 * Fallback remains available separately via resolve* helpers.
 */
export function evaluateCalibrationGate(
  events: readonly CalibrationEvent[],
  policy: CalibrationDataPolicy = DEFAULT_CALIBRATION_DATA_POLICY,
): CalibrationDatasetStatus {
  const empiricalEvents = events.filter((event) => (
    event.telemetry.source === "empirical"
  ));
  if (empiricalEvents.length === 0) {
    return { status: "insufficient-data", missing: emptyGaps(policy) };
  }

  const cost = buildCostCalibrationDataset(empiricalEvents, policy);
  const latency = buildLatencyCalibrationDataset(empiricalEvents, policy);
  const missing = [...gapsForDataset(cost, policy), ...gapsForDataset(latency, policy)];
  if (missing.length > 0) return { status: "insufficient-data", missing };
  return {
    status: "ready",
    cost: toSummary(cost, policy),
    latency: toSummary(latency, policy),
  };
}

export function resolveCostEstimate(
  gate: CalibrationDatasetStatus,
  fallback: VersionedFallbackPolicy = DEFAULT_COST_FALLBACK,
): ResolvedEstimate {
  if (gate.status === "ready") {
    return {
      provenance: "empirical",
      version: gate.cost.datasetVersion,
      byModality: gate.cost.byModality,
    };
  }
  return {
    provenance: "fallback",
    version: fallback.version,
    byModality: { ...fallback.byModality },
  };
}

export function resolveLatencyThresholds(
  gate: CalibrationDatasetStatus,
  fallback: VersionedFallbackPolicy = DEFAULT_LATENCY_FALLBACK,
): ResolvedEstimate {
  if (gate.status === "ready") {
    return {
      provenance: "empirical",
      version: gate.latency.datasetVersion,
      byModality: gate.latency.byModality,
    };
  }
  return {
    provenance: "fallback",
    version: fallback.version,
    byModality: { ...fallback.byModality },
  };
}
