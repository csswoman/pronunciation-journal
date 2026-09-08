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

describe('describePhonemeInWord — pattern table', () => {

  it('/z/ final voiced → anchors the final «s» of the word', () => {
    const r = describePhonemeInWord('goes', {
      phoneme: 'Z', ipa: 'z', status: 'incorrect', got: 'S', gotIpa: 's',
    })!
    expect(r.plainEs).toBe('la «s» final de «goes» suena /z/ (con voz), no /s/')
    expect(r.segments.some((s) => s.emphasis === 'grapheme' && s.text === 's')).toBe(true)
    expect(r.segments.some((s) => s.emphasis === 'ipa' && s.text === '/z/')).toBe(true)
  })

  it('/ɪ/ vs /iː/ → short-i explanation', () => {
    const r = describePhonemeInWord('ship', {
      phoneme: 'IH', ipa: 'ɪ', status: 'incorrect', got: 'IY', gotIpa: 'iː',
    })!
    expect(r.plainEs).toBe('la «i» de «ship» es corta /ɪ/, no larga /iː/')
  })

  it('long vowel /iː/ shortened → keep-it-long explanation', () => {
    const r = describePhonemeInWord('seat', {
      phoneme: 'IY', ipa: 'iː', status: 'incorrect', got: 'IH', gotIpa: 'ɪ',
    })!
    expect(r.plainEs).toBe('la vocal de «seat» es larga /iː/; te salió corta')
  })

  it('/θ/ (th) → tongue-between-teeth explanation', () => {
    const r = describePhonemeInWord('think', {
      phoneme: 'TH', ipa: 'θ', status: 'incorrect', got: 'T', gotIpa: 't',
    })!
    expect(r.plainEs).toBe('la «th» de «think» es /θ/ (lengua entre los dientes), no /t/')
  })

  it('/ð/ (th) → voiced-th explanation', () => {
    const r = describePhonemeInWord('this', {
      phoneme: 'DH', ipa: 'ð', status: 'incorrect', got: 'D', gotIpa: 'd',
    })!
    expect(r.plainEs).toBe('la «th» de «this» es /ð/ (lengua entre los dientes, con voz), no /d/')
  })

  it('-ed ending → /t/ ending explanation', () => {
    const r = describePhonemeInWord('walked', {
      phoneme: 'T', ipa: 't', status: 'incorrect', got: undefined, gotIpa: undefined,
    })!
    expect(r.plainEs).toBe('la «-ed» de «walked» suena /t/, no «ed»')
  })

  it('/v/ as /b/ → top-teeth-on-lip explanation', () => {
    const r = describePhonemeInWord('very', {
      phoneme: 'V', ipa: 'v', status: 'incorrect', got: 'B', gotIpa: 'b',
    })!
    expect(r.plainEs).toBe('la «v» de «very» es /v/ (dientes sobre el labio), no /b/')
  })

  it('/h/ missing → aspirate-the-h explanation', () => {
    const r = describePhonemeInWord('house', {
      phoneme: 'HH', ipa: 'h', status: 'missing', got: undefined, gotIpa: undefined,
    })!
    expect(r.plainEs).toBe('la «h» de «house» sí se pronuncia: un soplo suave /h/')
    expect(r.contrastEs).toBe('ese sonido no se te oyó')
  })

  it('schwa /ə/ → reduce-the-vowel explanation', () => {
    const r = describePhonemeInWord('about', {
      phoneme: 'AH', ipa: 'ə', status: 'incorrect', got: 'AA', gotIpa: 'ɑː',
    })!
    expect(r.plainEs).toBe('la vocal átona de «about» se relaja a /ə/, no se pronuncia entera')
  })

  it('/ŋ/ final (ng) → back-of-tongue explanation', () => {
    const r = describePhonemeInWord('sing', {
      phoneme: 'NG', ipa: 'ŋ', status: 'incorrect', got: 'N', gotIpa: 'n',
    })!
    expect(r.plainEs).toBe('la «ng» final de «sing» es un solo sonido nasal /ŋ/, sin «g» marcada')
  })

  it('/j/ initial (y) → glide explanation', () => {
    const r = describePhonemeInWord('yes', {
      phoneme: 'Y', ipa: 'j', status: 'incorrect', got: 'JH', gotIpa: 'dʒ',
    })!
    expect(r.plainEs).toBe('la «y» inicial de «yes» es un deslizamiento suave /j/, no /dʒ/')
  })
})

