import type { WordBankEntry } from './types'

/**
 * Progress signals intentionally do not collapse into the old SRS status.
 * `mastered` means repeated objective evidence; `legacy_mastered` keeps old
 * self-ratings visible without presenting them as verified learning.
 */
export type WordProgressSignal =
  | 'saved'
  | 'familiar'
  | 'objective_evidence'
  | 'mastered'
  | 'legacy_mastered'

export function deriveWordProgressSignal(
  entry: Pick<WordBankEntry,
    | 'familiarity_status'
    | 'mastery_provenance'
    | 'objective_evidence_count'
    | 'srs_status'
  >,
): WordProgressSignal {
  if (entry.mastery_provenance === 'objective' && entry.srs_status === 'mastered') {
    return 'mastered'
  }
  if (entry.mastery_provenance === 'legacy_self_report' && entry.srs_status === 'mastered') {
    return 'legacy_mastered'
  }
  if ((entry.objective_evidence_count ?? 0) > 0) return 'objective_evidence'
  if (entry.familiarity_status === 'familiar') return 'familiar'
  return 'saved'
}
export const WORD_PROGRESS_LABELS: Record<WordProgressSignal, string> = {
  saved: 'Guardada',
  familiar: 'Familiar',
  objective_evidence: 'Verificada',
  mastered: 'Dominada',
  legacy_mastered: 'Dominada · pendiente de verificar',
}

export function isSavedOrFamiliar(entry: Pick<WordBankEntry, 'is_favorite' | 'familiarity_status'>): boolean {
  return Boolean(entry.is_favorite) || entry.familiarity_status === 'familiar'
}
