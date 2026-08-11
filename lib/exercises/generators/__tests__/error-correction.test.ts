import { describe, expect, it } from 'vitest'
import type { GrammarCardBlock, GrammarStudyDeckData } from '@/lib/courses/grammar-deck/types'
import { extractAuthoredErrorPairs, generateErrorCorrectionFromDeck } from '../error-correction'

function deck(...blocks: GrammarCardBlock[]): GrammarStudyDeckData {
  return {
    meta: { eyebrow: 'Grammar', title: 'Present simple' },
    cards: [{ id: 'card-1', index: 1, tag: 'Rule', title: 'Rule', lede: 'Lede', blocks }],
  }
}

describe('authored error correction', () => {
  it('extracts only adjacent bad -> good pairs and carries the authored note', () => {
    const source = deck({ type: 'pairs', lines: [
      { variant: 'bad', text: 'She work here.', note: 'Use third-person -s.' },
      { variant: 'good', text: 'She works here.' },
    ] })
    expect(extractAuthoredErrorPairs(source)).toEqual({
      pairs: [{ bad: 'She work here.', good: 'She works here.', explanation: 'Use third-person -s.', cardId: 'card-1', blockIndex: 0, lineIndex: 0 }],
      skipped: [],
    })
  })

  it('does not infer pairs across omissions, ambiguous runs, or block boundaries', () => {
    const source = deck(
      { type: 'pairs', lines: [{ variant: 'bad', text: 'Missing correction.' }] },
      { type: 'pairs', lines: [{ variant: 'bad', text: 'First bad.' }, { variant: 'bad', text: 'Second bad.' }, { variant: 'good', text: 'A good line.' }] },
      { type: 'pairs', lines: [{ variant: 'good', text: 'Separate block.' }] },
    )
    const result = extractAuthoredErrorPairs(source)
    expect(result.pairs).toEqual([])
    expect(result.skipped.map((skip) => skip.reason)).toEqual(expect.arrayContaining([
      'bad_without_good', 'consecutive_bad', 'good_without_bad',
    ]))
  })

  it('generates stable, capped exercises with canonical topic and source metadata', () => {
    const source = deck({ type: 'pairs', lines: [
      { variant: 'bad', text: 'She work here.' }, { variant: 'good', text: 'She works here.' },
      { variant: 'bad', text: 'He live here.' }, { variant: 'good', text: 'He lives here.' },
    ] })
    const first = generateErrorCorrectionFromDeck('a1-present', 'Present_Simple', source, 1)
    const second = generateErrorCorrectionFromDeck('a1-present', 'Present_Simple', source, 1)
    expect(first).toEqual(second)
    expect(first).toHaveLength(1)
    expect(first[0]).toMatchObject({
      type: 'error_correction', sentence: 'She work here.', correctSentence: 'She works here.',
      topic: 'grammar:present simple', sourceRef: { source: 'text_fragments', id: 'grammar-deck:a1-present' },
    })
  })
})
