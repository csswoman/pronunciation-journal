/**
 * fsrsRealReviews lifecycle (Fase C, spec §3.2).
 *
 * A migrated card's initial stability/difficulty is an estimate, not a
 * measurement. Reviews against that invented state are excluded from future
 * optimizer input until three real reviews have accumulated. Fresh FSRS cards
 * have no counter and are already eligible.
 */

const MIGRATION_NOISE_THRESHOLD = 3;

export function isEligibleForOptimizer(row: {
  isRepair: boolean;
  fsrsRealReviews?: number;
}): boolean {
  if (row.isRepair) return false;
  const count = row.fsrsRealReviews;
  return count === undefined || count >= MIGRATION_NOISE_THRESHOLD;
}

export function nextFsrsRealReviews(
  current: number | undefined,
  review: { isRepair: boolean },
): number {
  const base = current ?? 0;
  return review.isRepair ? base : base + 1;
}
