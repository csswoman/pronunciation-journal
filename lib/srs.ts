import type { SRSData } from "./types";

/**
 * SM-2 algorithm (simplified) for spaced repetition.
 *
 * quality: 0-5 rating
 *   5 - Perfect response (accuracy >= 95%)
 *   4 - Correct with hesitation (80-94%)
 *   3 - Correct with difficulty (60-79%)
 *   2 - Incorrect but close (40-59%)
 *   1 - Incorrect (20-39%)
 *   0 - Complete failure (<20%)
 */
export function updateSRS(current: SRSData, quality: number): SRSData {
  const q = Math.max(0, Math.min(5, Math.round(quality)));
  const now = new Date().toISOString();

  let { ease, interval, repetitions } = current;

  if (q >= 3) {
    // Correct response
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * ease);
    }
    repetitions += 1;
  } else {
    // Incorrect response — reset
    repetitions = 0;
    interval = 1;
  }

  // Update easiness factor
  ease = Math.max(
    1.3,
    ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  );

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    ...current,
    ease: Math.round(ease * 100) / 100,
    interval,
    repetitions,
    nextReview: nextReviewDate.toISOString(),
    lastReview: now,
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
