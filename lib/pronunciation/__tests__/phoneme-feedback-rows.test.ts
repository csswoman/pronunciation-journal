// lib/pronunciation/__tests__/phoneme-feedback-rows.test.ts
import { describe, expect, it } from 'vitest'
import { buildSttFeedbackRows } from '../phoneme-feedback-rows'
import type { WordResult } from '@/lib/types'

function word(partial: Partial<WordResult>): WordResult {
  return { expected: 'staff', got: 'staff', status: 'correct', ...partial }
}

describe('buildSttFeedbackRows', () => {
  it('colapsa una palabra reconocida en una sola fila', () => {
    const rows = buildSttFeedbackRows([
      word({
        phonemes: {
          expected: [], got: [], tip: null,
          alignment: [
            { phoneme: 'S', ipa: 's', status: 'correct' },
            { phoneme: 'AE', ipa: 'æ', status: 'correct' },
          ],
        },
      }),
    ])
    expect(rows).toEqual([{ kind: 'word_recognized', key: '0-recognized', word: 'staff' }])
  })

  it('colapsa una palabra no oída en una sola fila', () => {
    const rows = buildSttFeedbackRows([
      word({
        got: '',
        status: 'missing',
        phonemes: {
          expected: [], got: [], tip: null,
          alignment: [{ phoneme: 'AE', ipa: 'æ', status: 'missing' }],
        },
      }),
    ])
    expect(rows).toEqual([{ kind: 'word_not_heard', key: '0-not-heard', word: 'staff' }])
  })

  it('solo emite los fonemas que difieren, con articulación y sin afirmar acierto', () => {
    const rows = buildSttFeedbackRows([
      word({
        got: 'stiff',
        status: 'incorrect',
        phonemes: {
          expected: [], got: [], tip: null,
          alignment: [
            { phoneme: 'S', ipa: 's', status: 'correct' },
            { phoneme: 'AE', ipa: 'æ', status: 'incorrect', got: 'IH', gotIpa: 'ɪ' },
          ],
        },
      }),
    ])
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ kind: 'difficulty', ipa: 'æ', gotIpa: 'ɪ', word: 'staff' })
    expect(rows[0]).toHaveProperty('articulation', expect.stringContaining('lengua'))
  })

  it('deriva el IPA del ARPAbet cuando el alineamiento no lo trae', () => {
    const rows = buildSttFeedbackRows([
      word({
        status: 'incorrect',
        phonemes: {
          expected: [], got: [], tip: null,
          alignment: [{ phoneme: 'TH1', status: 'incorrect', got: 'T' }],
        },
      }),
    ])
    expect(rows[0]).toMatchObject({ kind: 'difficulty', ipa: 'θ', gotIpa: 't' })
  })

  it('no emite gotIpa cuando el fonema simplemente no se oyó', () => {
    const rows = buildSttFeedbackRows([
      word({
        status: 'incorrect',
        phonemes: {
          expected: [], got: [], tip: null,
          alignment: [{ phoneme: 'HH', ipa: 'h', status: 'missing' }],
        },
      }),
    ])
    expect(rows[0]).toMatchObject({ kind: 'difficulty', ipa: 'h', gotIpa: null })
  })

  it('ignora palabras extra y palabras sin proyección de fonemas', () => {
    const rows = buildSttFeedbackRows([
      word({ expected: '', got: 'um', status: 'extra' }),
      word({ expected: 'a', got: 'a', status: 'correct' }),
    ])
    expect(rows).toEqual([])
  })
})
