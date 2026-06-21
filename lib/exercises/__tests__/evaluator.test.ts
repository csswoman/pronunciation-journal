import { describe, expect, it } from 'vitest'
import { analyzeWrongness } from '@/lib/exercises/evaluator'
import type { ExerciseDesign } from '@/lib/exercises/design'

function design(overrides: Partial<ExerciseDesign> = {}): ExerciseDesign {
  return {
    id: 'exercise-1',
    type: 'fill_blank',
    instruction: 'Answer',
    learningGoal: 'Practice',
    correctAnswer: 'I study English',
    constraint: { type: 'exact_match', value: 'I study English' },
    topic: 'grammar',
    difficulty: 'a1',
    ...overrides,
  }
}

describe('analyzeWrongness', () => {
  it('detects the same tokens in the wrong order', () => {
    expect(analyzeWrongness('English I study', design())).toBe('word_order')
  })

  it('detects omitted dictation words', () => {
    expect(analyzeWrongness(
      'I English',
      design({ exerciseType: { domain: 'listening', mode: 'dictation' } }),
    )).toBe('listening_omission')
  })
})
