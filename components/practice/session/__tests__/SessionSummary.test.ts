import { describe, expect, it } from 'vitest'
import { formatExerciseLabel } from '../SessionSummary'

describe('formatExerciseLabel', () => {
  it('uses targetWord when present', () => {
    expect(formatExerciseLabel('dictation', { targetWord: 'house' })).toBe('house')
  })

  it('falls back to a readable slug label', () => {
    expect(formatExerciseLabel('sentence_dictation', null)).toBe('Sentence Dictation')
  })
})
