import {
  updateContrastProgress,
  getContrastProgress,
} from './queries'
import { flushOutbox } from '@/lib/sync/sync-manager'
import { updateSR } from './sr'
import { isContrastMastered } from './mastery'
import { computeNextMasteryPct, sessionAccuracyPct } from './mastery-pct'
import type { UserContrastProgress, SRResult, SessionAnswer } from './types'
import type { ExerciseResult, SessionResult } from '@/lib/practice/types'
import { recordActivitySession } from '@/lib/progress/activity-hub'

export interface FinishContrastSessionOutcome {
  nextReview: Date
  contrastMastered: boolean
  masteryPct: number
}

const DEFAULT_CONTRAST = (userId: string, contrastId: string): UserContrastProgress => ({
  id: '',
  user_id: userId,
  contrast_id: contrastId,
  ease_factor: 2.5,
  interval_days: 1,
  next_review: null,
  last_seen: null,
  total_attempts: 0,
  correct_answers: 0,
  streak: 0,
  mastery_pct: 0,
})

/** Build a minimal SessionResult from legacy SessionAnswer rows (review flow). */
export function sessionAnswersToResult(answers: SessionAnswer[]): SessionResult {
  const results = answers.map((a, i) => ({
    exerciseId: `review-${i}`,
    slug: a.exerciseType,
    exerciseTypeId: 0,
    isCorrect: a.isCorrect,
    timeMs: a.timeMs,
    contentId: a.targetWord ?? String(a.soundId),
    context: 'review' as const,
    completedAt: new Date(),
  }))
  const correct = results.filter((r) => r.isCorrect).length
  const total = results.length
  return {
    results,
    accuracy: total > 0 ? (correct / total) * 100 : 0,
    totalTimeMs: results.reduce((s, r) => s + r.timeMs, 0),
    bySlug: {} as SessionResult['bySlug'],
  }
}

/** Extract contrast id from plan-062 attribution or legacy payload. */
export function contrastIdFromResult(result: ExerciseResult): string | null {
  const fromAttr = result.attribution
  if (fromAttr?.srsEligible) {
    const hit = fromAttr.outcomes.find((o) => o.target.namespace === 'contrast')
    if (hit && hit.target.namespace === 'contrast') return hit.target.id
  }
  const payload = result.exercisePayload as { contrastId?: string } | undefined
  return payload?.contrastId ?? null
}

/**
 * Group session results by contrast for independent SRS updates.
 * Exercises without a contrast id are omitted (non-SRS distractors).
 */
export function groupResultsByContrast(
  results: ExerciseResult[],
): Map<string, ExerciseResult[]> {
  const map = new Map<string, ExerciseResult[]>()
  for (const r of results) {
    const cid = contrastIdFromResult(r)
    if (!cid) continue
    const list = map.get(cid) ?? []
    list.push(r)
    map.set(cid, list)
  }
  return map
}

export async function finishContrastSession(
  userId: string,
  contrastId: string,
  result: SessionResult,
  currentProgress?: UserContrastProgress | null,
  now: Date = new Date(),
  recordActivity = true,
): Promise<FinishContrastSessionOutcome> {
  const correct = result.results.filter(r => r.isCorrect).length
  const total   = result.results.length

  const current = currentProgress ?? await getContrastProgress(userId, contrastId)
  const base    = current ?? DEFAULT_CONTRAST(userId, contrastId)

  const sessionPassed = correct >= Math.ceil(total / 2)
  const sr: SRResult  = updateSR(base, sessionPassed)

  const sessionAccuracy = sessionAccuracyPct(result.results)
  // Estimate sessions completed including this one. total_attempts grows by
  // `total` each session, so dividing gives approximate session count.
  const sessionSize = total > 0 ? total : 10
  const totalSessionsAfter = Math.ceil((base.total_attempts + total) / sessionSize)
  const masteryPct = computeNextMasteryPct(
    base.mastery_pct ?? 0,
    sessionAccuracy,
    base.last_seen,
    totalSessionsAfter,
    now,
  )

  await updateContrastProgress(userId, contrastId, correct, total, sr, masteryPct)
  if (recordActivity) {
    await recordActivitySession(userId, {
      practiceContext: 'sound_lab',
      sessionResult: result,
      source: 'sound_lab',
      metadata: { contrastId },
    })
  }
  await flushOutbox()

  const updated: UserContrastProgress = {
    ...base,
    total_attempts:  base.total_attempts  + total,
    correct_answers: base.correct_answers + correct,
    streak: sr.streak,
    mastery_pct: masteryPct,
  }

  return {
    nextReview:       sr.next_review,
    contrastMastered: isContrastMastered(updated),
    masteryPct,
  }
}

/**
 * Apply contrast SRS for each attributed contrast group independently.
 * Returns the latest nextReview among updated contrasts (or null if none).
 */
export async function finishAttributedContrastSessions(
  userId: string,
  session: SessionResult,
  now: Date = new Date(),
): Promise<{ nextReview: Date | null; updatedContrastIds: string[] }> {
  const groups = groupResultsByContrast(session.results)
  let nextReview: Date | null = null
  const updatedContrastIds: string[] = []

  for (const [cid, groupResults] of groups) {
    const subset: SessionResult = {
      ...session,
      results: groupResults,
      accuracy:
        groupResults.length > 0
          ? (groupResults.filter((r) => r.isCorrect).length / groupResults.length) * 100
          : 0,
      totalTimeMs: groupResults.reduce((s, r) => s + r.timeMs, 0),
    }
    const outcome = await finishContrastSession(userId, cid, subset, undefined, now, false)
    updatedContrastIds.push(cid)
    if (!nextReview || outcome.nextReview > nextReview) {
      nextReview = outcome.nextReview
    }
  }

  return { nextReview, updatedContrastIds }
}
