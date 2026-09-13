/**
 * Communicative constraints for free spoken/written production.
 *
 * Why this exists: the generic prompt "say a sentence with X" is always
 * satisfiable in present simple, so a learner who defaults to the present
 * never leaves it and still scores `correct`. Each constraint forces one
 * tense or discourse function, and ships the English instruction the grader
 * uses to verify compliance.
 */

import { cefrToNumber, type CEFRLevel } from '@/lib/exercises/cefr'

export type SpeechConstraintId =
  | 'past_simple_narrative'
  | 'present_perfect_experience'
  | 'future_plan'
  | 'second_conditional'
  | 'comparison'
  | 'opinion_connector'
  | 'past_continuous_interrupted'
  | 'justify_decision'
  | 'problem_explanation'
  | 'negative_experience'
  | 'question_form'
  | 'quantity_frequency'
  | 'rodeo_circumlocution'
  | 'spoken_verb_transform'
  | 'past_chain_narrative'
  | 'rapid_response'

export interface SpeechConstraint {
  id: SpeechConstraintId
  /** Short badge shown to the learner, e.g. "Pasado". */
  label: string
  /**
   * Lowest CEFR level that has been taught the grammar or discourse move this
   * constraint demands. Below it the task is not hard, it is impossible: an A1
   * learner asked for a second conditional has no structure to reach for and
   * fails for reasons the grader cannot distinguish from a vocabulary gap.
   */
  minLevel: Extract<CEFRLevel, 'A1' | 'A2' | 'B1' | 'B2'>
  /** Full task prompt in Spanish. Receives the target word. */
  promptEs: (word: string) => string
  /** Instruction the grader applies to decide `constraintMet`. */
  checkEn: string
}

export const SPEECH_CONSTRAINTS: readonly SpeechConstraint[] = [
  {
    id: 'past_simple_narrative',
    minLevel: 'A2',
    label: 'Pasado',
    promptEs: (w) => `Cuenta en PASADO algo que hiciste con "${w}". Usa past simple.`,
    checkEn: 'The response must contain at least one past simple verb (e.g. went, bought, was). Present-tense-only responses fail.',
  },
  {
    id: 'present_perfect_experience',
    minLevel: 'B1',
    label: 'Present perfect',
    promptEs: (w) => `Di algo que YA HAS hecho (o nunca has hecho) con "${w}". Usa present perfect.`,
    checkEn: 'The response must use present perfect (have/has + past participle). Past simple alone fails.',
  },
  {
    id: 'future_plan',
    minLevel: 'A2',
    label: 'Planes',
    promptEs: (w) => `Habla de un PLAN futuro con "${w}". Usa "going to" o "will".`,
    checkEn: 'The response must express a future plan with "going to", "will", or present continuous for future. Present simple alone fails.',
  },
  {
    id: 'second_conditional',
    minLevel: 'B1',
    label: 'Hipótesis',
    promptEs: (w) => `Imagina algo hipotético con "${w}". Usa "If I ... , I would ...".`,
    checkEn: 'The response must contain a second conditional: an "if" clause with past simple plus a "would" main clause.',
  },
  {
    id: 'comparison',
    minLevel: 'A2',
    label: 'Comparar',
    promptEs: (w) => `Compara "${w}" con otra cosa. Usa un comparativo (more/-er ... than) o un superlativo.`,
    checkEn: 'The response must contain a comparative or superlative structure (e.g. "-er than", "more X than", "the most X").',
  },
  {
    id: 'opinion_connector',
    minLevel: 'A1',
    label: 'Opinión',
    promptEs: (w) => `Da tu OPINIÓN sobre "${w}" y justifícala con "because" o "so".`,
    checkEn: 'The response must state an opinion and justify it with a connector such as "because", "so", "although" or "however".',
  },
  {
    id: 'past_continuous_interrupted',
    minLevel: 'B1',
    label: 'Pasado continuo',
    promptEs: (w) => `Di qué ESTABAS haciendo con "${w}" cuando pasó algo. Usa "was/were + -ing" y "when".`,
    checkEn: 'The response must contain a past continuous ("was/were" + -ing), ideally interrupted by a "when" clause.',
  },
  {
    id: 'justify_decision',
    minLevel: 'B1',
    label: 'Justificar',
    promptEs: (w) => `Elige entre dos opciones relacionadas con "${w}" y explica POR QUÉ en dos frases.`,
    checkEn: 'The response must state a choice and give a reason for it. A single unjustified statement fails.',
  },
  {
    id: 'problem_explanation',
    minLevel: 'B1',
    label: 'Explicar',
    promptEs: (w) => `Explica un PROBLEMA relacionado con "${w}" y cómo lo resolverías.`,
    checkEn: 'The response must describe a problem and propose a solution. Naming the problem alone fails.',
  },
  {
    id: 'negative_experience',
    minLevel: 'A1',
    label: 'Negación',
    promptEs: (w) => `Di algo que NO hiciste o NO te gusta sobre "${w}". Usa una forma negativa.`,
    checkEn: 'The response must contain a grammatical negative form (didn\'t, don\'t, haven\'t, never, etc.).',
  },
  {
    id: 'question_form',
    minLevel: 'A1',
    label: 'Preguntar',
    promptEs: (w) => `Formula una PREGUNTA usando "${w}" para alguien que acabas de conocer.`,
    checkEn: 'The response must be a grammatical English question with correct auxiliary/subject inversion or a wh- word.',
  },
  {
    id: 'quantity_frequency',
    minLevel: 'A1',
    label: 'Frecuencia',
    promptEs: (w) => `Di CON QUÉ FRECUENCIA o CUÁNTO usas "${w}". Usa un adverbio de frecuencia o cuantificador.`,
    checkEn: 'The response must contain a frequency adverb (usually, rarely, twice a week...) or a quantifier (a lot of, a few...).',
  },
  {
    id: 'rodeo_circumlocution',
    minLevel: 'B1',
    label: 'Rodeo',
    promptEs: (w) => `Describe qué es o para qué sirve "${w}" SIN decir la palabra "${w}". Usa frases como "It is a thing that..." o "You use it when...".`,
    checkEn: 'The response must describe the target concept without pronouncing the exact target word. It must use circumlocution such as relative clauses or purpose descriptions (e.g. "It is a thing that...", "A person who...", "It refers to...").',
  },
  {
    id: 'spoken_verb_transform',
    minLevel: 'A2',
    label: 'Transformación',
    promptEs: (w) => `Transforma una acción con "${w}" al PASADO o al FUTURO y dila en voz alta.`,
    checkEn: 'The response must successfully transform a baseline verb action into past simple, past continuous, or future with correct morphology.',
  },
  {
    id: 'past_chain_narrative',
    minLevel: 'B2',
    label: 'Narración',
    promptEs: (w) => `Cuenta una micro-secuencia de 2 o 3 frases en PASADO sobre "${w}". Mantén el tiempo verbal continuo.`,
    checkEn: 'The response must contain a narrative of at least 2 sentences consistently using past tenses without dropping back to present.',
  },
  {
    id: 'rapid_response',
    minLevel: 'B2',
    label: 'Respuesta rápida',
    promptEs: (w) => `Tienes 5 segundos para pensar y responde de forma fluida: ¿Cómo usarías o experimentarías "${w}" en una situación real?`,
    checkEn: 'The response must provide a spontaneous English answer addressing the prompt with continuous speech and intelligible syntax.',
  },
]

/** djb2 — same hashing approach as `exerciseId` in lib/exercises/utils.ts. */
function hashSeed(seed: string): number {
  let hash = 5381
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 33) ^ seed.charCodeAt(i)
  }
  return hash >>> 0
}

export function constraintById(id: string): SpeechConstraint | null {
  return SPEECH_CONSTRAINTS.find((c) => c.id === id) ?? null
}

/**
 * The constraints a learner at `level` has the grammar to attempt.
 *
 * An unknown level returns everything: no opinion is better than a wrong
 * restriction, and that is also the pre-existing behaviour for every caller
 * that has no level to pass.
 */
export function constraintsForLevel(level?: CEFRLevel): SpeechConstraint[] {
  if (!level) return [...SPEECH_CONSTRAINTS]
  const ceiling = cefrToNumber(level)
  return SPEECH_CONSTRAINTS.filter((c) => cefrToNumber(c.minLevel) <= ceiling)
}

/**
 * Deterministically pick `count` distinct constraints. `preferred` ids are
 * placed first (used later by Plan C to re-target a learner's weak patterns).
 * `level`, when given, drops every constraint above the learner — including
 * preferred ones, since a forced slot is no reason to hand someone a task
 * they cannot perform.
 */
export function selectConstraints(
  seed: string,
  count: number,
  preferred: readonly string[] = [],
  level?: CEFRLevel,
): SpeechConstraint[] {
  const pool = constraintsForLevel(level)
  const poolIds = new Set(pool.map((c) => c.id))

  const preferredList = preferred
    .map((id) => constraintById(id))
    .filter((c): c is SpeechConstraint => c !== null && poolIds.has(c.id))

  const preferredIds = new Set(preferredList.map((c) => c.id))
  const rest = pool.filter((c) => !preferredIds.has(c.id))

  // Deterministic rotation: start at an offset derived from the seed.
  const offset = hashSeed(seed) % (rest.length || 1)
  const rotated = [...rest.slice(offset), ...rest.slice(0, offset)]

  return [...preferredList, ...rotated].slice(0, Math.min(count, pool.length))
}
