// lib/pronunciation/__tests__/pick-primary-fix.test.ts
import { describe, expect, it } from 'vitest'
import { pickPrimaryFix } from '../pick-primary-fix'
import type { SyllableResult } from '../syllable-scoring'
import type { PhonemeAlignment, WordResult } from '@/lib/types'

const vowelCulprit: PhonemeAlignment = { phoneme: 'IH', ipa: 'ɪ', status: 'incorrect', got: 'IY', gotIpa: 'iː' }
const consCulprit: PhonemeAlignment = { phoneme: 'Z', ipa: 'z', status: 'incorrect', got: 'S', gotIpa: 's' }

const wordResult = (over: Partial<WordResult>): WordResult => ({
  expected: 'ship', got: 'sheep', status: 'incorrect', ...over,
})

describe('pickPrimaryFix', () => {
  it('prefers a vowel culprit in a failed syllable', () => {
    const syllableMap = new Map<string, SyllableResult[]>([
      ['ship', [{ text: 'ship', phonemes: [], status: 'error', culprit: vowelCulprit }]],
      ['goes', [{ text: 'goes', phonemes: [], status: 'warning', culprit: consCulprit }]],
    ])
    const results = [wordResult({ expected: 'goes' }), wordResult({ expected: 'ship' })]
    expect(pickPrimaryFix(results, syllableMap)).toEqual({ syllableText: 'ship', culprit: vowelCulprit })
  })

  it('falls back to a consonant culprit when no vowel culprit exists', () => {
    const syllableMap = new Map<string, SyllableResult[]>([
      ['goes', [{ text: 'goes', phonemes: [], status: 'warning', culprit: consCulprit }]],
    ])
    const results = [wordResult({ expected: 'goes' })]
    expect(pickPrimaryFix(results, syllableMap)).toEqual({ syllableText: 'goes', culprit: consCulprit })
  })

  it('falls back to the first non-correct alignment of the first incorrect word, using the whole word', () => {
    const results: WordResult[] = [
      wordResult({
        expected: 'would', got: 'wood', status: 'incorrect',
        phonemes: {
          expected: [], got: [], tip: null,
          alignment: [
            { phoneme: 'W', status: 'correct' },
            { phoneme: 'UH', ipa: 'ʊ', status: 'incorrect', got: 'UW', gotIpa: 'uː' },
          ],
        },
      }),
    ]
    expect(pickPrimaryFix(results, new Map())).toEqual({
      syllableText: 'would',
      culprit: { phoneme: 'UH', ipa: 'ʊ', status: 'incorrect', got: 'UW', gotIpa: 'uː' },
    })
  })

  it('returns null when nothing failed', () => {
    const results: WordResult[] = [{ expected: 'I', got: 'I', status: 'correct' }]
    expect(pickPrimaryFix(results, new Map())).toBeNull()
  })
})
