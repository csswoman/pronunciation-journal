/**
 * SM-2 -> FSRS migration-state derivation (Fase C, spec §3.2).
 *
 * Fresh-start migration: no retroactive recompute. There is no historical
 * review log for essential-words prior to Fase A, so this derives a one-time
 * initial FSRS state from the current SM-2 fields when a card is first
 * touched by the FSRS scheduler.
 */

import type { SRSData } from "@/lib/types";

export interface DerivedFsrsState {
  stability: number;
  difficulty: number;
}

const EASE_MIN = 1.3;
const EASE_MAX = 2.5;
const DAY_MS = 86_400_000;

function clamp(min: number, max: number, value: number): number {
  return Math.min(max, Math.max(min, value));
}

function elapsedDaysSince(lastReview: string | undefined, now: Date): number {
  if (!lastReview) return 0;
  const diffMs = now.getTime() - new Date(lastReview).getTime();
  return Math.max(0, diffMs / DAY_MS);
}

/**
 * Derives a one-time FSRS (stability, difficulty) pair from a card's current
 * SM-2 state. Pure — no I/O, no implicit clock (pass `now`).
 */
export function deriveFsrsState(current: SRSData, now: Date): DerivedFsrsState {
  const elapsedDays = elapsedDaysSince(current.lastReview, now);
  const interval = current.interval;

  const stability =
    elapsedDays <= interval
      ? Math.max(1, Math.round(interval))
      : Math.max(1, Math.round(elapsedDays));

  const difficulty = clamp(
    1,
    10,
    Math.round(10 - (9 * (current.ease - EASE_MIN)) / (EASE_MAX - EASE_MIN)),
  );

  return { stability, difficulty };
}
