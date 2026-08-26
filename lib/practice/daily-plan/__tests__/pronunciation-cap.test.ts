import { describe, it, expect } from 'vitest'
import { capPronunciationSteps, MAX_PRONUNCIATION_STEPS } from '@/lib/practice/daily-plan/constants'
import type { DailyStep } from '@/lib/practice/types'

function step(id: string, kind: DailyStep['kind']): DailyStep {
  return {
    kind, id, title: id, subtitle: '', icon: 'Sparkles', exercises: [], estMinutes: 2,
  } as DailyStep
}

describe('pronunciation cap', () => {
  it('allows only one pronunciation step per session', () => {
    expect(MAX_PRONUNCIATION_STEPS).toBe(1)
  })

  it('drops pronunciation steps beyond the cap', () => {
    const steps = [
      step('phoneme_focus', 'phoneme_focus'),
      step('minimal_pairs', 'minimal_pairs'),
      step('listening', 'listening'),
      step('word_review', 'word_review'),
    ]
    const capped = capPronunciationSteps(steps)
    const pronunciation = capped.filter((s) =>
      ['phoneme_focus', 'minimal_pairs', 'listening', 'connected_speech'].includes(s.kind),
    )
    expect(pronunciation).toHaveLength(1)
  })

  it('keeps every non-pronunciation step', () => {
    const steps = [
      step('phoneme_focus', 'phoneme_focus'),
      step('word_review', 'word_review'),
      step('grammar_focus', 'grammar_focus'),
    ]
    const capped = capPronunciationSteps(steps)
    expect(capped.map((s) => s.kind)).toContain('word_review')
    expect(capped.map((s) => s.kind)).toContain('grammar_focus')
  })

  it('preserves the original order', () => {
    const steps = [
      step('word_review', 'word_review'),
      step('phoneme_focus', 'phoneme_focus'),
      step('grammar_focus', 'grammar_focus'),
    ]
    expect(capPronunciationSteps(steps).map((s) => s.id))
      .toEqual(['word_review', 'phoneme_focus', 'grammar_focus'])
  })

  it('is a no-op when nothing exceeds the cap', () => {
    const steps = [step('word_review', 'word_review')]
    expect(capPronunciationSteps(steps)).toHaveLength(1)
  })
})
