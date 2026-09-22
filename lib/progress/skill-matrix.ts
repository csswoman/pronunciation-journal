import type { ExerciseSlug } from '@/lib/practice/types'
import type { PracticeExercise } from '@/lib/practice/types'
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
  // A multiple-choice slug is a response format, not a measured skill.
  // New rows must declare the task skill in their persisted payload.
  multiple_choice: [],
  reader: ['reading'],
  written_production: ['writing'],
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

type AnswerSkillPayload = {
  mode?: unknown
  taskSkill?: unknown
}

const SKILL_TAGS = new Set<SkillTag>([
  'speaking',
  'vocabulary',
  'grammar',
  'pronunciation',
  'listening',
  'reading',
  'writing',
])

const LISTENING_ESSENTIAL_WORD_MODES = new Set([
  'dictation_word', 'dictation_sentence', 'listening_cloze_sentence', 'recognize_audio',
])

/**
 * Resolves the one skill the authored task is designed to evaluate.
 * It is persisted with the answer so activity sessions and fluency history
 * use the same evidence rather than inferring from a response format.
 */
export function taskSkillForExercise(
  exercise: Pick<PracticeExercise, 'slug' | 'payload'>,
): SkillTag | undefined {
  switch (exercise.slug) {
    case 'written_production':
      return 'writing'
    case 'spoken_production':
    case 'speak_word':
    case 'cs_shadow_phrase':
      return 'speaking'
    case 'dictation':
    case 'sentence_dictation':
      return 'listening'
    default:
      break
  }

  if (exercise.payload.kind !== 'generic') return undefined
  return exercise.payload.data.exerciseType?.domain
}

/** Context identifies origin, never a practiced skill. */
export function resolveAnswerSkills(
  slug: ExerciseSlug | null,
  exercisePayload: unknown,
): readonly SkillTag[] {
  if (!slug) return []
  const baseline = new Set<SkillTag>(skillsForSlug(slug))
  const payload = exercisePayload && typeof exercisePayload === 'object'
    ? exercisePayload as AnswerSkillPayload
    : undefined
  if (typeof payload?.taskSkill === 'string' && SKILL_TAGS.has(payload.taskSkill as SkillTag)) {
    return [payload.taskSkill as SkillTag]
  }
  if (slug !== 'fill_blank' && slug !== 'speak_word') return [...baseline]
  if (typeof payload?.mode !== 'string') return [...baseline]
  const skills = new Set<SkillTag>(['vocabulary'])
  if (LISTENING_ESSENTIAL_WORD_MODES.has(payload.mode)) skills.add('listening')
  if (payload.mode === 'speak_sentence' && slug === 'speak_word') skills.add('speaking')
  return [...skills]
}
