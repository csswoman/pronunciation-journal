import type { SRSData } from "./types";
import { scheduleNextReview } from "./srs/schedule";

/**
 * Update SRS state for a word after a review.
 *
 * quality: 0-5 rating
 *   5 - Perfect response (accuracy >= 95%)
 *   4 - Correct with hesitation (80-94%)
 *   3 - Correct with difficulty (60-79%)
 *   2 - Incorrect but close (40-59%)
 *   1 - Incorrect (20-39%)
 *   0 - Complete failure (<20%)
 *
 * Mapping layer over the shared SM-2 scheduler: SRSData updates ease on every
 * review (including lapses), hence `updateEaseOnLapse: true`.
 */
export function updateSRS(current: SRSData, quality: number): SRSData {
  const now = new Date();
  const next = scheduleNextReview({
    ease: current.ease,
    interval: current.interval,
    repetitions: current.repetitions,
    grade: quality,
    now,
    updateEaseOnLapse: true,
  });

  return {
    ...current,
    ease: next.ease,
    interval: next.interval,
    repetitions: next.repetitions,
    nextReview: next.nextReviewAt.toISOString(),
    lastReview: now.toISOString(),
  };
}

/**
 * Convert accuracy percentage (0-100) to SM-2 quality rating (0-5).
 */
export function accuracyToQuality(accuracy: number): number {
  if (accuracy >= 95) return 5;
  if (accuracy >= 80) return 4;
  if (accuracy >= 60) return 3;
  if (accuracy >= 40) return 2;
  if (accuracy >= 20) return 1;
  return 0;
}

/**
 * Create initial SRS data for a new word.
 */
export function createSRSEntry(
  wordId: string,
  word: string
): SRSData {
  return {
    wordId,
    word,
    ease: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: new Date().toISOString(), // due immediately
  };
}
