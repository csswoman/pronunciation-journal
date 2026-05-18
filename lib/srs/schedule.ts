/**
 * Shared, pure SM-2 scheduler.
 *
 * This is the single source of truth for the grade-based SM-2 algorithm used by
 * `lib/srs.ts` (SRSData) and the word-bank schedulers. It holds no DB access and
 * no implicit clock — pass `now` to keep it deterministic.
 *
 * `lib/phoneme-practice/sr.ts` is deliberately NOT routed through here: it uses a
 * different algorithm (boolean input, 1/3/7 intervals, ±0.1/-0.2 ease capped at 3.0).
 */

const MIN_EASE = 1.3;

export interface ScheduleInput {
  ease: number;
  interval: number;
  repetitions: number;
  /** SM-2 quality 0-5; values outside the range are clamped and rounded. */
  grade: number;
  /** Reference instant for `nextReviewAt`. Defaults to the current date. */
  now?: Date;
  /**
   * When true, ease is recalculated even on a failed review (grade < 3).
   * lib/srs.ts wants this; word-bank leaves ease untouched on a lapse.
   */
  updateEaseOnLapse?: boolean;
}

export interface ScheduleResult {
  ease: number;
  interval: number;
  repetitions: number;
  nextReviewAt: Date;
}

function adjustEase(ease: number, grade: number): number {
  const next = ease + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  return Math.max(MIN_EASE, next);
}

export function scheduleNextReview(input: ScheduleInput): ScheduleResult {
  const now = input.now ?? new Date();
  const updateEaseOnLapse = input.updateEaseOnLapse ?? false;
  const grade = Math.max(0, Math.min(5, Math.round(input.grade)));

  let { ease, interval, repetitions } = input;

  if (grade >= 3) {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * ease);
    repetitions += 1;
    ease = adjustEase(ease, grade);
  } else {
    repetitions = 0;
    interval = 1;
    if (updateEaseOnLapse) ease = adjustEase(ease, grade);
  }

  ease = Math.round(ease * 100) / 100;

  const nextReviewAt = new Date(now);
  nextReviewAt.setDate(nextReviewAt.getDate() + interval);

  return { ease, interval, repetitions, nextReviewAt };
}
