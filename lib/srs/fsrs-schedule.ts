/**
 * Shared, pure FSRS scheduler (Fase C), mirroring how lib/srs/schedule.ts
 * wraps SM-2: no DB access and an explicit clock. The default ts-fsrs
 * parameters are deliberate so future optimizer work can use the same
 * parameterization that generated the review data.
 *
 * lib/srs/schedule.ts remains the permanent scheduler for deck_entry_progress;
 * that table is a separate SM-2 domain and does not use SRSData.
 */

import { fsrs, generatorParameters, Rating, State } from "ts-fsrs";
import type { Card, Grade as FsrsRating } from "ts-fsrs";
import type { FsrsCardState } from "@/lib/types";
import type { Grade } from "@/lib/essential-words/attempt-grade";

export type { Grade } from "@/lib/essential-words/attempt-grade";

export interface FsrsScheduleInput {
  stability: number;
  difficulty: number;
  state: FsrsCardState;
  grade: Grade;
  /** Reference instant for dueAt. Defaults to the current date. */
  now?: Date;
}

export interface FsrsScheduleResult {
  stability: number;
  difficulty: number;
  /** Whole days until the card is next due. */
  interval: number;
  dueAt: Date;
  state: FsrsCardState;
}

const GRADE_TO_RATING: Record<Grade, FsrsRating> = {
  Again: Rating.Again as FsrsRating,
  Hard: Rating.Hard as FsrsRating,
  Good: Rating.Good as FsrsRating,
  Easy: Rating.Easy as FsrsRating,
};

const STATE_TO_FSRS: Record<FsrsCardState, State> = {
  New: State.New,
  Learning: State.Learning,
  Review: State.Review,
  Relearning: State.Relearning,
};

const FSRS_TO_STATE: Record<State, FsrsCardState> = {
  [State.New]: "New",
  [State.Learning]: "Learning",
  [State.Review]: "Review",
  [State.Relearning]: "Relearning",
};

const DAY_MS = 86_400_000;
const scheduler = fsrs(generatorParameters());

export function scheduleFsrsReview(input: FsrsScheduleInput): FsrsScheduleResult {
  const now = input.now ?? new Date();
  const card: Card = {
    due: now,
    stability: input.stability,
    difficulty: input.difficulty,
    elapsed_days: 0,
    scheduled_days: 0,
    learning_steps: 0,
    reps: 0,
    lapses: 0,
    state: STATE_TO_FSRS[input.state],
    last_review: undefined,
  };

  const { card: nextCard } = scheduler.next(card, now, GRADE_TO_RATING[input.grade]);
  const interval = Math.max(
    1,
    Math.round((nextCard.due.getTime() - now.getTime()) / DAY_MS),
  );

  return {
    stability: nextCard.stability,
    difficulty: nextCard.difficulty,
    interval,
    dueAt: nextCard.due,
    state: FSRS_TO_STATE[nextCard.state],
  };
}
