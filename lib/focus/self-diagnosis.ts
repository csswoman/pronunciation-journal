/**
 * lib/focus/self-diagnosis.ts
 *
 * Autodiagnóstico en situaciones, no en etiquetas gramaticales.
 *
 * Un usuario sabe que "se traba contando algo que ya pasó"; no sabe que eso se
 * llama pasado simple. Cada situación se describe con una frase cotidiana y un
 * ejemplo, y mapea a temas reales del catálogo. Es la ruta de entrada para quien
 * no reconoce ninguna sugerencia de la lista.
 */

import type { IllustrationKey } from '@/lib/illustrations/registry'

export type SelfDiagnosisItem = {
  id: string
  /** La dificultad en palabras del usuario, en primera persona. */
  statement: string
  /** Ejemplo concreto de la situación. */
  example: string
  illustration: IllustrationKey
  /** Temas del catálogo que cubren esta dificultad, el más central primero. */
  topicIds: string[]
}

export const SELF_DIAGNOSIS_ITEMS: SelfDiagnosisItem[] = [
  {
    id: 'telling-past',
    statement: 'Me trabo cuando cuento algo que ya pasó',
    example: '"Ayer fui al médico y me dijo que…"',
    illustration: 'domainWriting',
    topicIds: ['grammar:past simple', 'grammar:past continuous'],
  },
  {
    id: 'two-pasts',
    statement: 'No sé cuándo usar "I did" o "I have done"',
    example: '"Viví aquí 5 años" vs "He vivido aquí 5 años"',
    illustration: 'domainProgress',
    topicIds: ['grammar:present perfect', 'grammar:past simple'],
  },
  {
    id: 'asking',
    statement: 'Me cuesta hacer preguntas sin sonar raro',
    example: '"¿Dónde vives?" me sale "Where you live?"',
    illustration: 'domainSpeaking',
    topicIds: ['grammar:questions', 'grammar:question words'],
  },
  {
    id: 'small-words',
    statement: 'Me como las palabras pequeñas: a, the, in, on',
    example: '"I am doctor" en vez de "I am a doctor"',
    illustration: 'domainDictionary',
    topicIds: ['grammar:articles', 'grammar:prepositions'],
  },
  {
    id: 'similar-sounds',
    statement: 'No distingo sonidos parecidos al escuchar',
    example: 'ship y sheep me suenan igual',
    illustration: 'domainListening',
    topicIds: [],
  },
  {
    id: 'plans',
    statement: 'Me cuesta hablar de planes y del futuro',
    example: '"Voy a viajar" vs "Viajaré"',
    illustration: 'domainTip',
    topicIds: ['grammar:going to', 'grammar:future simple'],
  },
  {
    id: 'word-order',
    statement: 'Ordeno las palabras como en español',
    example: '"I like very much this song"',
    illustration: 'domainReading',
    topicIds: ['grammar:word order', 'grammar:adjectives'],
  },
  {
    id: 'formal',
    statement: 'Sueno demasiado simple en contextos formales',
    example: 'Todo me sale con "and" y frases cortas',
    illustration: 'domainVocabulary',
    topicIds: ['grammar:relative clauses', 'grammar:passive'],
  },
]

/** El contraste fonético por defecto cuando el usuario marca "sonidos parecidos". */
export const DEFAULT_PHONEME_TARGET = {
  targetId: 'vowel:/ɪ/',
  label: 'Vocal corta /ɪ/ vs /iː/ (ship vs sheep)',
} as const

/**
 * Temas únicos derivados de las situaciones marcadas, en orden de aparición.
 * Sin duplicados: dos situaciones pueden apuntar al mismo tema.
 */
export function topicsFromSelection(selectedIds: readonly string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const item of SELF_DIAGNOSIS_ITEMS) {
    if (!selectedIds.includes(item.id)) continue
    for (const topicId of item.topicIds) {
      if (seen.has(topicId)) continue
      seen.add(topicId)
      result.push(topicId)
    }
  }

  return result
}

/** True si la selección incluye una dificultad puramente de sonido. */
export function selectionNeedsPhoneme(selectedIds: readonly string[]): boolean {
  return SELF_DIAGNOSIS_ITEMS.some(
    (item) => selectedIds.includes(item.id) && item.topicIds.length === 0,
  )
}
