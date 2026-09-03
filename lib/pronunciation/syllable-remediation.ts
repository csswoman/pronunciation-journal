import type { PhonemeAlignment } from '@/lib/types'
import { ARPABET_TO_IPA } from './phonemes'
import { IPA_EXTRA } from './ipa-data'
import { ARTICULATION_GUIDE_MAP } from './articulation-guide-data'
import { stripStressDigit } from './arpabet-vowels'
import { getVowelDurationGuidance, type VowelDurationGuidance } from './vowel-duration'

export interface SyllableRemediation {
  /** Clave IPA con barras, ej. "/iː/" — el formato de IPA_EXTRA. */
  ipa: string
  /** Pasos articulatorios en español. */
  articulationEs: string[]
  /** Pista específica para hispanohablantes. */
  spanishTip: string | null
  /** Pista visual de la guía articulatoria. */
  visualCueEs: string | null
  /** Guía de duración acústica (tensas vs laxas). */
  vowelDuration: VowelDurationGuidance | null
  /** Pares mínimos reproducibles como ejemplo. */
  minimalPairs: { wordA: string; wordB: string }[]
}

/**
 * Reúne el contenido que ya existe en la app para explicar un fonema fallado.
 *
 * No autoramos contenido a nivel de sílaba: la sílaba solo localiza el error
 * visualmente, y la explicación cuelga siempre del fonema, que sí tiene
 * material en `IPA_EXTRA` y `ARTICULATION_GUIDE_MAP`.
 */
export function buildRemediation(
  culprit: PhonemeAlignment,
): SyllableRemediation | null {
  const bare = stripStressDigit(culprit.phoneme).toUpperCase()
  const symbol = ARPABET_TO_IPA[bare]
  if (!symbol) return null

  const ipa = `/${symbol}/`
  const extra = IPA_EXTRA[ipa]
  const guide = ARTICULATION_GUIDE_MAP[ipa]
  if (!extra && !guide) return null

  return {
    ipa,
    articulationEs: extra?.articulationEs ?? [],
    spanishTip: extra?.spanishTip ?? null,
    visualCueEs: guide?.visualCueEs ?? null,
    vowelDuration: getVowelDurationGuidance(symbol),
    minimalPairs: (extra?.minimalPairs ?? []).map((pair) => ({
      wordA: pair.wordA,
      wordB: pair.wordB,
    })),
  }
}
