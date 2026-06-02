import type { UserContrastProgress } from './types'
import { PHONEME_CONFUSION, contrastKey } from './phoneme-similarity'

// Thresholds for a single contrast to be considered mastered.
const MIN_ATTEMPTS = 10
const MIN_ACCURACY = 0.85
const MIN_STREAK   = 3

export function isContrastMastered(p: UserContrastProgress): boolean {
  return (
    p.total_attempts >= MIN_ATTEMPTS &&
    p.correct_answers / p.total_attempts >= MIN_ACCURACY &&
    p.streak >= MIN_STREAK
  )
}

/**
 * A sound is mastered when ALL its associated contrasts are mastered.
 * Uses minimum (not average) so one weak contrast blocks mastery display.
 */
export function isSoundMastered(
  ipa: string,
  allProgress: UserContrastProgress[]
): boolean {
  const contrastIpas = PHONEME_CONFUSION[ipa]
  if (!contrastIpas || contrastIpas.length === 0) return false

  const progressMap = new Map(allProgress.map(p => [p.contrast_id, p]))

  return contrastIpas.every(other => {
    const key = contrastKey(ipa, other)
    const p = progressMap.get(key)
    return p != null && isContrastMastered(p)
  })
}
