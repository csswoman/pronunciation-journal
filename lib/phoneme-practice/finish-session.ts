import {
  updateContrastProgress,
  getContrastProgress,
} from './queries'
import { updateSR } from './sr'
import { isContrastMastered } from './mastery'
import { computeNextMasteryPct, sessionAccuracyPct } from './mastery-pct'
import type { UserContrastProgress, SRResult, SessionAnswer } from './types'
import type { SessionResult } from '@/lib/practice/types'

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

export async function finishContrastSession(
  userId: string,
  contrastId: string,
  result: SessionResult,
  currentProgress?: UserContrastProgress | null,
  now: Date = new Date(),
): Promise<FinishContrastSessionOutcome> {
  const correct = result.results.filter(r => r.isCorrect).length
  const total   = result.results.length

  const current = currentProgress ?? await getContrastProgress(userId, contrastId)
  const base    = current ?? DEFAULT_CONTRAST(userId, contrastId)

  const sessionPassed = correct >= Math.ceil(total / 2)
  const sr: SRResult  = updateSR(base, sessionPassed)

  const sessionAccuracy = sessionAccuracyPct(result.results)
  const masteryPct = computeNextMasteryPct(
    base.mastery_pct ?? 0,
    sessionAccuracy,
    base.last_seen,
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
