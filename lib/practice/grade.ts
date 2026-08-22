import { accuracyToQuality } from '@/lib/srs'
import type { PracticeAnswer, PracticeResultStatus } from './types'

// TODO: thresholds could become per-slug in the future (e.g. reorder_words
// will never finish in <5s, so its "fast" bar should be higher).
const FAST_THRESHOLD_MS = 5000
const NORMAL_THRESHOLD_MS = 15000

export function answerToGrade(
  answer: Pick<PracticeAnswer, 'isCorrect' | 'timeMs' | 'score' | 'slug'> & {
    status?: PracticeResultStatus
    responseTimeMs?: number
    firstTryFailed?: boolean
    userAnswer?: string
  }
): number | null {
  // Non-answered interactions (skips, unscored activities, evaluator errors) have no SRS grade.
  if (
    (answer.status && answer.status !== 'answered') ||
    answer.userAnswer === 'skip'
  ) {
    return null
  }

  const scoreSlugs = new Set<PracticeAnswer['slug']>([
    'speak_word',
    'written_production',
    'spoken_production',
  ])
  if (scoreSlugs.has(answer.slug) && answer.score != null) {
    return accuracyToQuality(answer.score)
  }

  if (answer.isCorrect === false) return 1

  // If the first attempt failed, the item required a retry to get right: grade as Again (1).
  if (answer.firstTryFailed) return 1

  // Use the initial response latency (excluding feedback read / retry duration) for speed rating.
  const latencyMs = answer.responseTimeMs ?? answer.timeMs
  if (latencyMs < FAST_THRESHOLD_MS) return 5
  if (latencyMs < NORMAL_THRESHOLD_MS) return 4
  return 3
}
