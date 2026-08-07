import { DEFAULT_SECONDS_BY_MODALITY } from "../cost-estimate";
import { LATENCY_THRESHOLDS_MS } from "../verification/latency";
import type { CalibrationDataPolicy, VersionedFallbackPolicy } from "./types";

export const DEFAULT_CALIBRATION_DATA_POLICY: CalibrationDataPolicy = {
  version: "calibration-data-policy-v1",
  minSamplesPerModality: 200,
  minDistinctUsersPerModality: 20,
  costStatistic: "median",
  latencyStatistic: "median",
  outlierPolicy: { kind: "mad", multiplier: 3 },
  costEventTypes: ["scheduled-review", "verification", "practice", "learning-step"],
};

export const DEFAULT_COST_FALLBACK: VersionedFallbackPolicy = {
  version: "cost-fallback-v1",
  provenance: "fallback",
  byModality: { ...DEFAULT_SECONDS_BY_MODALITY },
  documentedAt: "2026-08-06",
};

export const DEFAULT_LATENCY_FALLBACK: VersionedFallbackPolicy = {
  version: "latency-fallback-v1",
  provenance: "fallback",
  byModality: { ...LATENCY_THRESHOLDS_MS },
  documentedAt: "2026-08-06",
};
