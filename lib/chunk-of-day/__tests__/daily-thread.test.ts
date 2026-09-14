import { describe, expect, it } from 'vitest'
import {
  newChunkCountForDailyLoad,
  selectNewChunkThread,
} from '../queries'
import type { LearningChunk } from '../types'

function chunk(id: string, communicativeFunction: string, category = 'daily'): LearningChunk {
  return {
    id,
    chunk: id,
    ipa: '',
    meaning: id,
    example: id,
    category,
    learning: {
      cefr: 'A1',
      communicativeFunction,
      secondaryFunctions: [],
      register: 'neutral',
      patternType: 'fixed',
      coreText: id,
      template: null,
      slots: [],
      acceptedAnswers: [id],
      recognitionCueEs: id,
      productionCueEs: id,
      practiceAnswer: id,
      confidence: 'high',
      reviewFlags: [],
    },
    contentGraph: { text: id, highlights: [], anchors: [], pronunciationTargetIds: [] },
  }
}

describe('hilo diario de chunks', () => {
  it('reduce novedad bajo carga sin convertir el plan normal en solo repaso', () => {
    expect(newChunkCountForDailyLoad(0)).toBe(3)
    expect(newChunkCountForDailyLoad(2)).toBe(2)
    expect(newChunkCountForDailyLoad(6)).toBe(1)
  })

  it('elige chunks inéditos que comparten intención o situación', () => {
    const first = chunk('first', 'saludar', 'social')
    const related = chunk('related', 'saludar', 'social')
    const sameSituation = chunk('situation', 'other', 'social')
    const unrelated = chunk('unrelated', 'comprar', 'travel')
    const selected = selectNewChunkThread(
      [first, related, sameSituation, unrelated],
      new Set(['unrelated']),
      3,
    )

    expect(selected).toHaveLength(3)
    expect(selected.every((entry) =>
      entry.learning.communicativeFunction === selected[0].learning.communicativeFunction
      || entry.category === selected[0].category,
    )).toBe(true)
  })
})
