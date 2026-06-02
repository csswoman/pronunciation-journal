import {
  updateContrastProgress,
  getContrastProgress,
} from './queries'
import { updateSR } from './sr'
import { isContrastMastered } from './mastery'
import type { UserContrastProgress, SRResult } from './types'
import type { SessionResult } from '@/lib/practice/types'

export interface FinishContrastSessionOutcome {
  nextReview: Date
  contrastMastered: boolean
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
})

export async function finishContrastSession(
  userId: string,
  contrastId: string,
  result: SessionResult,
  currentProgress?: UserContrastProgress | null,
): Promise<FinishContrastSessionOutcome> {
  const correct = result.results.filter(r => r.isCorrect).length
  const total   = result.results.length

  const current = currentProgress ?? await getContrastProgress(userId, contrastId)
  const base    = current ?? DEFAULT_CONTRAST(userId, contrastId)

  const sessionPassed = correct >= Math.ceil(total / 2)
  const sr: SRResult  = updateSR(base, sessionPassed)

  await updateContrastProgress(userId, contrastId, correct, total, sr)

  const updated: UserContrastProgress = {
    ...base,
    total_attempts:  base.total_attempts  + total,
    correct_answers: base.correct_answers + correct,
    streak: sr.streak,
  }

  return {
    nextReview:       sr.next_review,
    contrastMastered: isContrastMastered(updated),
  }
}
