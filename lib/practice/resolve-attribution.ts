import {
  ATTRIBUTION_VERSION,
  attributeGroupResult,
  attributeSingleTarget,
  contrastId,
  core1kId,
  nonSrsAttribution,
  textFragmentId,
  topicId,
  wordBankId,
  type EvidenceModality,
  type EvidenceAttribution,
} from '@/lib/practice/attribution'
import type { PracticeExercise } from '@/lib/practice/types'
import { isUuid } from '@/lib/review/content-ref'
import { normalizeTopic } from '@/lib/practice/normalize-topic'

export function evidenceModalityForExercise(
  exercise: Pick<PracticeExercise, 'slug'>,
): EvidenceModality {
  switch (exercise.slug) {
    case 'sentence_context':
    case 'error_correction':
    case 'conjugation_blank':
    case 'sentence_transformation':
      return 'contextual_use'
    case 'written_production':
    case 'translation_es_en':
      return 'written_production'
    case 'spoken_production':
    case 'speak_word':
      return 'spoken_production'
    case 'cs_shadow_phrase':
      // The connected-speech evaluator is STT intelligibility only. It is not
      // a phoneme, stress or intonation accuracy score.
      return 'stt_intelligibility'
    case 'pick_sound':
    case 'minimal_pair':
    case 'dictation':
    case 'sentence_dictation':
    case 'identify':
    case 'ax_same_different':
    case 'odd_one_out':
    case 'abx':
      return 'perception'
    default:
      return 'meaning_recall'
  }
}

/**
 * Derive explicit attribution for a submitted answer from exercise metadata.
 * Prefer this over inventing SRS targets from aggregate scores or mismatched ids.
 */
export function resolveAnswerAttribution(
  exercise: PracticeExercise,
  isCorrect: boolean,
  score?: number,
): EvidenceAttribution {
  const modality = evidenceModalityForExercise(exercise)

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
      modality,
    })
  }

  const ref = exercise.sourceRef
  const genericTopic = exercise.payload.kind === 'generic'
    ? normalizeTopic(exercise.payload.data.topic ?? '')
    : null
  const outcomes: Array<Parameters<typeof attributeSingleTarget>[0]> = []
  if (ref?.source === 'word_bank' && isUuid(ref.id)) {
    outcomes.push({
      target: { namespace: 'word_bank', id: wordBankId(ref.id) },
      correct: isCorrect,
      score,
      modality,
    })
  }

  if (ref?.source === 'lexicon' || (ref?.source === 'word_bank' && !isUuid(ref.id))) {
    return nonSrsAttribution('unsaved')
  }

  if (ref?.source === 'text_fragments') {
    outcomes.push({
      target: { namespace: 'text_fragments', id: textFragmentId(ref.id) },
      correct: isCorrect,
      score,
      modality,
    })
  }

  if (ref?.source === 'core1k') {
    outcomes.push({
      target: { namespace: 'core1k', id: core1kId(ref.id) },
      correct: isCorrect,
      score,
      modality,
    })
  }

  if (genericTopic) {
    outcomes.push({
      target: { namespace: 'topic', id: topicId(genericTopic) },
      correct: isCorrect,
      score,
      modality,
    })
  }

  if (outcomes.length > 0) {
    const [first, ...rest] = outcomes
    return { srsEligible: true, outcomes: [first!, ...rest] }
  }

  // No deterministic target — answer_history only.
  return nonSrsAttribution('no_target')
}

export { ATTRIBUTION_VERSION }
