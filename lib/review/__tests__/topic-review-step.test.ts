import { describe, expect, it } from 'vitest'
import type { GrammarCardBlock, GrammarStudyDeckData } from '@/lib/courses/grammar-deck/types'
import { buildTopicReviewStep } from '../topic-review-step'

function deck(blocks: GrammarCardBlock[], quizCount = 3): GrammarStudyDeckData {
  return {
    meta: { eyebrow: 'Grammar', title: 'Present simple' },
    cards: [{ id: 'card-1', index: 1, tag: 'Rule', title: 'Rule', lede: 'Lede', blocks }],
    quiz: Array.from({ length: quizCount }, (_, index) => ({
      q: `Question ${index}`, options: ['A', 'B'], answer: 0, explain: `Why ${index}`,
    })),
  }
}

describe('buildTopicReviewStep', () => {
  it('puts one authored error correction first and preserves the cap of three', () => {
    const step = buildTopicReviewStep('grammar:present simple', 'a1-present', deck([{
      type: 'pairs', lines: [
        { variant: 'bad', text: 'She work here.' }, { variant: 'good', text: 'She works here.' },
        { variant: 'bad', text: 'He live here.' }, { variant: 'good', text: 'He lives here.' },
      ],
    }]))
    expect(step?.exercises).toHaveLength(3)
    expect(step?.exercises.map((exercise) => exercise.slug)).toEqual(['error_correction', 'multiple_choice', 'multiple_choice'])
  })

  it('keeps the quiz-only fallback when no authored pair is valid', () => {
    const step = buildTopicReviewStep('grammar:present simple', 'a1-present', deck([{
      type: 'pairs', lines: [{ variant: 'bad', text: 'No adjacent correction.' }],
    }], 2))
    expect(step?.exercises.map((exercise) => exercise.slug)).toEqual(['multiple_choice', 'multiple_choice'])
  })

  it('can build a step from authored corrections when the deck has no quiz', () => {
    const source = deck([{ type: 'pairs', lines: [
      { variant: 'bad', text: 'They is ready.' }, { variant: 'good', text: 'They are ready.' },
    ] }], 0)
    expect(buildTopicReviewStep('grammar:agreement', 'a1-agreement', source)?.exercises[0].slug).toBe('error_correction')
  })

  it('returns null when neither source can produce an exercise', () => {
    expect(buildTopicReviewStep('grammar:none', 'none', deck([], 0))).toBeNull()
  })
})
