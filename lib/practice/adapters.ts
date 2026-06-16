import type { MixedExercise } from '@/lib/phoneme-practice/mixed-session'
import type { GenericExercise, GenericExerciseType } from '@/lib/exercises/types'
import {
  EXERCISE_TYPE_IDS,
  type ExerciseSlug,
  type PhonemePayload,
  type GenericPayload,
  type PracticeContext,
  type PracticeExercise,
} from './types'

const GENERIC_TYPE_TO_SLUG: Record<GenericExerciseType, ExerciseSlug> = {
  fill_blank: 'fill_blank',
  sentence_dictation: 'sentence_dictation',
  match_pairs: 'match_pairs',
  reorder_words: 'reorder_words',
  sentence_context: 'sentence_context',
  multiple_choice: 'multiple_choice',
}

/**
 * Deterministic id derived from the fields that uniquely identify an
 * exercise within a session. Same inputs always yield the same id, so the
 * Practice Engine can dedupe without coordination.
 *
 * `btoa` is sufficient here: this id is for in-session deduplication, not
 * for cryptographic guarantees, so the cost of a real hash isn't worth it.
 */
function deterministicId(
  slug: ExerciseSlug,
  contentId: string,
  payload: PhonemePayload | GenericPayload,
): string {
  const raw = `${slug}|${contentId}|${JSON.stringify(payload)}`
  // btoa only accepts latin-1; encode to base64 via Buffer in Node and
  // fall back to a unicode-safe path in the browser.
  if (typeof btoa === 'function') {
    return btoa(unescape(encodeURIComponent(raw)))
  }
  return Buffer.from(raw, 'utf8').toString('base64')
}

export function fromMixedExercise(
  ex: MixedExercise,
  context: PracticeContext,
): PracticeExercise {
  if (ex.kind === 'phoneme') {
    const {
      ipa,
      targetWord,
      options,
      correctIds,
      soundId,
      level,
      stimuli,
      abxAnswer,
      oddIndex,
    } = ex.data
    const payload: PhonemePayload = {
      kind: 'phoneme',
      ipa,
      targetWord,
      options,
      correctIds,
      stimuli,
      abxAnswer,
      oddIndex,
    }
    const slug = ex.data.type as ExerciseSlug
    // contentId must vary per exercise within a sound so buildSession does not
    // dedupe distinct phoneme drills (different slug or different target word)
    // that legitimately share the same soundId. The optionsKey ensures even
    // two same-slug+same-targetWord exercises with different options are
    // treated as distinct.
    const optionsKey = options.map((o) => o.id).join(',')
    const contentId = `${soundId}:${slug}:${targetWord ?? ''}:${optionsKey}`
    return {
      id: deterministicId(slug, contentId, payload),
      slug,
      exerciseTypeId: EXERCISE_TYPE_IDS[slug],
      contentId,
      context,
      payload,
      level,
      soundId,
    }
  }

  if (ex.kind === 'match_pairs' || ex.kind === 'reorder_words') {
    const data = ex.data
    const slug: ExerciseSlug = ex.kind === 'match_pairs' ? 'match_pairs' : 'reorder_words'
    const payload: GenericPayload = { kind: 'generic', data }
    const contentId = data.id
    return {
      id: deterministicId(slug, contentId, payload),
      slug,
      exerciseTypeId: EXERCISE_TYPE_IDS[slug],
      contentId,
      context,
      payload,
      level: data.level,
      sourceRef: data.sourceRef,
    }
  }

  throw new Error(`Unknown mixed exercise kind: ${(ex as { kind: string }).kind}`)
}

export function fromGenericExercise(
  ex: GenericExercise,
  context: PracticeContext,
): PracticeExercise {
  const slug = GENERIC_TYPE_TO_SLUG[ex.type]
  const payload: GenericPayload = { kind: 'generic', data: ex }
  const contentId = ex.id
  return {
    id: deterministicId(slug, contentId, payload),
    slug,
    exerciseTypeId: EXERCISE_TYPE_IDS[slug],
    contentId,
    context,
    payload,
    level: ex.level,
    sourceRef: ex.sourceRef,
  }
}
