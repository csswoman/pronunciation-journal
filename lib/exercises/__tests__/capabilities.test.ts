import { describe, expect, it } from 'vitest'
import { EXERCISE_CAPABILITIES, validateExerciseCapabilities, type ExerciseCapability } from '../capabilities'
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

  it('keeps deferred capabilities out of selectable product routes', () => {
    expect(EXERCISE_CAPABILITIES.conjugation_blank).toMatchObject({ status: 'deferred', selectable: false, producerIds: [] })
  })

  it('keeps reader exposure-only and outside answer_history', () => {
    expect(EXERCISE_CAPABILITIES.reader).toMatchObject({ evaluator: 'exposure', dbId: null, writesAnswerHistory: false })
  })
})
