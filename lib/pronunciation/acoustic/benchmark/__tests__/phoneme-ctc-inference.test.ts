import { describe, expect, it } from 'vitest'
import { decodeCtcFrames, normalizeSamples } from '../phoneme-ctc-inference'

/** Logits de un frame: el token ganador recibe `high`, el resto 0. */
function frame(vocabSize: number, winner: number, high = 10): number[] {
  const out = Array<number>(vocabSize).fill(0)
  out[winner] = high
  return out
}

const VOCAB = ['<pad>', 'v', 'ɛ', 'ɹ']

function logitsFor(winners: number[], high = 10): Float32Array {
  return new Float32Array(winners.flatMap((w) => frame(VOCAB.length, w, high)))
}

describe('decodeCtcFrames', () => {
  it('colapsa frames repetidos en un solo fonema con su tramo', () => {
    // v v v ɛ ɛ → dos fonemas, 3 y 2 frames de 20 ms.
    const result = decodeCtcFrames(logitsFor([1, 1, 1, 2, 2]), 5, VOCAB.length, VOCAB)
    expect(result.map((p) => p.ipa)).toEqual(['v', 'ɛ'])
    expect(result[0]).toMatchObject({ startMs: 0, endMs: 60 })
    expect(result[1]).toMatchObject({ startMs: 60, endMs: 100 })
  })

  it('descarta el blank del CTC sin fusionar lo que separa', () => {
    // v <pad> v → dos /v/ distintos, no uno.
    const result = decodeCtcFrames(logitsFor([1, 0, 1]), 3, VOCAB.length, VOCAB)
    expect(result.map((p) => p.ipa)).toEqual(['v', 'v'])
  })

  it('no emite tokens especiales', () => {
    expect(decodeCtcFrames(logitsFor([0, 0]), 2, VOCAB.length, VOCAB)).toEqual([])
  })

  it('la confianza es la probabilidad posterior media del tramo', () => {
    const [confident] = decodeCtcFrames(logitsFor([1], 20), 1, VOCAB.length, VOCAB)
    // Margen mínimo: gana un token real pero la posterior queda cerca de 1/vocabSize.
    const [unsure] = decodeCtcFrames(logitsFor([1], 1e-6), 1, VOCAB.length, VOCAB)
    expect(confident.confidence).toBeGreaterThan(0.99)
    expect(unsure.confidence).toBeCloseTo(1 / VOCAB.length, 5)
  })

  it('ignora los ids sin token en el vocabulario en vez de romper', () => {
    const sparse = ['<pad>', 'v', undefined, 'ɹ']
    const result = decodeCtcFrames(logitsFor([2, 1]), 2, 4, sparse)
    expect(result.map((p) => p.ipa)).toEqual(['v'])
  })

  it('devuelve vacío sin frames', () => {
    expect(decodeCtcFrames(new Float32Array(0), 0, VOCAB.length, VOCAB)).toEqual([])
  })
})

describe('normalizeSamples', () => {
  it('deja media 0 y desviación 1', () => {
    const out = normalizeSamples(new Float32Array([1, 2, 3, 4, 5]))
    const mean = out.reduce((a, b) => a + b, 0) / out.length
    const std = Math.sqrt(out.reduce((a, b) => a + (b - mean) ** 2, 0) / out.length)
    expect(mean).toBeCloseTo(0, 5)
    expect(std).toBeCloseTo(1, 3)
  })

  it('no divide por cero con una señal constante', () => {
    const out = normalizeSamples(new Float32Array([0.5, 0.5, 0.5]))
    expect([...out].every(Number.isFinite)).toBe(true)
  })
})
