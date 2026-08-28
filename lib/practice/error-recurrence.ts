import type { ErrorPatternId } from '@/lib/exercises/error-patterns'

/**
 * Spaced recurrence for production error patterns.
 *
 * Separate from the word/sound SRS on purpose: this schedules a *pattern*
 * (the learner's recurring mistake), not an item, and it is satisfied by any
 * exercise that rehearses the structure — which is what makes the error come
 * back in a different task instead of the same one.
 *
 * Pure module: no I/O, no clock. Callers pass `now`.
 */

/** Days from a failure to each successive rehearsal. */
export const RECURRENCE_INTERVALS_DAYS: readonly number[] = [1, 3, 7]

const DAY_MS = 86_400_000

export interface ErrorRecurrenceEntry {
  patternId: ErrorPatternId
  /** Index into RECURRENCE_INTERVALS_DAYS. */
  stage: number
  /** Epoch ms when this pattern should be rehearsed again. */
  dueAt: number
  /** Total times the learner has produced this error. */
  failCount: number
  lastFailedAt: number
}

export interface ErrorRecurrenceQueue {
  entries: ErrorRecurrenceEntry[]
}

export const EMPTY_RECURRENCE_QUEUE: ErrorRecurrenceQueue = { entries: [] }

/** Record a fresh failure: resets the pattern to the shortest interval. */
export function recordErrorPattern(
  queue: ErrorRecurrenceQueue,
  patternId: ErrorPatternId,
  now: number,
): ErrorRecurrenceQueue {
  const existing = queue.entries.find((e) => e.patternId === patternId)
  const entry: ErrorRecurrenceEntry = {
    patternId,
    stage: 0,
    dueAt: now + RECURRENCE_INTERVALS_DAYS[0]! * DAY_MS,
    failCount: (existing?.failCount ?? 0) + 1,
    lastFailedAt: now,
  }
  return {
    entries: [...queue.entries.filter((e) => e.patternId !== patternId), entry],
  }
}

/** Patterns whose rehearsal is due, most-failed first. */
export function duePatterns(
  queue: ErrorRecurrenceQueue,
  now: number,
  limit = 3,
): ErrorPatternId[] {
  return queue.entries
    .filter((e) => e.dueAt <= now)
    .sort((a, b) => b.failCount - a.failCount || a.dueAt - b.dueAt)
    .slice(0, limit)
    .map((e) => e.patternId)
}

/**
 * Report the outcome of a rehearsal.
 * Success advances the interval; the last stage retires the pattern.
 * Failure sends it back to the start.
 */
export function markPatternRehearsed(
  queue: ErrorRecurrenceQueue,
  patternId: ErrorPatternId,
  success: boolean,
  now: number,
): ErrorRecurrenceQueue {
  const existing = queue.entries.find((e) => e.patternId === patternId)
  if (!existing) return queue

  const others = queue.entries.filter((e) => e.patternId !== patternId)

  if (!success) {
    return {
      entries: [
        ...others,
        {
          ...existing,
          stage: 0,
          dueAt: now + RECURRENCE_INTERVALS_DAYS[0]! * DAY_MS,
          failCount: existing.failCount + 1,
          lastFailedAt: now,
        },
      ],
    }
  }

  const nextStage = existing.stage + 1
  // Cleared the final interval — the pattern is considered repaired.
  if (nextStage >= RECURRENCE_INTERVALS_DAYS.length) {
    return { entries: others }
  }

  return {
    entries: [
      ...others,
      {
        ...existing,
        stage: nextStage,
        dueAt: now + RECURRENCE_INTERVALS_DAYS[nextStage]! * DAY_MS,
      },
    ],
  }
}
