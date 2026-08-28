import { describe, expect, it } from 'vitest'
import {
  EXERCISE_CAPABILITIES,
  validateExerciseCapabilities,
  isExerciseAvailableOnSurface,
  type ExerciseCapability,
} from '../capabilities'
import { EXERCISE_TYPE_IDS } from '@/lib/practice/types'

describe('exercise capabilities', () => {
  it('exhaustively declares the real manifest without issues', () => {
    expect(Object.keys(EXERCISE_CAPABILITIES).sort()).toEqual(Object.keys(EXERCISE_TYPE_IDS).sort())
    expect(validateExerciseCapabilities()).toEqual([])
  })

  it('rejects an active capability without a producer', () => {
    const fixture: Record<string, ExerciseCapability> = {
      ...EXERCISE_CAPABILITIES,
      fill_blank: { ...EXERCISE_CAPABILITIES.fill_blank, producerIds: [] },
    }
    expect(validateExerciseCapabilities(fixture)).toContainEqual(expect.objectContaining({
      code: 'active_without_producer', slug: 'fill_blank',
    }))
  })

  it('rejects an active capability without any declared surfaces', () => {
    const fixture: Record<string, ExerciseCapability> = {
      ...EXERCISE_CAPABILITIES,
      fill_blank: { ...EXERCISE_CAPABILITIES.fill_blank, surfaces: [] },
    }
    expect(validateExerciseCapabilities(fixture)).toContainEqual(expect.objectContaining({
      code: 'active_without_surfaces', slug: 'fill_blank',
    }))
  })

  it('enforces B3 surface policy: match_pairs and sentence_dictation in free_practice only, multiple_choice in diagnostic', () => {
    expect(isExerciseAvailableOnSurface('match_pairs', 'daily_plan')).toBe(false)
    expect(isExerciseAvailableOnSurface('match_pairs', 'free_practice')).toBe(true)

    expect(isExerciseAvailableOnSurface('sentence_dictation', 'daily_plan')).toBe(false)
    expect(isExerciseAvailableOnSurface('sentence_dictation', 'free_practice')).toBe(true)

    expect(isExerciseAvailableOnSurface('multiple_choice', 'daily_plan')).toBe(false)
    expect(isExerciseAvailableOnSurface('multiple_choice', 'diagnostic')).toBe(true)

    expect(isExerciseAvailableOnSurface('fill_blank', 'daily_plan')).toBe(true)
    expect(isExerciseAvailableOnSurface('spoken_production', 'daily_plan')).toBe(true)
  })

  it('preserves answer_history dbId and skill matrix contract for retired daily exercises', () => {
    expect(EXERCISE_CAPABILITIES.match_pairs.dbId).toBe(EXERCISE_TYPE_IDS.match_pairs)
    expect(EXERCISE_CAPABILITIES.sentence_dictation.dbId).toBe(EXERCISE_TYPE_IDS.sentence_dictation)
    expect(EXERCISE_CAPABILITIES.multiple_choice.dbId).toBe(EXERCISE_TYPE_IDS.multiple_choice)
  })

  it('keeps deferred capabilities out of selectable product routes', () => {
    expect(EXERCISE_CAPABILITIES.conjugation_blank).toMatchObject({ status: 'deferred', selectable: false, producerIds: [], surfaces: [] })
  })

  it('keeps reader exposure-only and outside answer_history', () => {
    expect(EXERCISE_CAPABILITIES.reader).toMatchObject({ evaluator: 'exposure', dbId: null, writesAnswerHistory: false })
  })
})

