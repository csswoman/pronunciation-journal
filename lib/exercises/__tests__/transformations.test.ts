import { describe, expect, it } from 'vitest'
import { isExactTransformation } from '../transformations'
import type { SentenceTransformationExercise } from '../types'

const exercise: SentenceTransformationExercise = {
  id: 'st-1',
  type: 'sentence_transformation',
  sourceRef: { source: 'text_fragments', id: 'st-1' },
  sourceSentence: 'She is too tired to work.',
  instruction: 'Rewrite using enough.',
  referenceAnswer: 'She is not well enough to work.',
}

describe('isExactTransformation', () => {
  it('accepts exact match with case and punctuation differences', () => {
    expect(isExactTransformation(exercise, 'she is not well enough to work')).toBe(true)
    expect(isExactTransformation(exercise, 'SHE IS NOT WELL ENOUGH TO WORK.')).toBe(true)
    expect(isExactTransformation(exercise, '  She is not well enough to work!  ')).toBe(true)
  })

  it('rejects an incorrect or different answer', () => {
    expect(isExactTransformation(exercise, 'she is tired enough to work')).toBe(false)
    expect(isExactTransformation(exercise, 'she is too tired to work')).toBe(false)
  })

  it('returns false when referenceAnswer is missing', () => {
    const withoutRef: SentenceTransformationExercise = {
      ...exercise,
      referenceAnswer: undefined,
    }
    expect(isExactTransformation(withoutRef, 'any answer')).toBe(false)
  })
})
