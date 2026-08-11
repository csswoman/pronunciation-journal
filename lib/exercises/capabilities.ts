import type { ExerciseSource } from '@/lib/exercises/types'
import { EXERCISE_SKILL_MATRIX } from '@/lib/progress/skill-matrix'
import { EXERCISE_TYPE_IDS, type ExerciseSlug } from '@/lib/practice/types'

export type ExerciseCapabilityStatus = 'active' | 'deferred' | 'legacy'
export type ExerciseEvaluator = 'local' | 'ai' | 'exposure'
export type ExerciseRenderer = 'phoneme' | 'generic' | 'reader'
export type ExerciseModality = 'perception' | 'recognition' | 'recall' | 'production' | 'exposure'

export interface ExerciseCapability {
  status: ExerciseCapabilityStatus
  producerIds: readonly string[]
  renderer: ExerciseRenderer
  evaluator: ExerciseEvaluator
  modality: ExerciseModality
  sources: readonly (ExerciseSource | 'grammar_deck' | 'phoneme_session' | 'reader')[]
  skills: readonly string[]
  dbId: number | null
  /** Whether product code may select this capability for a learner session. */
  selectable: boolean
  /** Reader is exposure-only and deliberately does not write answer_history. */
  writesAnswerHistory: boolean
  note?: string
}

function capability(
  slug: ExerciseSlug,
  input: Omit<ExerciseCapability, 'dbId' | 'skills'>,
): ExerciseCapability {
  return { ...input, dbId: EXERCISE_TYPE_IDS[slug], skills: EXERCISE_SKILL_MATRIX[slug] }
}

const phoneme = (slug: ExerciseSlug, modality: ExerciseModality): ExerciseCapability => capability(slug, {
  status: 'active',
  producerIds: ['phoneme_practice_session'],
  renderer: 'phoneme',
  evaluator: 'local',
  modality,
  sources: ['phoneme_session'],
  selectable: true,
  writesAnswerHistory: true,
})

/** Product capability inventory. Test-gallery fixtures are not producers. */
export const EXERCISE_CAPABILITIES = {
  pick_word: phoneme('pick_word', 'recognition'),
  pick_sound: phoneme('pick_sound', 'recognition'),
  minimal_pair: phoneme('minimal_pair', 'perception'),
  dictation: phoneme('dictation', 'recall'),
  speak_word: phoneme('speak_word', 'production'),
  identify: phoneme('identify', 'recognition'),
  ax_same_different: phoneme('ax_same_different', 'perception'),
  odd_one_out: phoneme('odd_one_out', 'perception'),
  abx: phoneme('abx', 'perception'),
  fill_blank: capability('fill_blank', {
    status: 'active', producerIds: ['word_bank_fill_blank', 'fragment_mixed', 'essential_words_runtime'],
    renderer: 'generic', evaluator: 'local', modality: 'recall', sources: ['word_bank', 'core1k', 'text_fragments'], selectable: true, writesAnswerHistory: true,
  }),
  sentence_dictation: capability('sentence_dictation', {
    status: 'active', producerIds: ['word_bank_dictation', 'fragment_mixed', 'essential_words_runtime'],
    renderer: 'generic', evaluator: 'local', modality: 'recall', sources: ['word_bank', 'core1k', 'text_fragments'], selectable: true, writesAnswerHistory: true,
  }),
  match_pairs: capability('match_pairs', {
    status: 'active', producerIds: ['word_bank_match_pairs', 'sound_lab_match_pairs'],
    renderer: 'generic', evaluator: 'local', modality: 'recognition', sources: ['word_bank', 'core1k', 'words'], selectable: true, writesAnswerHistory: true,
  }),
  reorder_words: capability('reorder_words', {
    status: 'active', producerIds: ['word_bank_reorder', 'fragment_reorder', 'fragment_mixed', 'sound_example_reorder'],
    renderer: 'generic', evaluator: 'local', modality: 'recall', sources: ['word_bank', 'core1k', 'text_fragments', 'words'], selectable: true, writesAnswerHistory: true,
  }),
  sentence_context: capability('sentence_context', {
    status: 'active', producerIds: ['lexicon_sentence_context', 'essential_words_runtime'],
    renderer: 'generic', evaluator: 'local', modality: 'recognition', sources: ['lexicon', 'word_bank'], selectable: true, writesAnswerHistory: true,
  }),
  multiple_choice: capability('multiple_choice', {
    status: 'active', producerIds: ['grammar_deck_quiz', 'false_friends', 'connected_speech_quiz'],
    renderer: 'generic', evaluator: 'local', modality: 'recognition', sources: ['grammar_deck', 'false_friends', 'text_fragments'], selectable: true, writesAnswerHistory: true,
  }),
  reader: capability('reader', {
    status: 'active', producerIds: ['daily_reader'], renderer: 'reader', evaluator: 'exposure', modality: 'exposure', sources: ['reader'], selectable: true,
    writesAnswerHistory: false, note: 'Exposure only; completion is not objective evidence.',
  }),
  written_production: capability('written_production', {
    status: 'active', producerIds: ['guided_production'], renderer: 'generic', evaluator: 'ai', modality: 'production', sources: ['word_bank'], selectable: true, writesAnswerHistory: true,
  }),
  spoken_production: capability('spoken_production', {
    status: 'active', producerIds: ['guided_production'], renderer: 'generic', evaluator: 'ai', modality: 'production', sources: ['word_bank'], selectable: true, writesAnswerHistory: true,
  }),
  error_correction: capability('error_correction', {
    status: 'active', producerIds: ['grammar_deck_authored_pairs'], renderer: 'generic', evaluator: 'local', modality: 'recall', sources: ['grammar_deck'], selectable: true, writesAnswerHistory: true,
  }),
  conjugation_blank: capability('conjugation_blank', {
    status: 'deferred', producerIds: [], renderer: 'generic', evaluator: 'local', modality: 'recall', sources: ['grammar_deck'], selectable: false, writesAnswerHistory: true,
    note: 'Historical payload compatibility only until an authored template catalog exists.',
  }),
  sentence_transformation: capability('sentence_transformation', {
    status: 'active', producerIds: ['ai_review_transform'], renderer: 'generic', evaluator: 'local', modality: 'production', sources: ['text_fragments'], selectable: true, writesAnswerHistory: true,
  }),
  translation_es_en: capability('translation_es_en', {
    status: 'active', producerIds: ['ai_review_translation'], renderer: 'generic', evaluator: 'local', modality: 'production', sources: ['text_fragments'], selectable: true, writesAnswerHistory: true,
  }),
  cs_shadow_phrase: capability('cs_shadow_phrase', {
    status: 'active', producerIds: ['connected_speech_shadow', 'tracking_phrase_shadow'], renderer: 'generic', evaluator: 'local', modality: 'production', sources: ['text_fragments', 'tracked_items'], selectable: true, writesAnswerHistory: true,
  }),
} as const satisfies Record<ExerciseSlug, ExerciseCapability>

export type ExerciseCapabilityIssue = {
  code: 'missing_capability' | 'unknown_slug' | 'active_without_producer' | 'deferred_selectable' | 'duplicate_db_id' | 'history_contract_mismatch'
  slug: string
  detail: string
}

export function validateExerciseCapabilities(
  capabilities: Readonly<Record<string, ExerciseCapability>> = EXERCISE_CAPABILITIES,
): ExerciseCapabilityIssue[] {
  const issues: ExerciseCapabilityIssue[] = []
  const canonicalSlugs = new Set(Object.keys(EXERCISE_TYPE_IDS))
  const seenDbIds = new Map<number, string>()

  for (const slug of canonicalSlugs) {
    if (!capabilities[slug]) issues.push({ code: 'missing_capability', slug, detail: 'ExerciseSlug has no capability declaration.' })
  }
  for (const [slug, entry] of Object.entries(capabilities)) {
    if (!canonicalSlugs.has(slug)) {
      issues.push({ code: 'unknown_slug', slug, detail: 'Capability producer points to an unknown ExerciseSlug.' })
      continue
    }
    if (entry.status === 'active' && entry.producerIds.length === 0) {
      issues.push({ code: 'active_without_producer', slug, detail: 'Active capability has no product producer.' })
    }
    if (entry.status !== 'active' && entry.selectable) {
      issues.push({ code: 'deferred_selectable', slug, detail: `${entry.status} capability is exposed as selectable.` })
    }
    if (entry.dbId !== EXERCISE_TYPE_IDS[slug as ExerciseSlug]) {
      issues.push({ code: 'history_contract_mismatch', slug, detail: 'Capability DB id differs from the migration contract.' })
    }
    if (entry.dbId !== null) {
      const previous = seenDbIds.get(entry.dbId)
      if (previous) issues.push({ code: 'duplicate_db_id', slug, detail: `DB id ${entry.dbId} is also assigned to ${previous}.` })
      else seenDbIds.set(entry.dbId, slug)
    }
  }
  return issues
}
