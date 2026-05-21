import { accuracyToQuality } from '@/lib/srs'
import type { PracticeAnswer } from './types'

// TODO: thresholds could become per-slug in the future (e.g. reorder_words
// will never finish in <5s, so its "fast" bar should be higher).
const FAST_THRESHOLD_MS = 5000
const NORMAL_THRESHOLD_MS = 15000

export function answerToGrade(
  answer: Pick<PracticeAnswer, 'isCorrect' | 'timeMs' | 'score' | 'slug'>
): number {
  if (answer.slug === 'speak_word' && answer.score != null) {
    return accuracyToQuality(answer.score)
  }
  if (answer.isCorrect === false) return 1
  if (answer.timeMs < FAST_THRESHOLD_MS) return 5
  if (answer.timeMs < NORMAL_THRESHOLD_MS) return 4
  return 3
}
