import {
  updateContrastProgress,
  getContrastProgress,
} from './queries'
import { flushOutbox } from '@/lib/sync/sync-manager'
import { updateSR } from './sr'
import { isContrastMastered } from './mastery'
import { computeNextMasteryPct, sessionAccuracyPct } from './mastery-pct'
import type { UserContrastProgress, SRResult, SessionAnswer } from './types'
import type { SessionResult } from '@/lib/practice/types'
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

/** Extracts the contrastId a phoneme result was attributed to, if any (see mixed-session.ts). */
function resultContrastId(result: SessionResult['results'][number]): string | undefined {
  const payload = result.exercisePayload as { contrastId?: string } | null | undefined
  return payload?.contrastId
}

/**
 * Groups session results by their declared contrastId. Results with no
 * contrastId (dictation, match_pairs, reorder — not per-contrast
 * discrimination) are attributed to `fallbackContrastId`, the session's
 * primary/declared contrast, so they still count toward its SR streak
 * without being silently merged into an unrelated contrast's stats.
 */
function groupResultsByContrast(
  results: SessionResult['results'],
  fallbackContrastId: string,
): Map<string, SessionResult['results']> {
  const groups = new Map<string, SessionResult['results']>()
  for (const result of results) {
    const cid = resultContrastId(result) ?? fallbackContrastId
    const bucket = groups.get(cid)
    if (bucket) bucket.push(result)
    else groups.set(cid, [result])
  }
  return groups
}

async function updateOneContrast(
  userId: string,
  contrastId: string,
  results: SessionResult['results'],
  currentProgress: UserContrastProgress | null | undefined,
  now: Date,
): Promise<FinishContrastSessionOutcome> {
  const correct = results.filter(r => r.isCorrect).length
  const total   = results.length

  const current = currentProgress ?? await getContrastProgress(userId, contrastId)
  const base    = current ?? DEFAULT_CONTRAST(userId, contrastId)

  const sessionPassed = correct >= Math.ceil(total / 2)
  const sr: SRResult  = updateSR(base, sessionPassed)

  const sessionAccuracy = sessionAccuracyPct(results)
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
 * Updates `user_contrast_progress` for every contrast actually practiced in
 * `result`, not just `contrastId`. Exercises carry their own contrastId when
 * they compared the sound against a specific confusable (see
 * buildAdaptiveSession); exercises without one (dictation, match_pairs,
 * reorder) are attributed to `contrastId`, the session's declared primary
 * contrast. Returns the outcome for `contrastId` specifically, since that is
 * what the caller UI displays (next review date for the sound being drilled).
 */
export async function finishContrastSession(
  userId: string,
  contrastId: string,
  result: SessionResult,
  currentProgress?: UserContrastProgress | null,
  now: Date = new Date(),
  recordActivity = true,
): Promise<FinishContrastSessionOutcome> {
  const groups = groupResultsByContrast(result.results, contrastId)

  let primaryOutcome: FinishContrastSessionOutcome | undefined
  for (const [cid, results] of groups) {
    const outcome = await updateOneContrast(
      userId,
      cid,
      results,
      cid === contrastId ? currentProgress : undefined,
      now,
    )
    if (cid === contrastId) primaryOutcome = outcome
  }

  if (recordActivity) {
    await recordActivitySession(userId, {
      practiceContext: 'sound_lab',
      sessionResult: result,
      source: 'sound_lab',
      metadata: { contrastId },
    })
  }
  await flushOutbox()

  // primaryOutcome is always set: contrastId is always a key in groups
  // (every result without its own contrastId falls back to it).
  return primaryOutcome!
}
