import { describe, it, expect } from 'vitest'
import { getThreadHintsForStep, extractFeaturedWords } from '../step-thread'
import type { DailyStep } from '@/lib/practice/types'
import type { LearningChunk } from '@/lib/chunk-of-day/types'

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

function anchoredGoingChunk(): LearningChunk {
  return {
    id: 'going', chunk: "I'm going to...", ipa: '', meaning: '', example: '', category: '',
    learning: {
      cefr: 'A1', communicativeFunction: '', secondaryFunctions: [], register: 'neutral', patternType: 'fixed',
      coreText: '', template: null, slots: [], acceptedAnswers: [], recognitionCueEs: '', productionCueEs: '',
      practiceAnswer: '', confidence: 'high', reviewFlags: [],
    },
    contentGraph: {
      text: "I'm going to...", highlights: [{ start: 4, end: 9 }],
      anchors: [{ owner: 'essential_words', id: 'c1k:go' }], pronunciationTargetIds: [],
    },
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

  it('uses the authored Essential Word anchor instead of an inflected visible form', () => {
    const step: DailyStep = {
      kind: 'chunk_intro', id: 'chunk', title: 'Chunk', subtitle: '', icon: 'Messages', exercises: [], estMinutes: 2,
      featuredWords: ['going'],
      chunks: [anchoredGoingChunk()],
    }

    expect(extractFeaturedWords(step)).toEqual(['go'])
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

  it('includes IPA from study cards when available', () => {
    const steps: DailyStep[] = [
      {
        kind: 'word_intro',
        id: 'wi',
        title: 'Intro',
        subtitle: '',
        icon: 'Sparkles',
        exercises: [],
        estMinutes: 2,
        studyCards: [{ word: 'debounce', ipa: '/diˈbaʊns/', meaning: 'retardar' }],
        featuredWords: ['debounce'],
      },
      vocabStep('word_review', 'wr', 'Review', ['debounce']),
    ]

    expect(getThreadHintsForStep(steps, 1)).toEqual([
      {
        word: 'debounce',
        ipa: '/diˈbaʊns/',
        fromStepTitle: 'Intro',
        fromStepKind: 'word_intro',
      },
    ])
  })

  it('connects an inflected chunk form with its anchored Essential Word', () => {
    const steps: DailyStep[] = [
      {
        kind: 'chunk_intro', id: 'chunk', title: 'Chunk', subtitle: '', icon: 'Messages', exercises: [], estMinutes: 2,
        chunks: [anchoredGoingChunk()],
      },
      vocabStep('word_intro', 'wi', 'Word', ['go']),
    ]

    expect(getThreadHintsForStep(steps, 1)).toEqual([
      { word: 'go', fromStepTitle: 'Chunk', fromStepKind: 'chunk_intro' },
    ])
  })
})
