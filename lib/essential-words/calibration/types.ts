import type {
  AttemptEventType,
  AttemptModality,
  FsrsCardState,
} from "../verification/types";

export const TELEMETRY_SCHEMA_VERSION = "calibration-telemetry-v1";

/**
 * Observational view over AttemptLog (+ optional SRS prior schedule).
 * Does not persist pedagogical content — only timing, modality and flags.
 */
export interface InteractionTelemetry {
  id: string;
  userId?: string;
  attemptId?: string;
  modality: AttemptModality;
  eventType: AttemptEventType;
  latencyMs: number;
  interactionDurationMs: number;
  correct: boolean;
  usedHints: boolean;
  rescued: boolean;
  acceptedVariant: boolean;
  firstTryFailed: boolean;
  freeAudioReplays: number;
  priorScheduleState?: FsrsCardState | "none" | "provisional";
  foregroundDurationMs?: number;
  interrupted?: boolean;
  technicalFailure?: boolean;
  debugSession?: boolean;
  occurredAt: string;
  telemetrySchemaVersion: string;
  source: "empirical" | "synthetic";
}

export interface CalibrationDataPolicy {
  version: string;
  minSamplesPerModality: number;
  minDistinctUsersPerModality: number;
  costStatistic: "median";
  latencyStatistic: "median";
  outlierPolicy: {
    kind: "mad";
    /** Keep |x - median| <= multiplier * 1.4826 * MAD when MAD > 0. */
    multiplier: number;
  };
  /** Attempt event types eligible for cost estimation. */
  costEventTypes: readonly AttemptEventType[];
}

export interface ModalitySampleSummary {
  modality: AttemptModality;
  sampleCount: number;
  distinctUsers: number;
  values: number[];
  estimateMs?: number;
}

export interface CalibrationDataset {
  kind: "cost" | "latency";
  byModality: Record<AttemptModality, ModalitySampleSummary>;
}

export interface CalibrationGap {
  modality: AttemptModality;
  dataset: "cost" | "latency";
  samples: number;
  samplesRequired: number;
  distinctUsers: number;
  distinctUsersRequired: number;
}

export interface CalibrationSummary {
  provenance: "empirical";
  datasetVersion: string;
  policyVersion: string;
  byModality: Record<AttemptModality, number>;
  sampleCounts: Record<AttemptModality, number>;
  distinctUsers: Record<AttemptModality, number>;
}

export type CalibrationDatasetStatus =
  | {
      status: "ready";
      cost: CalibrationSummary;
      latency: CalibrationSummary;
    }
  | {
      status: "insufficient-data";
      missing: CalibrationGap[];
    };

export interface VersionedFallbackPolicy {
  version: string;
  provenance: "fallback";
  byModality: Record<AttemptModality, number>;
  documentedAt: string;
}

export interface ResolvedEstimate {
  provenance: "fallback" | "empirical";
  version: string;
  byModality: Record<AttemptModality, number>;
}

/** Carrier for calibration pipelines; AttemptLog remains the source of truth. */
export interface CalibrationEvent {
  telemetry: InteractionTelemetry;
}
