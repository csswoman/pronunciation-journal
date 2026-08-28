import { describe, expect, it } from 'vitest'
import { isVowelPhoneme } from '../arpabet-vowels'

describe('isVowelPhoneme', () => {
  it('reconoce monoftongos', () => {
    expect(isVowelPhoneme('IY')).toBe(true)
    expect(isVowelPhoneme('IH')).toBe(true)
    expect(isVowelPhoneme('AE')).toBe(true)
  })

  it('reconoce diptongos', () => {
    expect(isVowelPhoneme('AY')).toBe(true)
    expect(isVowelPhoneme('OW')).toBe(true)
  })

  it('rechaza consonantes', () => {
    expect(isVowelPhoneme('TH')).toBe(false)
    expect(isVowelPhoneme('P')).toBe(false)
  })

  it('ignora el dígito de acento', () => {
    expect(isVowelPhoneme('IY1')).toBe(true)
    expect(isVowelPhoneme('AH0')).toBe(true)
  })

  it('es indiferente a mayúsculas', () => {
    expect(isVowelPhoneme('iy')).toBe(true)
  })
})
