import type { PlannedItem } from "./planning-types";
import type { AttemptLog, AttemptModality } from "./verification/types";

const MODALITIES: AttemptModality[] = [
  "recognition",
  "production",
  "listening",
  "pronunciation",
];

/**
 * Versioned production fallback for session costs (seconds).
 * Empirical replacement is gated by calibration/dataset.ts (Task 8.8/8.11).
 * provenance remains "fallback" until an empirical gate returns ready.
 */
export const DEFAULT_SECONDS_BY_MODALITY: Record<AttemptModality, number> = {
  recognition: 12,
  production: 25,
  listening: 20,
  pronunciation: 30,
};

export const COST_FALLBACK_VERSION = "cost-fallback-v1";

export function estimateItemsSeconds(
  items: PlannedItem[],
  byModality: Record<AttemptModality, number>,
): number {
  return items.reduce((seconds, item) => seconds + byModality[item.modality], 0);
}

/**
 * Estimates session costs from interactions, rather than SRS events. A single
 * production interaction can update multiple learning items, but it still
 * consumes time only once.
 *
 * Uses interactionDurationMs (full interaction cost), never latencyMs.
 * Mean is retained as the temporary estimator until Task 8.11 switches to the
 * median-after-MAD empirical gate when status === "ready".
 */
export function estimateFromAttempts(
  attempts: AttemptLog[],
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
  const seenAttemptIds = new Set<string>();

  for (const attempt of attempts) {
    if (seenAttemptIds.has(attempt.id)
      || (attempt.eventType !== "scheduled-review" && attempt.eventType !== "verification")) {
      continue;
    }

    seenAttemptIds.add(attempt.id);
    const durationMs = attempt.assessment.interactionDurationMs;
    if (Number.isFinite(durationMs) && durationMs >= 0) {
      samples[attempt.assessment.modality].push(durationMs / 1_000);
    }
  }

  return MODALITIES.reduce<Record<AttemptModality, number>>((estimated, modality) => {
    const durations = samples[modality];
    estimated[modality] = durations.length >= minSamples
      ? durations.reduce((total, duration) => total + duration, 0) / durations.length
      : fallback[modality];
    return estimated;
  }, { ...fallback });
}
