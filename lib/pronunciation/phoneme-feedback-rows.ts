// lib/pronunciation/phoneme-feedback-rows.ts
import type { WordResult } from '@/lib/types'
import { getArticulation } from './articulation'
import { ARPABET_TO_IPA } from './phonemes'
import { stripStressDigit } from './arpabet-vowels'

/**
 * Filas del desglose por sonido. Una fila nunca afirma que un sonido esté bien:
 * la única señal en producción es `stt_intelligibility` (el reconocedor devuelve
 * palabras, no sonidos), así que lo más que puede decirse por fonema es
 * "posible dificultad". Ver ADR 064 y `docs/architecture/pronunciation-feedback.md`.
 */
export type PhonemeFeedbackRow =
  /** La palabra se reconoció: se dice eso y nada más sobre sus sonidos. */
  | { kind: 'word_recognized'; key: string; word: string }
  /** La palabra no se oyó: no hay nada que analizar sonido a sonido. */
  | { kind: 'word_not_heard'; key: string; word: string }
  /** Un fonema esperado que la proyección del transcript no encontró. */
  | {
      kind: 'difficulty'
      key: string
      word: string
      ipa: string
      /** Fonema que la proyección sugiere en su lugar, si lo hay. */
      gotIpa: string | null
      articulation: string | null
    }

function ipaSymbol(phoneme: string, ipa?: string): string | null {
  if (ipa) return ipa
  const bare = stripStressDigit(phoneme ?? '').toUpperCase()
  return ARPABET_TO_IPA[bare] ?? null
}

/**
 * Convierte el diff de palabras (señal `stt_intelligibility` + proyección de
 * fonemas del diccionario) en filas mostrables.
 *
 * Reglas de honestidad, en orden:
 * 1. Palabra reconocida → una sola fila. Nunca "¡Excelente!" por fonema, porque
 *    el reconocedor corrige hacia palabras válidas y no midió los sonidos.
 * 2. Palabra no oída → una sola fila; señalar cada fonema sería inventar.
 * 3. Palabra reconocida como otra → solo los fonemas que difieren, como
 *    "posible dificultad", con su consejo de articulación.
 */
export function buildSttFeedbackRows(wordResults: WordResult[]): PhonemeFeedbackRow[] {
  const rows: PhonemeFeedbackRow[] = []

  wordResults.forEach((word, wi) => {
    if (word.status === 'extra') return

    const alignment = word.phonemes?.alignment ?? []
    if (alignment.length === 0) return

    if (word.status === 'correct') {
      rows.push({ kind: 'word_recognized', key: `${wi}-recognized`, word: word.expected })
      return
    }

    if (word.status === 'missing') {
      rows.push({ kind: 'word_not_heard', key: `${wi}-not-heard`, word: word.expected })
      return
    }

    alignment.forEach((p, pi) => {
      if (p.status === 'correct') return
      const ipa = ipaSymbol(p.phoneme, p.ipa)
      if (!ipa) return
      rows.push({
        kind: 'difficulty',
        key: `${wi}-${pi}`,
        word: word.expected,
        ipa,
        gotIpa: p.status === 'missing' ? null : (p.gotIpa ?? ipaSymbol(p.got ?? '') ?? null),
        articulation: getArticulation(ipa),
      })
    })
  })

  return rows
}
