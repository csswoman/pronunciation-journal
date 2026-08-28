'use client'

import { useEffect, useState } from 'react'
import {
  resolveSyllableWord,
  splitBySyllableSeparator,
} from '@/lib/pronunciation/syllable-separation'
import { scoreSyllables, type SyllableResult } from '@/lib/pronunciation/syllable-scoring'
import type { WordResult } from '@/lib/types'

/**
 * Resuelve el desglose silábico de las palabras falladas.
 *
 * Vive en un hook porque `resolveSyllableWord` es async (carga `hyphen/en` de
 * forma diferida), mientras que `scoreSyllables` es puro y síncrono. Las
 * palabras cuyo mapeo no es fiable simplemente no entran en el mapa, y la UI
 * cae al feedback por fonema.
 */
export function useSyllableFeedback(
  wordResults: WordResult[],
): Map<string, SyllableResult[]> {
  const [syllables, setSyllables] = useState<Map<string, SyllableResult[]>>(new Map())

  useEffect(() => {
    let cancelled = false

    // Se filtra por fonemas fallados, no por `status` de palabra: `scoring.ts`
    // puede dejar una palabra en `correct` con un fonema de borde fallado, y
    // esos casos se pintaban en ambar sin ninguna explicacion asociada.
    const failed = wordResults.filter((result) =>
      result.phonemes?.alignment?.some((phoneme) => phoneme.status !== 'correct'))
    if (failed.length === 0) {
      setSyllables((prev) => (prev.size === 0 ? prev : new Map()))
      return
    }

    void Promise.all(
      failed.map(async (result) => {
        const hyphenated = await resolveSyllableWord(result.expected)
        const parts = splitBySyllableSeparator(hyphenated).filter(Boolean)
        const scored = scoreSyllables(result.phonemes!.alignment, parts)
        return scored ? ([result.expected, scored] as const) : null
      }),
    ).then((entries) => {
      if (cancelled) return
      setSyllables(new Map(entries.filter((entry) => entry !== null)))
    })

    return () => { cancelled = true }
  }, [wordResults])

  return syllables
}
