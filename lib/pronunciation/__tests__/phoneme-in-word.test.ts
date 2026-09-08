// lib/pronunciation/__tests__/phoneme-in-word.test.ts
import { describe, expect, it } from 'vitest'
import { describePhonemeInWord } from '../phoneme-in-word'
import type { PhonemeAlignment } from '@/lib/types'

const A = (over: Partial<PhonemeAlignment>): PhonemeAlignment => ({
  phoneme: 'Z',
  ipa: 'z',
  status: 'incorrect',
  ...over,
})

describe('describePhonemeInWord — fallback and contrast', () => {
  it('returns a generic explanation when no pattern matches', () => {
    const r = describePhonemeInWord('blorf', A({ phoneme: 'DH', ipa: 'ð', status: 'incorrect', got: 'D', gotIpa: 'd' }))
    expect(r).not.toBeNull()
    expect(r!.plainEs).toContain('blorf')
    expect(r!.plainEs).toContain('/ð/')
    expect(r!.segments.some((s) => s.emphasis === 'ipa' && s.text.includes('ð'))).toBe(true)
  })

  it('builds contrastEs from status === "missing"', () => {
    const r = describePhonemeInWord('blorf', A({ phoneme: 'DH', ipa: 'ð', status: 'missing', got: undefined, gotIpa: undefined }))
    expect(r!.contrastEs).toBe('ese sonido no se te oyó')
  })

  it('builds contrastEs from a distinct got/gotIpa', () => {
    const r = describePhonemeInWord('blorf', A({ phoneme: 'DH', ipa: 'ð', status: 'incorrect', got: 'D', gotIpa: 'd' }))
    expect(r!.contrastEs).toContain('dijiste')
    expect(r!.contrastEs).toContain('/d/')
  })

  it('returns null when there is no IPA symbol to name', () => {
    const r = describePhonemeInWord('blorf', { phoneme: 'ZZZ', status: 'incorrect' } as PhonemeAlignment)
    expect(r).toBeNull()
  })
})
