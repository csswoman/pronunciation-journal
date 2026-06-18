import { describe, it, expect } from 'vitest'
import { ARTICULATION, getArticulation } from '../articulation'
import { ARPABET_TO_IPA } from '../phonemes'

describe('getArticulation', () => {
  it('devuelve una descripción para un fonema conocido', () => {
    expect(getArticulation('t')).toMatch(/lengua/i)
    expect(typeof getArticulation('s')).toBe('string')
  })

  it('devuelve null para un símbolo desconocido', () => {
    expect(getArticulation('zzz')).toBeNull()
    expect(getArticulation('')).toBeNull()
  })

  it('tiene una entrada para cada símbolo IPA de ARPABET_TO_IPA', () => {
    const ipaSymbols = Array.from(new Set(Object.values(ARPABET_TO_IPA)))
    const missing = ipaSymbols.filter((ipa) => !(ipa in ARTICULATION))
    expect(missing).toEqual([])
  })
})
