import { describe, expect, it } from 'vitest'
import { scoreSyllables } from '../syllable-scoring'
import type { PhonemeAlignment } from '@/lib/types'

/** "happy" → HH AE P IY, sílabas hap·py */
const happy: PhonemeAlignment[] = [
  { phoneme: 'HH', status: 'correct' },
  { phoneme: 'AE', status: 'correct' },
  { phoneme: 'P', status: 'correct' },
  { phoneme: 'IY', status: 'correct' },
]

describe('scoreSyllables', () => {
  it('marca verde cuando todos los fonemas son correctos', () => {
    const result = scoreSyllables(happy, ['hap', 'py'])
    expect(result).not.toBeNull()
    expect(result!.map((s) => s.status)).toEqual(['correct', 'correct'])
    expect(result!.map((s) => s.text)).toEqual(['hap', 'py'])
  })

  it('marca rojo la sílaba cuyo núcleo vocálico falla', () => {
    const alignment: PhonemeAlignment[] = [
      { phoneme: 'HH', status: 'correct' },
      { phoneme: 'AE', status: 'incorrect', got: 'EH' },
      { phoneme: 'P', status: 'correct' },
      { phoneme: 'IY', status: 'correct' },
    ]
    const result = scoreSyllables(alignment, ['hap', 'py'])
    expect(result!.map((s) => s.status)).toEqual(['error', 'correct'])
  })

  it('marca amarillo cuando solo falla una consonante de borde', () => {
    const alignment: PhonemeAlignment[] = [
      { phoneme: 'HH', status: 'incorrect', got: 'F' },
      { phoneme: 'AE', status: 'correct' },
      { phoneme: 'P', status: 'correct' },
      { phoneme: 'IY', status: 'correct' },
    ]
    const result = scoreSyllables(alignment, ['hap', 'py'])
    expect(result!.map((s) => s.status)).toEqual(['warning', 'correct'])
  })

  it('marca amarillo un fonema omitido en el borde', () => {
    const alignment: PhonemeAlignment[] = [
      { phoneme: 'HH', status: 'correct' },
      { phoneme: 'AE', status: 'correct' },
      { phoneme: 'P', status: 'missing' },
      { phoneme: 'IY', status: 'correct' },
    ]
    const result = scoreSyllables(alignment, ['hap', 'py'])
    expect(result!.map((s) => s.status)).toEqual(['warning', 'correct'])
  })

  it('expone el fonema culpable priorizando el núcleo', () => {
    const alignment: PhonemeAlignment[] = [
      { phoneme: 'HH', status: 'incorrect', got: 'F' },
      { phoneme: 'AE', status: 'incorrect', got: 'EH' },
      { phoneme: 'P', status: 'correct' },
      { phoneme: 'IY', status: 'correct' },
    ]
    const result = scoreSyllables(alignment, ['hap', 'py'])
    expect(result![0].culprit?.phoneme).toBe('AE')
  })

  it('devuelve null cuando las vocales no cuadran con las sílabas', () => {
    // "comfortable": 4 sílabas ortográficas, 3 vocales habladas.
    const alignment: PhonemeAlignment[] = [
      { phoneme: 'K', status: 'correct' },
      { phoneme: 'AH', status: 'correct' },
      { phoneme: 'M', status: 'correct' },
      { phoneme: 'F', status: 'correct' },
      { phoneme: 'ER', status: 'correct' },
      { phoneme: 'T', status: 'correct' },
      { phoneme: 'B', status: 'correct' },
      { phoneme: 'AH', status: 'correct' },
      { phoneme: 'L', status: 'correct' },
    ]
    expect(scoreSyllables(alignment, ['com', 'fort', 'a', 'ble'])).toBeNull()
  })

  it('devuelve null con alignment vacío', () => {
    expect(scoreSyllables([], ['hap', 'py'])).toBeNull()
  })

  it('maneja una sola sílaba', () => {
    const alignment: PhonemeAlignment[] = [
      { phoneme: 'SH', status: 'correct' },
      { phoneme: 'IH', status: 'incorrect', got: 'IY' },
      { phoneme: 'P', status: 'correct' },
    ]
    const result = scoreSyllables(alignment, ['ship'])
    expect(result!.map((s) => s.status)).toEqual(['error'])
  })
})
