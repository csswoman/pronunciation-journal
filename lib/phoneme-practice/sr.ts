import type { UserSoundProgress, SRResult } from './types'

export function updateSR(current: UserSoundProgress, isCorrect: boolean): SRResult {
  let { ease_factor, interval_days, streak } = current

  if (isCorrect) {
    streak += 1
    interval_days =
      interval_days === 1 ? 3
      : interval_days === 3 ? 7
      : Math.round(interval_days * ease_factor)
    ease_factor = Math.min(ease_factor + 0.1, 3.0)
  } else {
    streak = 0
    interval_days = 1
    ease_factor = Math.max(ease_factor - 0.2, 1.3)
  }

  const next_review = new Date()
  next_review.setDate(next_review.getDate() + interval_days)

  return { ease_factor, interval_days, streak, next_review }
}
