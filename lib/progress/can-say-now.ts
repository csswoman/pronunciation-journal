import { constraintById } from '@/lib/exercises/speech-constraints'

/**
 * "A month ago I couldn't do this, now I can."
 *
 * Built from production attempts rather than completions: a structure counts
 * as available only when the learner produced it correctly, unprompted, more
 * than once — which is the difference between recognising a form and owning it.
 */

/** How far back a correct production still counts as current ability. */
const WINDOW_DAYS = 30
/** Correct productions needed before a structure is called mastered. */
const MASTERY_THRESHOLD = 2

export interface CanSayAttempt {
  constraintId: string
  isCorrect: boolean
  answeredAt: string
  /** What the learner actually said — the evidence shown back to them. */
  sentence?: string
}

export interface CanSayInput {
  attempts: readonly CanSayAttempt[]
}

export interface CanSayEntry {
  constraintId: string
  label: string
  correctCount: number
  /** The learner's own most recent correct sentence. */
  example?: string
}

export interface CanSayNow {
  mastered: CanSayEntry[]
  inProgress: CanSayEntry[]
}

export function buildCanSayNow(input: CanSayInput, now: number = Date.now()): CanSayNow {
  const cutoff = now - WINDOW_DAYS * 86_400_000

  const byConstraint = new Map<string, CanSayAttempt[]>()
  for (const attempt of input.attempts) {
    const at = Date.parse(attempt.answeredAt)
    if (Number.isNaN(at) || at < cutoff) continue
    const list = byConstraint.get(attempt.constraintId) ?? []
    list.push(attempt)
    byConstraint.set(attempt.constraintId, list)
  }

  const mastered: CanSayEntry[] = []
  const inProgress: CanSayEntry[] = []

  for (const [constraintId, attempts] of byConstraint) {
    const correct = attempts.filter((a) => a.isCorrect)
    if (correct.length === 0) continue

    const latest = [...correct].sort(
      (a, b) => Date.parse(b.answeredAt) - Date.parse(a.answeredAt),
    )[0]!

    const entry: CanSayEntry = {
      constraintId,
      label: constraintById(constraintId)?.label ?? constraintId,
      correctCount: correct.length,
      example: latest.sentence,
    }

    if (correct.length >= MASTERY_THRESHOLD) mastered.push(entry)
    else inProgress.push(entry)
  }

  const byCount = (a: CanSayEntry, b: CanSayEntry) => b.correctCount - a.correctCount
  return { mastered: mastered.sort(byCount), inProgress: inProgress.sort(byCount) }
}
