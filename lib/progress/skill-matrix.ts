import type { ExerciseSlug } from '@/lib/practice/types'
import type { SkillTag } from '@/lib/progress/activity-types'

/**
 * Exhaustive ExerciseSlug → SkillTag mapping (plan 062 step 5).
 * Context must not invent practiced skills — only this matrix does.
 */
export const EXERCISE_SKILL_MATRIX = {
  pick_word: ['pronunciation'],
  pick_sound: ['pronunciation'],
  minimal_pair: ['pronunciation', 'listening'],
  dictation: ['listening'],
  fill_blank: ['vocabulary', 'reading'],
  sentence_dictation: ['listening'],
  match_pairs: ['vocabulary'],
  reorder_words: ['grammar'],
  speak_word: ['speaking', 'pronunciation'],
  identify: ['pronunciation', 'listening'],
  ax_same_different: ['pronunciation', 'listening'],
  odd_one_out: ['pronunciation', 'listening'],
  abx: ['pronunciation', 'listening'],
  sentence_context: ['vocabulary', 'reading'],
  multiple_choice: ['reading'],
  reader: ['reading'],
  written_production: ['reading'],
  spoken_production: ['speaking'],
  error_correction: ['grammar'],
  conjugation_blank: ['grammar'],
  sentence_transformation: ['grammar'],
  translation_es_en: ['vocabulary', 'grammar'],
  cs_shadow_phrase: ['speaking', 'pronunciation'],
} as const satisfies Record<ExerciseSlug, readonly SkillTag[]>

export type ExerciseSkillMatrix = typeof EXERCISE_SKILL_MATRIX

export function skillsForSlug(slug: ExerciseSlug): readonly SkillTag[] {
  return EXERCISE_SKILL_MATRIX[slug]
}

type EssentialWordsPayload = { mode?: unknown }

const LISTENING_ESSENTIAL_WORD_MODES = new Set([
  'dictation_word', 'dictation_sentence', 'listening_cloze_sentence', 'recognize_audio',
])

/** Context identifies origin, never a practiced skill. */
export function resolveAnswerSkills(
  slug: ExerciseSlug | null,
  exercisePayload: unknown,
): readonly SkillTag[] {
  if (!slug) return []
  const baseline = new Set<SkillTag>(skillsForSlug(slug))
  if (slug !== 'fill_blank' && slug !== 'speak_word') return [...baseline]
  const payload = exercisePayload && typeof exercisePayload === 'object'
    ? exercisePayload as EssentialWordsPayload
    : undefined
  if (typeof payload?.mode !== 'string') return [...baseline]
  const skills = new Set<SkillTag>(['vocabulary'])
  if (LISTENING_ESSENTIAL_WORD_MODES.has(payload.mode)) skills.add('listening')
  if (payload.mode === 'speak_sentence' && slug === 'speak_word') skills.add('speaking')
  return [...skills]
}
