import type { SpeechConstraintId } from '@/lib/exercises/speech-constraints'

/**
 * Closed taxonomy of production error patterns.
 *
 * Closed on purpose: the label comes from an LLM, and an open string would
 * let hallucinated categories accumulate in the learner's state forever.
 * Anything outside this list is discarded at the API boundary.
 */
export type ErrorPatternId =
  | 'tense_present_for_past'
  | 'present_perfect_vs_past'
  | 'missing_auxiliary'
  | 'subject_verb_agreement'
  | 'word_order'
  | 'preposition_choice'
  | 'article_use'
  | 'plural_countable'
  | 'modal_form'
  | 'conditional_form'
  | 'gerund_infinitive'
  | 'comparative_form'
  | 'negation_form'
  | 'question_form'
  | 'vocabulary_choice'
  | 'spelling'

export interface ErrorPattern {
  id: ErrorPatternId
  /** Shown to the learner, in Spanish. */
  description: string
  /** Drill that rehearses the structure this error breaks, when one applies. */
  repairConstraintId: SpeechConstraintId | null
}

export const ERROR_PATTERNS: readonly ErrorPattern[] = [
  {
    id: 'tense_present_for_past',
    description: 'Usaste presente donde hacía falta pasado',
    repairConstraintId: 'past_simple_narrative',
  },
  {
    id: 'present_perfect_vs_past',
    description: 'Confundiste present perfect con past simple',
    repairConstraintId: 'present_perfect_experience',
  },
  {
    id: 'missing_auxiliary',
    description: 'Faltó el auxiliar (do/does/did/have/be)',
    repairConstraintId: 'question_form',
  },
  {
    id: 'subject_verb_agreement',
    description: 'El verbo no concuerda con el sujeto',
    repairConstraintId: null,
  },
  {
    id: 'word_order',
    description: 'El orden de las palabras no es el inglés natural',
    repairConstraintId: null,
  },
  {
    id: 'preposition_choice',
    description: 'Preposición equivocada',
    repairConstraintId: null,
  },
  {
    id: 'article_use',
    description: 'Uso incorrecto de a / an / the (o falta de artículo)',
    repairConstraintId: null,
  },
  {
    id: 'plural_countable',
    description: 'Problema con plurales o incontables',
    repairConstraintId: 'quantity_frequency',
  },
  {
    id: 'modal_form',
    description: 'Forma incorrecta tras un modal',
    repairConstraintId: 'justify_decision',
  },
  {
    id: 'conditional_form',
    description: 'La estructura condicional no está completa',
    repairConstraintId: 'second_conditional',
  },
  {
    id: 'gerund_infinitive',
    description: 'Gerundio donde iba infinitivo, o al revés',
    repairConstraintId: null,
  },
  {
    id: 'comparative_form',
    description: 'Comparativo o superlativo mal formado',
    repairConstraintId: 'comparison',
  },
  {
    id: 'negation_form',
    description: 'La negación no está bien construida',
    repairConstraintId: 'negative_experience',
  },
  {
    id: 'question_form',
    description: 'La pregunta no tiene la inversión correcta',
    repairConstraintId: 'question_form',
  },
  {
    id: 'vocabulary_choice',
    description: 'La palabra elegida no es la natural aquí',
    repairConstraintId: null,
  },
  {
    id: 'spelling',
    description: 'Error de ortografía',
    repairConstraintId: null,
  },
]

export const ERROR_PATTERN_IDS: readonly ErrorPatternId[] = ERROR_PATTERNS.map((p) => p.id)

export function isErrorPatternId(value: unknown): value is ErrorPatternId {
  return typeof value === 'string' && ERROR_PATTERN_IDS.includes(value as ErrorPatternId)
}

export function describeErrorPattern(id: ErrorPatternId): string {
  return ERROR_PATTERNS.find((p) => p.id === id)?.description ?? 'Error de producción'
}

export function repairConstraintFor(id: ErrorPatternId): SpeechConstraintId | null {
  return ERROR_PATTERNS.find((p) => p.id === id)?.repairConstraintId ?? null
}

/** The pattern a given repair drill rehearses, if any. */
export function rehearsedPatternForConstraint(
  constraintId: SpeechConstraintId,
): ErrorPatternId | null {
  return ERROR_PATTERNS.find((p) => p.repairConstraintId === constraintId)?.id ?? null
}
