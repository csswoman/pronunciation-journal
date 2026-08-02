import { describe, expect, it } from 'vitest'
import {
  isOptionalLinkStep,
  requiredPracticeSteps,
} from '../step-completion'
import type { DailyStep } from '@/lib/practice/types'

function step(overrides: Partial<DailyStep> & Pick<DailyStep, 'id' | 'kind'>): DailyStep {
  return {
    title: overrides.id,
    subtitle: '',
    icon: 'book',
    exercises: [],
    estMinutes: 2,
    ...overrides,
  }
}

describe('step-completion', () => {
  it('treats concept, study_deck, and href-only rows as optional links', () => {
    expect(isOptionalLinkStep(step({ id: 'journal_entry', kind: 'concept', href: '/journal' }))).toBe(true)
    expect(isOptionalLinkStep(step({ id: 'study', kind: 'study_deck', href: '/courses' }))).toBe(true)
    expect(
      isOptionalLinkStep(
        step({ id: 'odd', kind: 'word_review', href: '/x', exercises: [] }),
      ),
    ).toBe(true)
    expect(
      isOptionalLinkStep(
        step({
          id: 'word_review',
          kind: 'word_review',
          exercises: [{ id: 'e1' } as DailyStep['exercises'][number]],
        }),
      ),
    ).toBe(false)
  })

  it('filters required practice steps for allDone', () => {
    const steps = [
      step({ id: 'word_review', kind: 'word_review' }),
      step({ id: 'journal_entry', kind: 'concept', href: '/journal' }),
      step({ id: 'concept:x', kind: 'concept', href: '/mini-lessons/x' }),
    ]
    expect(requiredPracticeSteps(steps).map((s) => s.id)).toEqual(['word_review'])
  })
})
