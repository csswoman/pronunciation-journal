import { describe, it, expect } from 'vitest'
import { getThreadHintsForStep, extractFeaturedWords } from '../step-thread'
import type { DailyStep } from '@/lib/practice/types'

function vocabStep(
  kind: DailyStep['kind'],
  id: string,
  title: string,
  words: string[],
): DailyStep {
  return {
    kind,
    id,
    title,
    subtitle: '',
    icon: 'BookOpen',
    exercises: [],
    estMinutes: 2,
    featuredWords: words,
  }
}

describe('extractFeaturedWords', () => {
  it('uses featuredWords when present', () => {
    const step = vocabStep('word_review', 'wr', 'Review', ['Hello', 'World'])
    expect(extractFeaturedWords(step)).toEqual(['hello', 'world'])
  })

  it('falls back to studyCards for word_intro', () => {
    const step: DailyStep = {
      kind: 'word_intro',
      id: 'wi',
      title: 'Intro',
      subtitle: '',
      icon: 'Sparkles',
      exercises: [],
      estMinutes: 2,
      studyCards: [{ word: 'Cat', meaning: 'gato' }],
    }
    expect(extractFeaturedWords(step)).toEqual(['cat'])
  })
})

describe('getThreadHintsForStep', () => {
  it('returns empty for the first step', () => {
    const steps = [vocabStep('word_intro', 'wi', 'Intro', ['cat'])]
    expect(getThreadHintsForStep(steps, 0)).toEqual([])
  })

  it('links words that repeat across intro → review → context', () => {
    const steps = [
      vocabStep('word_intro', 'wi', 'Intro', ['cat', 'dog']),
      vocabStep('word_review', 'wr', 'Review', ['cat', 'fish']),
      vocabStep('context_practice', 'cp', 'Context', ['cat']),
    ]

    const reviewHints = getThreadHintsForStep(steps, 1)
    expect(reviewHints).toEqual([
      { word: 'cat', fromStepTitle: 'Intro', fromStepKind: 'word_intro' },
    ])

    const contextHints = getThreadHintsForStep(steps, 2)
    expect(contextHints).toEqual([
      { word: 'cat', fromStepTitle: 'Intro', fromStepKind: 'word_intro' },
    ])
  })

  it('ignores phoneme_focus steps when building the thread', () => {
    const steps = [
      vocabStep('word_intro', 'wi', 'Intro', ['cat']),
      {
        kind: 'phoneme_focus' as const,
        id: 'pf',
        title: 'Sound',
        subtitle: '',
        icon: 'Mic',
        exercises: [],
        estMinutes: 3,
      },
      vocabStep('word_review', 'wr', 'Review', ['cat']),
    ]
    expect(getThreadHintsForStep(steps, 2)).toEqual([
      { word: 'cat', fromStepTitle: 'Intro', fromStepKind: 'word_intro' },
    ])
  })
})
