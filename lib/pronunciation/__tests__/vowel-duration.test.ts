import { describe, it, expect } from 'vitest'
import {
  getVowelDurationCategory,
  getVowelDurationGuidance,
  cleanPhonemeSymbol,
} from '../vowel-duration'
import { buildRemediation } from '../syllable-remediation'
import type { PhonemeAlignment } from '@/lib/types'

describe('vowel-duration', () => {
  describe('cleanPhonemeSymbol', () => {
    it('strips slashes and stress numbers', () => {
      expect(cleanPhonemeSymbol('/iː/')).toBe('iː')
      expect(cleanPhonemeSymbol('IY1')).toBe('IY')
      expect(cleanPhonemeSymbol('/ɪ/')).toBe('ɪ')
    })
  })

  describe('getVowelDurationCategory', () => {
    it('identifies tense vowels correctly', () => {
      expect(getVowelDurationCategory('iː')).toBe('tense')
      expect(getVowelDurationCategory('/uː/')).toBe('tense')
      expect(getVowelDurationCategory('IY1')).toBe('tense')
      expect(getVowelDurationCategory('eɪ')).toBe('tense')
      expect(getVowelDurationCategory('aɪ')).toBe('tense')
    })

    it('identifies lax vowels correctly', () => {
      expect(getVowelDurationCategory('ɪ')).toBe('lax')
      expect(getVowelDurationCategory('/ʊ/')).toBe('lax')
      expect(getVowelDurationCategory('IH0')).toBe('lax')
      expect(getVowelDurationCategory('æ')).toBe('lax')
      expect(getVowelDurationCategory('ə')).toBe('lax')
    })

    it('returns null for consonants', () => {
      expect(getVowelDurationCategory('t')).toBeNull()
      expect(getVowelDurationCategory('DH')).toBeNull()
      expect(getVowelDurationCategory('s')).toBeNull()
    })
  })

  describe('getVowelDurationGuidance', () => {
    it('returns tense vowel guidance with ~250-300 ms target', () => {
      const guidance = getVowelDurationGuidance('/iː/')
      expect(guidance).not.toBeNull()
      expect(guidance?.category).toBe('tense')
      expect(guidance?.badge).toContain('Vocal tensa')
      expect(guidance?.targetMs).toBe('~250-300 ms')
      expect(guidance?.tipEs).toContain('Alarga la vocal')
    })

    it('returns lax vowel guidance with ~100-140 ms target', () => {
      const guidance = getVowelDurationGuidance('/ɪ/')
      expect(guidance).not.toBeNull()
      expect(guidance?.category).toBe('lax')
      expect(guidance?.badge).toContain('Vocal laxa')
      expect(guidance?.targetMs).toBe('~100-140 ms')
      expect(guidance?.tipEs).toContain('Vocal breve')
    })
  })

  describe('integration with buildRemediation', () => {
    it('populates vowelDuration when culprit is a tense vowel', () => {
      const culprit: PhonemeAlignment = {
        phoneme: 'IY1',
        ipa: 'iː',
        status: 'incorrect',
        got: 'IH',
        gotIpa: 'ɪ',
      }
      const remediation = buildRemediation(culprit)
      expect(remediation).not.toBeNull()
      expect(remediation?.vowelDuration?.category).toBe('tense')
    })

    it('populates vowelDuration when culprit is a lax vowel', () => {
      const culprit: PhonemeAlignment = {
        phoneme: 'IH0',
        ipa: 'ɪ',
        status: 'incorrect',
        got: 'IY',
        gotIpa: 'iː',
      }
      const remediation = buildRemediation(culprit)
      expect(remediation).not.toBeNull()
      expect(remediation?.vowelDuration?.category).toBe('lax')
    })
  })
})
