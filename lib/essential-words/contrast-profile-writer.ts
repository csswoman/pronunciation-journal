import type { AttemptWordEvidence } from './attempt-grade'

export const DICTATION_PHONETIC_WEIGHT = 0.7
export const EMA_ALPHA = 0.3
export const MIN_RANKING_OBSERVATIONS = 3

export interface ContrastProfileSnapshot { score: number; observationCount: number }
export function applyContrastObservation(current: ContrastProfileSnapshot, correct: boolean, weight = DICTATION_PHONETIC_WEIGHT): ContrastProfileSnapshot {
  return { score: current.score * (1 - EMA_ALPHA) + (correct ? 0 : weight) * EMA_ALPHA, observationCount: current.observationCount + 1 }
}
export function dictationContrastEvidence(words: readonly AttemptWordEvidence[], tier?: 1 | 2 | 3) {
  if (tier === 3) return []
  return words.filter((word) => word.categoria === 'phonetic_substitution' && word.contrastId).map((word) => ({ contrastId: word.contrastId!, correct: false, weight: DICTATION_PHONETIC_WEIGHT }))
}
export function weakestEligibleContrast(rows: ReadonlyArray<{ contrastId: string; score: number; observationCount: number }>, coldStart: readonly string[]): string {
  const eligible = rows.filter((row) => row.observationCount >= MIN_RANKING_OBSERVATIONS).sort((a, b) => b.score - a.score)
  return eligible[0]?.contrastId ?? coldStart[0]
}

/** Shared discrimination rows alone keep their own ordering: dictation adds no
 * candidate unless it contains an attributed phonetic substitution. */
export function rankingIsCompatibleWithDiscriminationOnly(rows: ReadonlyArray<{ contrastId: string; score: number; observationCount: number }>, coldStart: readonly string[]) {
  return weakestEligibleContrast(rows, coldStart)
}
