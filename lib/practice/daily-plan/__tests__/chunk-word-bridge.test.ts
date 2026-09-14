import { describe, expect, it } from 'vitest'
import { biasWordsByChunkAnchors } from '../chunk-word-bridge'
import type { LearningChunk } from '@/lib/chunk-of-day/types'
import type { WordBankEntry } from '@/lib/word-bank/types'

function word(id: string): WordBankEntry {
  return { id, text: id, ipa: null } as WordBankEntry
}

function chunk(anchorIds: string[]): LearningChunk {
  return {
    id: 'chunk', chunk: 'chunk', ipa: '', meaning: '', example: '', category: '',
    learning: {
      cefr: 'A1', communicativeFunction: '', secondaryFunctions: [], register: 'neutral', patternType: 'fixed',
      coreText: '', template: null, slots: [], acceptedAnswers: [], recognitionCueEs: '', productionCueEs: '',
      practiceAnswer: '', confidence: 'high', reviewFlags: [],
    },
    contentGraph: {
      text: '', highlights: [], pronunciationTargetIds: [],
      anchors: anchorIds.map((id) => ({ owner: 'essential_words' as const, id })),
    },
  }
}

describe('biasWordsByChunkAnchors', () => {
  it('promotes only an explicitly anchored word, including the legacy daily fallback alias', () => {
    const words = [word('core1k:go'), word('core1k:help'), word('core1k:day')]
    expect(biasWordsByChunkAnchors(words, [chunk(['c1k:help'])]).map((entry) => entry.id))
      .toEqual(['core1k:help', 'core1k:go', 'core1k:day'])
  })

  it('preserves the selected SRS order when there is no authored link', () => {
    const words = [word('core1k:go'), word('core1k:help')]
    expect(biasWordsByChunkAnchors(words, [chunk(['c1k:day'])])).toEqual(words)
  })
})
