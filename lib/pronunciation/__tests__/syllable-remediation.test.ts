import { describe, expect, it } from 'vitest'
import { buildRemediation } from '../syllable-remediation'

describe('buildRemediation', () => {
  it('reúne guía articulatoria y ejemplos para una vocal conocida', () => {
    const result = buildRemediation({ phoneme: 'IY', status: 'incorrect', got: 'IH' })
    expect(result).not.toBeNull()
    expect(result!.ipa).toBe('/iː/')
    expect(result!.articulationEs.length).toBeGreaterThan(0)
    expect(result!.minimalPairs.length).toBeGreaterThan(0)
  })

  it('devuelve null para un fonema fuera del inventario', () => {
    expect(buildRemediation({ phoneme: 'ZZ', status: 'incorrect' })).toBeNull()
  })

  it('ignora el dígito de acento', () => {
    expect(buildRemediation({ phoneme: 'IY1', status: 'incorrect' })?.ipa).toBe('/iː/')
  })
})
