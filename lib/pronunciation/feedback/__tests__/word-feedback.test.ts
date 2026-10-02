import { describe, expect, it } from 'vitest'
import {
  buildWordFeedback,
  firstWordToImprove,
  nextWordToImprove,
} from '../word-feedback'
import type { WordResult } from '@/lib/types'

const ok = (w: string): WordResult => ({ expected: w, got: w, status: 'correct' })

describe('buildWordFeedback', () => {
  it('marks correct words as good with no fix', () => {
    const [w] = buildWordFeedback([ok('to')], new Map())
    expect(w).toMatchObject({ text: 'to', state: 'good', fix: null, note: null })
  })

  it('marks words never heard as bad with an explanatory note', () => {
    const [w] = buildWordFeedback(
      [{ expected: 'forward', got: '', status: 'missing' }],
      new Map(),
    )
    expect(w.state).toBe('bad')
    expect(w.note).toContain('forward')
  })

  it('flags extra words and keeps them bad', () => {
    const [w] = buildWordFeedback([{ expected: '', got: 'um', status: 'extra' }], new Map())
    expect(w).toMatchObject({ text: 'um', state: 'bad', extra: true })
  })

  it('builds a fix from the failed phoneme of an incorrect word', () => {
    const [w] = buildWordFeedback(
      [
        {
          expected: 'hit',
          got: 'heat',
          status: 'incorrect',
          phonemes: {
            expected: ['HH', 'IH', 'T'],
            got: ['HH', 'IY', 'T'],
            tip: null,
            alignment: [
              { phoneme: 'HH', ipa: 'h', status: 'correct' },
              { phoneme: 'IH', ipa: 'ɪ', status: 'incorrect', got: 'IY', gotIpa: 'iː' },
              { phoneme: 'T', ipa: 't', status: 'correct' },
            ],
          },
        },
      ],
      new Map(),
    )
    expect(w.state).toBe('almost')
    expect(w.fix?.ipa).toBe('/ɪ/')
    expect(w.fix?.diagPlain.startsWith('L')).toBe(true) // capitalised
    expect(w.fix?.diagPlain.endsWith('.')).toBe(true)
  })

  it('turns a missing phoneme into the bad state', () => {
    const [w] = buildWordFeedback(
      [
        {
          expected: "I'm",
          got: 'im',
          status: 'incorrect',
          phonemes: {
            expected: ['AY', 'M'],
            got: ['IH', 'M'],
            tip: null,
            alignment: [
              { phoneme: 'AY', ipa: 'aɪ', status: 'missing' },
              { phoneme: 'M', ipa: 'm', status: 'correct' },
            ],
          },
        },
      ],
      new Map(),
    )
    expect(w.state).toBe('bad')
    expect(w.fix?.diagPlain).toMatch(/no se te oyó/i)
  })

  it('falls back to a note built from what was heard when no sound is locatable', () => {
    const [w] = buildWordFeedback(
      [{ expected: 'aim', got: 'im', status: 'incorrect' }],
      new Map(),
    )
    expect(w.fix).toBeNull()
    expect(w.state).toBe('almost')
    expect(w.note).toContain('«im»')
  })
})

describe('word navigation', () => {
  const words = buildWordFeedback(
    [ok('a'), { expected: 'b', got: '', status: 'missing' }, ok('c'), { expected: 'd', got: '', status: 'missing' }],
    new Map(),
  )

  it('finds the first and next words to improve', () => {
    expect(firstWordToImprove(words)).toBe(1)
    expect(nextWordToImprove(words, 1)).toBe(3)
    expect(nextWordToImprove(words, 3)).toBe(-1)
  })
})
