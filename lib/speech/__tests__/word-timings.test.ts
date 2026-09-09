import { describe, expect, it } from 'vitest'
import { splitSpokenWords, estimateWordOffsets, estimatedDuration, wordIndexAtChar } from '../word-timings'

describe('splitSpokenWords', () => {
  it('conserva la puntuacion pegada a su palabra', () => {
    expect(splitSpokenWords('Hello, how are you?')).toEqual([
      'Hello,', 'how', 'are', 'you?',
    ])
  })

  it('devuelve lista vacia para texto en blanco', () => {
    expect(splitSpokenWords('   ')).toEqual([])
  })
})

describe('estimateWordOffsets', () => {
  it('reparte la duracion proporcionalmente a la longitud de cada palabra', () => {
    // "aa" y "bbbb": 2 y 4 caracteres sobre 6 totales, en 600ms.
    const offsets = estimateWordOffsets(['aa', 'bbbb'], 600)
    expect(offsets).toEqual([0, 200])
  })

  it('la primera palabra siempre empieza en 0', () => {
    const offsets = estimateWordOffsets(['one', 'two', 'three'], 900)
    expect(offsets[0]).toBe(0)
  })

  it('los offsets crecen de forma estrictamente creciente', () => {
    const offsets = estimateWordOffsets(['a', 'bb', 'ccc', 'dddd'], 1000)
    for (let i = 1; i < offsets.length; i += 1) {
      expect(offsets[i]).toBeGreaterThan(offsets[i - 1] as number)
    }
  })

  it('devuelve vacio si la duracion no es utilizable', () => {
    // Sin duracion fiable no se estima nada: es preferible no resaltar
    // a resaltar la palabra equivocada.
    expect(estimateWordOffsets(['a', 'b'], 0)).toEqual([])
    expect(estimateWordOffsets(['a', 'b'], Number.NaN)).toEqual([])
  })

  it('devuelve vacio si no hay palabras', () => {
    expect(estimateWordOffsets([], 500)).toEqual([])
  })
})

describe('estimatedDuration', () => {
  it('tiene un mínimo de 600ms para frases cortas', () => {
    expect(estimatedDuration('Hi')).toBe(600)
    expect(estimatedDuration('')).toBe(600)
  })

  it('calcula 60ms por carácter para textos más largos', () => {
    const text = 'This is a longer sentence for testing duration estimation.'
    expect(estimatedDuration(text)).toBe(text.length * 60)
  })
})

describe('wordIndexAtChar', () => {
  it('identifica correctamente el índice de palabra según la posición del carácter', () => {
    const text = 'How are you today?'
    // "How" (0..2), "are" (4..6), "you" (8..10), "today?" (12..17)
    expect(wordIndexAtChar(text, 0)).toBe(0)
    expect(wordIndexAtChar(text, 2)).toBe(0)
    expect(wordIndexAtChar(text, 4)).toBe(1)
    expect(wordIndexAtChar(text, 6)).toBe(1)
    expect(wordIndexAtChar(text, 8)).toBe(2)
    expect(wordIndexAtChar(text, 13)).toBe(3)
  })

  it('no desborda el índice de palabra para posiciones más allá del texto', () => {
    const text = 'One two'
    expect(wordIndexAtChar(text, 100)).toBe(1)
  })
})

