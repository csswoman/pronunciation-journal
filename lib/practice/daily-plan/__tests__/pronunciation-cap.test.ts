import { describe, it, expect } from 'vitest'
import {
  capPronunciationSteps,
  MAX_PRONUNCIATION_STEPS,
  MAX_PERCEPTION_STEPS,
  MAX_PRODUCTION_STEPS,
  PERCEPTION_KINDS,
  PRODUCTION_KINDS,
} from '@/lib/practice/daily-plan/constants'
import type { DailyStep } from '@/lib/practice/types'

function step(id: string, kind: DailyStep['kind']): DailyStep {
  return {
    kind, id, title: id, subtitle: '', icon: 'Sparkles', exercises: [], estMinutes: 2,
  } as DailyStep
}

describe('pronunciation cap', () => {
  it('allows 1 perception and 1 production step (max 2 total)', () => {
    expect(MAX_PRONUNCIATION_STEPS).toBe(2)
    expect(MAX_PERCEPTION_STEPS).toBe(1)
    expect(MAX_PRODUCTION_STEPS).toBe(1)
  })

  it('allows 1 perception and 1 production step simultaneously', () => {
    const steps = [
      step('listening', 'listening'), // perception
      step('phoneme_focus', 'phoneme_focus'), // production
      step('word_review', 'word_review'),
    ]
    const capped = capPronunciationSteps(steps)
    expect(capped.map((s) => s.kind)).toEqual(['listening', 'phoneme_focus', 'word_review'])
  })

  it('drops pronunciation steps beyond the cap within the same bucket', () => {
    const steps = [
      step('phoneme_focus', 'phoneme_focus'), // production 1 -> keep
      step('connected_speech', 'connected_speech'), // production 2 -> drop
      step('minimal_pairs', 'minimal_pairs'), // perception 1 -> keep
      step('listening', 'listening'), // perception 2 -> drop
      step('word_review', 'word_review'),
    ]
    const capped = capPronunciationSteps(steps)
    const perception = capped.filter((s) => PERCEPTION_KINDS.includes(s.kind))
    const production = capped.filter((s) => PRODUCTION_KINDS.includes(s.kind))

    expect(perception).toHaveLength(1)
    expect(perception[0].id).toBe('minimal_pairs')
    expect(production).toHaveLength(1)
    expect(production[0].id).toBe('phoneme_focus')
    expect(capped.map((s) => s.id)).toEqual(['phoneme_focus', 'minimal_pairs', 'word_review'])
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
      step('listening', 'listening'),
      step('phoneme_focus', 'phoneme_focus'),
      step('grammar_focus', 'grammar_focus'),
    ]
    expect(capPronunciationSteps(steps).map((s) => s.id))
      .toEqual(['word_review', 'listening', 'phoneme_focus', 'grammar_focus'])
  })

  it('is a no-op when nothing exceeds the cap', () => {
    const steps = [step('word_review', 'word_review')]
    expect(capPronunciationSteps(steps)).toHaveLength(1)
  })
})
