import type { PhonemeAlignment } from '@/lib/types'
import { isVowelPhoneme } from './arpabet-vowels'

export type SyllableStatus = 'correct' | 'warning' | 'error'

export interface SyllableResult {
  /** Texto ortográfico de la sílaba, ej. "hap". */
  text: string
  /** Fonemas asignados a esta sílaba. */
  phonemes: PhonemeAlignment[]
  status: SyllableStatus
  /**
   * El fonema que explica el fallo, para la remediación. Núcleo primero;
   * si el núcleo está bien, el primer borde fallado. `null` si va en verde.
   */
  culprit: PhonemeAlignment | null
}

/**
 * Agrupa un alignment plano de fonemas en sílabas coloreadas.
 *
 * Devuelve `null` cuando el mapeo no es fiable — la hifenación de `hyphen/en`
 * es ortográfica y no siempre coincide con las sílabas habladas del CMU
 * ("comfortable" son 4 escritas y 3 habladas). Ante la duda preferimos que la
 * UI caiga al feedback por fonema antes que pintar sílabas inventadas.
 */
export function scoreSyllables(
  alignment: PhonemeAlignment[],
  syllables: string[],
): SyllableResult[] | null {
  if (alignment.length === 0 || syllables.length === 0) return null

  const vowelCount = alignment.filter((p) => isVowelPhoneme(p.phoneme)).length
  // Un núcleo por sílaba hablada. Si no cuadra, no sabemos repartir.
  if (vowelCount !== syllables.length) return null

  const groups = groupByNucleus(alignment, syllables.length)
  if (!groups) return null

  return syllables.map((text, index) => {
    const phonemes = groups[index]
    return { text, phonemes, ...classify(phonemes) }
  })
}

/**
 * Reparte los fonemas en tantos grupos como sílabas, cortando de modo que
 * cada grupo contenga exactamente una vocal. Las consonantes iniciales van
 * con la vocal siguiente; las finales, con la vocal anterior.
 */
function groupByNucleus(
  alignment: PhonemeAlignment[],
  syllableCount: number,
): PhonemeAlignment[][] | null {
  const groups: PhonemeAlignment[][] = Array.from(
    { length: syllableCount },
    () => [],
  )

  let current = 0
  let seenVowelInCurrent = false

  for (const phoneme of alignment) {
    const isVowel = isVowelPhoneme(phoneme.phoneme)

    // Una segunda vocal abre la siguiente sílaba; las consonantes que la
    // preceden ya se asignaron a la anterior (coda), que es la convención
    // más simple y estable para feedback visual.
    if (isVowel && seenVowelInCurrent) {
      current += 1
      if (current >= syllableCount) return null
      seenVowelInCurrent = false
    }

    groups[current].push(phoneme)
    if (isVowel) seenVowelInCurrent = true
  }

  // Si alguna sílaba quedó vacía el reparto no es utilizable.
  return groups.every((group) => group.length > 0) ? groups : null
}

function classify(phonemes: PhonemeAlignment[]): {
  status: SyllableStatus
  culprit: PhonemeAlignment | null
} {
  const failed = phonemes.filter((p) => p.status !== 'correct')
  if (failed.length === 0) return { status: 'correct', culprit: null }

  const nucleus = failed.find((p) => isVowelPhoneme(p.phoneme))
  if (nucleus) return { status: 'error', culprit: nucleus }

  return { status: 'warning', culprit: failed[0] }
}
