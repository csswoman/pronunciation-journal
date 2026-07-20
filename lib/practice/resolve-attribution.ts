import {
  ATTRIBUTION_VERSION,
  attributeGroupResult,
  attributeSingleTarget,
  contrastId,
  core1kId,
  nonSrsAttribution,
  textFragmentId,
  wordBankId,
  type EvidenceAttribution,
} from '@/lib/practice/attribution'
import type { PracticeExercise } from '@/lib/practice/types'
import { isUuid } from '@/lib/review/content-ref'

/**
 * Derive explicit attribution for a submitted answer from exercise metadata.
 * Prefer this over inventing SRS targets from aggregate scores or mismatched ids.
 */
export function resolveAnswerAttribution(
  exercise: PracticeExercise,
  isCorrect: boolean,
  score?: number,
): EvidenceAttribution {
  if (exercise.slug === 'match_pairs') {
    return attributeGroupResult({
      mode: 'non_srs',
      reason: 'match_pairs aggregate score only',
    })
  }

  if (exercise.contrastId) {
    return attributeSingleTarget({
      target: { namespace: 'contrast', id: contrastId(exercise.contrastId) },
      correct: isCorrect,
      score,
    })
  }

  const ref = exercise.sourceRef
  if (ref?.source === 'word_bank' && isUuid(ref.id)) {
    return attributeSingleTarget({
      target: { namespace: 'word_bank', id: wordBankId(ref.id) },
      correct: isCorrect,
      score,
    })
  }

  if (ref?.source === 'lexicon' || (ref?.source === 'word_bank' && !isUuid(ref.id))) {
    return nonSrsAttribution('unsaved')
  }

  if (ref?.source === 'text_fragments') {
    return attributeSingleTarget({
      target: { namespace: 'text_fragments', id: textFragmentId(ref.id) },
      correct: isCorrect,
      score,
    })
  }

  if (ref?.source === 'core1k') {
    return attributeSingleTarget({
      target: { namespace: 'core1k', id: core1kId(ref.id) },
      correct: isCorrect,
      score,
    })
  }

  // No deterministic target — answer_history only.
  return nonSrsAttribution('no_target')
}

export { ATTRIBUTION_VERSION }
