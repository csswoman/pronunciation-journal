import type { AttemptModality, SrsReviewEvent } from "./types";

/** Provisional defaults; phase 8 calibrates them against production evidence. */
export const LATENCY_THRESHOLDS_MS: Record<AttemptModality, number> = {
  recognition: 8_000,
  production: 25_000,
  listening: 30_000,
  pronunciation: 20_000,
};

const MODALITIES: AttemptModality[] = [
  "recognition",
  "production",
  "listening",
  "pronunciation",
];

function isAutonomous(event: SrsReviewEvent): boolean {
  const { assessment } = event;
  return event.affectsSchedule
    && assessment.correct
    && !assessment.usedHints
    && !assessment.rescued
    && !assessment.acceptedVariant
    && !assessment.firstTryFailed
    && assessment.freeAudioReplays === 0
    && (event.grade === "Easy" || event.grade === "Good");
}

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

/**
 * Calibrates each modality from unassisted successful SRS events. Multiple
 * effects from one interaction share an attempt ID and count as one sample.
 */
export function calibrateLatencyThresholds(
  events: SrsReviewEvent[],
  fallback: Record<AttemptModality, number>,
  minSamples: number,
): Record<AttemptModality, number> {
  if (!Number.isInteger(minSamples) || minSamples < 1) {
    throw new RangeError("minSamples debe ser un entero positivo");
  }

  const samples: Record<AttemptModality, number[]> = {
    recognition: [],
    production: [],
    listening: [],
    pronunciation: [],
  };
  const seenAttempts = new Set<string>();

  for (const event of events) {
    if (!isAutonomous(event) || seenAttempts.has(event.attemptLogId)) continue;
    seenAttempts.add(event.attemptLogId);
    samples[event.assessment.modality].push(event.assessment.latencyMs);
  }

  return MODALITIES.reduce<Record<AttemptModality, number>>((thresholds, modality) => {
    const values = samples[modality];
    thresholds[modality] = values.length >= minSamples ? median(values) : fallback[modality];
    return thresholds;
  }, { ...fallback });
}
