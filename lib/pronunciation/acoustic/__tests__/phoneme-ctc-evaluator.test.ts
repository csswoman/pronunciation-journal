import { describe, expect, it } from 'vitest'
import {
  assessRecognizedPhonemes,
  expandComposites,
  type RecognizedPhoneme,
} from '../phoneme-ctc-evaluator'
import {
  arpabetCandidates,
  COMPOSITE_EXPANSIONS,
  IPA_TO_ARPABET,
  PRIORITY_ARPABET,
  satisfies,
} from '../phoneme-arpabet-folding'

/** Fonemas reconocidos consecutivos de 80 ms, para no repetir tiempos. */
function recognized(ipas: string[], confidence = 0.9): RecognizedPhoneme[] {
  return ipas.map((ipa, i) => ({
    ipa,
    startMs: i * 80,
    endMs: (i + 1) * 80,
    confidence,
  }))
}

describe('phoneme-arpabet folding', () => {
  it('nunca fusiona dos fonemas de la lista prioritaria', () => {
    const priority = new Set<string>(PRIORITY_ARPABET)
    for (const [ipa, candidates] of Object.entries(IPA_TO_ARPABET)) {
      const collisions = candidates.filter((c) => priority.has(c))
      expect(
        collisions.length,
        `«${ipa}» satisface varios contrastes prioritarios: ${collisions.join('/')}`,
      ).toBeLessThanOrEqual(1)
    }
  })

  it('mantiene separados /ɪ/ y /iː/, que son el contraste a medir', () => {
    expect(satisfies('ɪ', 'IH')).toBe(true)
    expect(satisfies('ɪ', 'IY')).toBe(false)
    expect(satisfies('iː', 'IY')).toBe(true)
    expect(satisfies('iː', 'IH')).toBe(false)
  })

  it('acepta el flap como /t/ o /d/, que no contrastan en esa posición', () => {
    expect(satisfies('ɾ', 'T')).toBe(true)
    expect(satisfies('ɾ', 'D')).toBe(true)
  })

  it('ignora el dígito de acento del ARPAbet y los diacríticos de espeak', () => {
    expect(satisfies('æ', 'AE1')).toBe(true)
    expect(satisfies('ˈæ', 'AE')).toBe(true)
  })

  it('no adivina con tokens fuera del inventario del inglés', () => {
    expect(arpabetCandidates('iɛ5')).toEqual([])
    expect(arpabetCandidates('tɕh')).toEqual([])
  })

  it('cada parte de un compuesto es un fonema conocido', () => {
    for (const [composite, parts] of Object.entries(COMPOSITE_EXPANSIONS)) {
      for (const part of parts) {
        expect(arpabetCandidates(part), `«${composite}» → «${part}» sin mapeo`).not.toEqual([])
      }
    }
  })
})

describe('expandComposites', () => {
  it('parte la vocal rotizada en vocal + /r/ y reparte el tramo', () => {
    const result = expandComposites([{ ipa: 'ɔːɹ', startMs: 100, endMs: 200, confidence: 0.8 }])
    expect(result).toEqual([
      { ipa: 'ɔː', startMs: 100, endMs: 150, confidence: 0.8 },
      { ipa: 'ɹ', startMs: 150, endMs: 200, confidence: 0.8 },
    ])
  })

  it('deja intacto lo que no es compuesto', () => {
    const token = { ipa: 'v', startMs: 0, endMs: 80, confidence: 0.9 }
    expect(expandComposites([token])).toEqual([token])
  })

  it('«for» se alinea con AO R en vez de abstenerse', () => {
    const result = assessRecognizedPhonemes(
      ['F', 'AO', 'R'],
      [
        { ipa: 'f', startMs: 0, endMs: 60, confidence: 0.9 },
        { ipa: 'ɔːɹ', startMs: 60, endMs: 180, confidence: 0.9 },
      ],
      'test-v1',
    )
    expect(result.phonemes.map((p) => p.verdict)).toEqual(['match', 'match', 'match'])
    expect(result.phonemes.some((p) => p.abstained)).toBe(false)
  })
})

describe('assessRecognizedPhonemes', () => {
  it('marca match cuando lo reconocido cubre lo esperado', () => {
    const result = assessRecognizedPhonemes(['V', 'EH1', 'R', 'IY0'], recognized(['v', 'ɛ', 'ɹ', 'iː']), 'test-v1')
    expect(result.evaluatorKind).toBe('phoneme_ctc')
    expect(result.phonemes.map((p) => p.verdict)).toEqual(['match', 'match', 'match', 'match'])
    expect(result.additions).toEqual([])
  })

  it('detecta la sustitución /v/ → /b/ y conserva el tramo', () => {
    const result = assessRecognizedPhonemes(['V', 'EH', 'R', 'IY'], recognized(['b', 'ɛ', 'ɹ', 'iː']), 'test-v1')
    expect(result.phonemes[0]).toMatchObject({
      expected: 'V',
      verdict: 'substitution',
      gotIpa: 'b',
      startMs: 0,
      endMs: 80,
      abstained: false,
    })
    expect(result.phonemes.slice(1).every((p) => p.verdict === 'match')).toBe(true)
  })

  it('detecta la omisión de /h/ sin inventar un tramo', () => {
    const result = assessRecognizedPhonemes(['HH', 'AE', 'T'], recognized(['æ', 't']), 'test-v1')
    expect(result.phonemes.map((p) => p.verdict)).toEqual(['deletion', 'match', 'match'])
    expect(result.phonemes[0]).toMatchObject({ gotIpa: null, startMs: null, confidence: null })
  })

  it('cuenta la epéntesis inicial de "e-school" como adición, no como error de /s/', () => {
    const result = assessRecognizedPhonemes(['S', 'K', 'UW', 'L'], recognized(['e', 's', 'k', 'uː', 'l']), 'test-v1')
    expect(result.phonemes.map((p) => p.verdict)).toEqual(['match', 'match', 'match', 'match'])
    expect(result.additions.map((a) => a.ipa)).toEqual(['e'])
  })

  it('se abstiene en una sustitución por un token de otra lengua del modelo', () => {
    const result = assessRecognizedPhonemes(['V'], recognized(['iɛ5']), 'test-v1')
    expect(result.phonemes[0]).toMatchObject({ verdict: 'substitution', abstained: true })
  })

  it('devuelve todo como omisión cuando no se reconoció nada', () => {
    const result = assessRecognizedPhonemes(['S', 'IY'], [], 'test-v1')
    expect(result.phonemes.map((p) => p.verdict)).toEqual(['deletion', 'deletion'])
  })

  it('mantiene la confianza del tramo para poder abstenerse más tarde', () => {
    const result = assessRecognizedPhonemes(['Z'], recognized(['s'], 0.42), 'test-v1')
    expect(result.phonemes[0].confidence).toBeCloseTo(0.42)
  })
})
