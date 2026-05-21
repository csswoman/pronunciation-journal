/**
 * SM-2 mapping layer for word-bank-style progress records.
 *
 * Hierarchy:
 *   compute.ts (this file)  → high-level: SM2Progress shape + derived status
 *   schedule.ts             → primitive: pure ease/interval/repetitions math
 *
 * `scheduleNextReview` in schedule.ts is the single source of truth for the SM-2
 * algorithm itself. This module only handles the shape used by word_bank rows
 * (ISO timestamps + derived "new"/"learning"/"review"/"mastered" status).
 *
 * Consumers:
 *   - lib/decks/study-source.ts (word bank study sessions)
 *   - lib/word-bank/srs-queries.ts (planned, Task 7)
 *
 * Pure function: no Supabase access, no implicit clock when `now` is provided
 * (the wrapped `scheduleNextReview` defaults `now` to current date — callers
 * who need determinism should freeze time at the test boundary).
 */

import { scheduleNextReview } from "./schedule";

export interface SM2Progress {
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_at: string | null;
  status: "new" | "learning" | "review" | "mastered";
  last_reviewed_at: string | null;
}

export function computeSM2(current: SM2Progress | null, grade: number): SM2Progress {
  const now = new Date();
  const next = scheduleNextReview({
    ease: current?.ease_factor ?? 2.5,
    interval: current?.interval_days ?? 1,
    repetitions: current?.repetitions ?? 0,
    grade,
    now,
    updateEaseOnLapse: false,
  });

  const status: SM2Progress["status"] =
    next.interval > 21 ? "mastered" : next.repetitions > 0 ? "review" : "learning";

  return {
    ease_factor: next.ease,
    interval_days: next.interval,
    repetitions: next.repetitions,
    next_review_at: next.nextReviewAt.toISOString(),
    status,
    last_reviewed_at: now.toISOString(),
  };
}
