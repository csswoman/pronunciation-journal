import {
  updateProgress,
  markMastered,
  unlockNextSound,
  getAllProgress,
} from './queries'
import { updateSR } from './sr'
import { isMastered, getNextUnlockedSoundId } from './mastery'
import type { UserSoundProgress, SRResult } from './types'
import type { SessionResult } from '@/lib/practice/types'

export interface FinishSessionOutcome {
  nextReview: Date
  mastered: boolean
  unlockedSoundId: number | null
}

const DEFAULT_PROGRESS = (userId: string, soundId: number): UserSoundProgress => ({
  id: '',
  user_id: userId,
  sound_id: soundId,
  status: 'available',
  total_attempts: 0,
  correct_answers: 0,
  streak: 0,
  best_streak: 0,
  last_practiced: null,
  next_review: null,
  ease_factor: 2.5,
  interval_days: 1,
})

export async function finishPhonemeSession(
  userId: string,
  soundId: number,
  result: SessionResult,
  currentProgress: UserSoundProgress | null,
): Promise<FinishSessionOutcome> {
  const correct = result.results.filter((r) => r.isCorrect).length
  const total = result.results.length

  const base = currentProgress ?? DEFAULT_PROGRESS(userId, soundId)
  const sessionPassed = correct >= Math.ceil(total / 2)
  const sr: SRResult = updateSR(base, sessionPassed)

  await updateProgress(userId, soundId, correct, total, sr)

  const updated: UserSoundProgress = {
    ...base,
    total_attempts: base.total_attempts + total,
    correct_answers: base.correct_answers + correct,
    streak: sr.streak,
  }

  let mastered = false
  let unlockedSoundId: number | null = null

  if (isMastered(updated)) {
    await markMastered(userId, soundId)
    mastered = true
    const allProg = await getAllProgress(userId)
    const nextId = getNextUnlockedSoundId(
      allProg,
      allProg.map((p) => p.sound_id).sort((a, b) => a - b),
    )
    if (nextId) {
      await unlockNextSound(userId, nextId)
      unlockedSoundId = nextId
    }
  }

  return { nextReview: sr.next_review, mastered, unlockedSoundId }
}
