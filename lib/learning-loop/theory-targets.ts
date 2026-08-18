import { normalizeTopic } from '@/lib/practice/normalize-topic'

/**
 * Authored equivalences only. Missing entries deliberately keep a mini-lesson
 * in its own namespace; titles and prose are never used to guess a topic.
 */
export const MINI_LESSON_EQUIVALENT_DECKS: Readonly<Record<string, string>> = Object.freeze({
  'academic-writing-cohesion': 'c1-cohesion-discurso',
  'advanced-collocations': 'b2-formacion-palabras-colocaciones',
  'articles-a-an-the': 'a1-articulos-basicos',
  'aspect-perfect-continuous': 'b1-presente-perfecto-continuo',
  'basic-listening-reductions': 'cs-reductions',
  'basic-phrasal-verbs': 'b1-phrasal-verbs-tipos',
  'cleft-sentences': 'c1-cleft-estructura-informativa',
  'collocations-make-do': 'b2-formacion-palabras-colocaciones',
  'common-contractions': 'c1-conectores-contracciones-informales',
  'conditionals-zero-first': 'b1-primer-condicional-pasado-continuo',
  'countable-uncountable': 'a1-contables-incontables',
  'discourse-markers': 'b1-conectores-discurso',
  'ellipsis-substitution': 'c1-elipsis-sustitucion-referencia',
  'frequency-adverbs': 'a1-adverbios-frecuencia',
  'hedging-language': 'c1-hedging-matices',
  'inversion-emphasis': 'b2-inversion-enfasis',
  'linking-words-basic': 'a1-conjunciones-basicas',
  'modal-verbs-ability': 'a1-can-capacidad-permiso',
  'modals-deduction': 'b1-modales-deduccion',
  'participle-clauses': 'b2-clausulas-participio',
  'passive-voice-intro': 'b1-voz-pasiva-consejos',
  'pragmatics-politeness': 'c1-pragmatica-tono',
  'prepositions-time': 'a1-preposiciones-lugar-tiempo',
  'question-tags': 'b1-confirmacion-posibilidades',
  'register-formal-informal': 'b2-registro-formal-informal',
  'relative-clauses': 'b1-pronombres-clausulas-relativas',
  'reported-speech': 'b1-estilo-indirecto',
  'second-conditional': 'b1-segundo-condicional',
  'some-any': 'a2-cuantificadores-esenciales',
  'the-add-on-strategy': 'the-add-on-strategy',
  'third-conditional': 'b2-tercer-condicional',
})

function requiredTopic(raw: string): string {
  const normalized = normalizeTopic(raw)
  if (!normalized) throw new Error(`Invalid theory topic: ${raw}`)
  return normalized
}

/** Authored deck slug when this mini-lesson shares a theory topic; otherwise null. */
export function equivalentDeckSlugForMiniLesson(slug: string): string | null {
  return MINI_LESSON_EQUIVALENT_DECKS[slug] ?? null
}

/** Stable topic shared by Route and the corresponding authored deck. */
export function theoryTopicForDeck(deckSlug: string): string {
  return requiredTopic(`theory:${deckSlug}`)
}

/** Explicit equivalence when authored; otherwise a complementary topic. */
export function theoryTopicForMiniLesson(slug: string): string {
  const deckSlug = equivalentDeckSlugForMiniLesson(slug)
  return deckSlug ? theoryTopicForDeck(deckSlug) : requiredTopic(`mini:${slug}`)
}
