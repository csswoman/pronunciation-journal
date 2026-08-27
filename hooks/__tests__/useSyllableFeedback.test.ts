// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useSyllableFeedback } from '../useSyllableFeedback'
import type { WordResult } from '@/lib/types'

vi.mock('@/lib/pronunciation/syllable-separation', () => ({
  SYLLABLE_SEPARATOR: '·',
  resolveSyllableWord: vi.fn(async (word: string) =>
    word === 'happy' ? 'hap·py' : word),
  splitBySyllableSeparator: (word: string) => word.split('·'),
}))

const wordResults: WordResult[] = [{
  expected: 'happy',
  got: 'heppy',
  status: 'incorrect',
  phonemes: {
    expected: [], got: [], tip: null,
    alignment: [
      { phoneme: 'HH', status: 'correct' },
      { phoneme: 'AE', status: 'incorrect', got: 'EH' },
      { phoneme: 'P', status: 'correct' },
      { phoneme: 'IY', status: 'correct' },
    ],
  },
}]

const emptyWordResults: WordResult[] = []

describe('useSyllableFeedback', () => {
  it('resuelve sílabas para palabras falladas', async () => {
    const { result } = renderHook(() => useSyllableFeedback(wordResults))
    await waitFor(() => expect(result.current.get('happy')).toBeDefined())
    expect(result.current.get('happy')!.map((s) => s.status)).toEqual(['error', 'correct'])
  })

  it('empieza vacío y no rompe con lista vacía', async () => {
    const { result } = renderHook(() => useSyllableFeedback(emptyWordResults))
    expect(result.current.size).toBe(0)
  })
})

describe('useSyllableFeedback — palabras con fonemas fallados pero marcadas correctas', () => {
  it('desglosa la palabra aunque su status sea correct', async () => {
    // `scoring.ts` puede dejar una palabra en `correct` con algun fonema de
    // borde fallado. Filtrar por status dejaba esos casos sin explicacion:
    // se pintaban en ambar y no habia tarjeta que dijera por que.
    const nearMiss: WordResult[] = [{
      expected: 'happy',
      got: 'happy',
      status: 'correct',
      phonemes: {
        expected: [], got: [], tip: null,
        alignment: [
          { phoneme: 'HH', status: 'incorrect', got: 'JH' },
          { phoneme: 'AE', status: 'correct' },
          { phoneme: 'P', status: 'correct' },
          { phoneme: 'IY', status: 'correct' },
        ],
      },
    }]

    const { result } = renderHook(() => useSyllableFeedback(nearMiss))
    await waitFor(() => expect(result.current.get('happy')).toBeDefined())
    expect(result.current.get('happy')!.map((s) => s.status)).toEqual(['warning', 'correct'])
  })

  it('ignora las palabras sin ningun fonema fallado', async () => {
    const clean: WordResult[] = [{
      expected: 'happy', got: 'happy', status: 'correct',
      phonemes: {
        expected: [], got: [], tip: null,
        alignment: [
          { phoneme: 'HH', status: 'correct' },
          { phoneme: 'AE', status: 'correct' },
          { phoneme: 'P', status: 'correct' },
          { phoneme: 'IY', status: 'correct' },
        ],
      },
    }]

    const { result } = renderHook(() => useSyllableFeedback(clean))
    await waitFor(() => expect(result.current.size).toBe(0))
  })
})
