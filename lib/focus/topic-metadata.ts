/**
 * lib/focus/topic-metadata.ts
 *
 * Nivel CEFR real y ejemplo mínimo para cada tema del catálogo.
 *
 * Existe porque `getAvailableCurriculumGaps` emitía `level: 'a2'` para los 27
 * temas, y ese valor viaja hasta el prompt de generación: alguien que elegía
 * condicionales o estilo indirecto recibía contenido calibrado para A2.
 *
 * `example` es un par contrastado corto (incorrecto → correcto) que comunica el
 * gap más rápido que su nombre. La tarjeta lo muestra en vez de pedirle al
 * usuario que sepa qué significa "cuantificadores".
 */

import type { FocusLevel } from '@/lib/learning-focus/types'
import type { GapKind } from './types'

export type TopicFamily = 'tiempos' | 'estructura' | 'palabras' | 'vocabulario'

export const TOPIC_FAMILY_LABELS: Record<TopicFamily, string> = {
  tiempos: 'Tiempos verbales',
  estructura: 'Estructura de la oración',
  palabras: 'Tipos de palabra',
  vocabulario: 'Vocabulario',
}

export type TopicMetadata = {
  level: FocusLevel
  family: TopicFamily
  kind: GapKind
  /** Error típico del hispanohablante, en inglés. */
  wrong: string
  /** La forma correcta equivalente. */
  right: string
}

/**
 * Claves = ids de TOPIC_CATALOG. Mantener sincronizado: un id nuevo sin entrada
 * aquí cae al default de `getTopicMetadata`, que es honesto pero genérico.
 */
const TOPIC_METADATA: Record<string, TopicMetadata> = {
  'grammar:subject omission': {
    level: 'a1', family: 'estructura', kind: 'grammar',
    wrong: 'Is raining a lot today', right: 'It is raining a lot today',
  },
  'grammar:articles': {
    level: 'a1', family: 'palabras', kind: 'grammar',
    wrong: 'I am doctor', right: 'I am a doctor',
  },
  'grammar:present simple': {
    level: 'a1', family: 'tiempos', kind: 'grammar',
    wrong: 'She work on weekends', right: 'She works on weekends',
  },
  'grammar:past simple': {
    level: 'a2', family: 'tiempos', kind: 'grammar',
    wrong: 'Yesterday I go to the office', right: 'Yesterday I went to the office',
  },
  'grammar:present continuous': {
    level: 'a1', family: 'tiempos', kind: 'grammar',
    wrong: 'I am work right now', right: 'I am working right now',
  },
  'grammar:word order': {
    level: 'a2', family: 'estructura', kind: 'grammar',
    wrong: 'I like very much this song', right: 'I like this song very much',
  },
  'grammar:past continuous': {
    level: 'a2', family: 'tiempos', kind: 'grammar',
    wrong: 'I was cook when you called', right: 'I was cooking when you called',
  },
  'grammar:present perfect': {
    level: 'b1', family: 'tiempos', kind: 'grammar',
    wrong: 'I live here since 2019', right: 'I have lived here since 2019',
  },
  'grammar:past perfect': {
    level: 'b1', family: 'tiempos', kind: 'grammar',
    wrong: 'When I arrived, she already left', right: 'When I arrived, she had already left',
  },
  'grammar:future simple': {
    level: 'a2', family: 'tiempos', kind: 'grammar',
    wrong: 'I think I go tomorrow', right: 'I think I will go tomorrow',
  },
  'grammar:going to': {
    level: 'a2', family: 'tiempos', kind: 'grammar',
    wrong: 'I will travel, I have the tickets', right: 'I am going to travel, I have the tickets',
  },
  'grammar:conditionals': {
    level: 'b1', family: 'estructura', kind: 'grammar',
    wrong: 'If I will have time, I call you', right: 'If I have time, I will call you',
  },
  'grammar:prepositions': {
    level: 'a2', family: 'palabras', kind: 'grammar',
    wrong: 'I arrive to the airport in Monday', right: 'I arrive at the airport on Monday',
  },
  'grammar:modal verbs': {
    level: 'a2', family: 'palabras', kind: 'grammar',
    wrong: 'I can to swim', right: 'I can swim',
  },
  'grammar:phrasal verbs': {
    level: 'b1', family: 'palabras', kind: 'grammar',
    wrong: 'Please continue with the meeting', right: 'Please carry on with the meeting',
  },
  'grammar:comparatives': {
    level: 'a2', family: 'palabras', kind: 'grammar',
    wrong: 'This one is more cheap', right: 'This one is cheaper',
  },
  'grammar:superlatives': {
    level: 'a2', family: 'palabras', kind: 'grammar',
    wrong: 'It is the more good option', right: 'It is the best option',
  },
  'grammar:questions': {
    level: 'a1', family: 'estructura', kind: 'grammar',
    wrong: 'You like coffee?', right: 'Do you like coffee?',
  },
  'grammar:question words': {
    level: 'a1', family: 'estructura', kind: 'grammar',
    wrong: 'Where you live?', right: 'Where do you live?',
  },
  'grammar:pronouns': {
    level: 'a1', family: 'palabras', kind: 'grammar',
    wrong: 'I gave the book to she', right: 'I gave the book to her',
  },
  'grammar:quantifiers': {
    level: 'a2', family: 'palabras', kind: 'grammar',
    wrong: 'I have much friends here', right: 'I have many friends here',
  },
  'grammar:adjectives': {
    level: 'a1', family: 'palabras', kind: 'grammar',
    wrong: 'A car red and fast', right: 'A fast red car',
  },
  'grammar:adverbs': {
    level: 'a2', family: 'palabras', kind: 'grammar',
    wrong: 'She speaks very good English', right: 'She speaks English very well',
  },
  'grammar:passive': {
    level: 'b1', family: 'estructura', kind: 'grammar',
    wrong: 'The report was wrote by Ana', right: 'The report was written by Ana',
  },
  'grammar:reported speech': {
    level: 'b2', family: 'estructura', kind: 'grammar',
    wrong: 'He said me that he is tired', right: 'He told me that he was tired',
  },
  'grammar:relative clauses': {
    level: 'b1', family: 'estructura', kind: 'grammar',
    wrong: 'The man which called you is here', right: 'The man who called you is here',
  },
  'vocab:vocabulary': {
    level: 'a2', family: 'vocabulario', kind: 'vocabulary',
    wrong: 'I am constipated (por "resfriado")', right: 'I have a cold',
  },
}

const FALLBACK: TopicMetadata = {
  level: 'a2',
  family: 'estructura',
  kind: 'grammar',
  wrong: '',
  right: '',
}

/** Metadata de un tema del catálogo. Nunca lanza: los ids nuevos caen al default. */
export function getTopicMetadata(topicId: string): TopicMetadata {
  return TOPIC_METADATA[topicId] ?? FALLBACK
}

/** True cuando el tema tiene un par de ejemplo real que vale la pena mostrar. */
export function hasExample(meta: TopicMetadata): boolean {
  return meta.wrong.length > 0 && meta.right.length > 0
}
