import { describe, expect, it } from 'vitest'
import { fromGenericExercise } from '@/lib/practice/adapters'
import { resolveAnswerAttribution } from '@/lib/practice/resolve-attribution'

describe('chunk evidence attribution', () => {
  it('attributes objective answers to the canonical chunk id', () => {
    const exercise = fromGenericExercise({
      id: 'chunk:test:recognition',
      type: 'multiple_choice',
      sourceRef: { source: 'chunks', id: 'test-chunk' },
      question: 'Saluda a un amigo.',
      options: ['How are you?', 'Never mind.', 'No way.', 'Take care.'],
      answerIndex: 0,
    }, 'practice')
    expect(resolveAnswerAttribution(exercise, true)).toEqual({
      srsEligible: true,
      outcomes: [{
        target: { namespace: 'chunks', id: 'test-chunk' },
        correct: true,
        modality: 'meaning_recall',
      }],
    })
  })
})
