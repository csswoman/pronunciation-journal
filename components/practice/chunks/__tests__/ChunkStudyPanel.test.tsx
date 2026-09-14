import { describe, expect, it } from 'vitest'
import { essentialAnchorLabels } from '../ChunkStudyPanel'
import type { LearningChunk } from '@/lib/chunk-of-day/types'

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

describe('essentialAnchorLabels', () => {
  it('shows the authored Essential Word label once without exposing its namespace', () => {
    expect(essentialAnchorLabels(chunk(['c1k:go', 'c1k:go', 'c1k:help']))).toEqual(['go', 'help'])
  })

  it('does not invent a label for an unresolvable anchor', () => {
    expect(essentialAnchorLabels(chunk(['word-bank-id']))).toEqual([])
  })
})
