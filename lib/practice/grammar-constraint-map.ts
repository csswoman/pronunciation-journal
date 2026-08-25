import type { SpeechConstraintId } from '@/lib/exercises/speech-constraints'

/**
 * Deck slug → the spoken constraint that makes the learner USE that deck's
 * structure. Without this the grammar step would explain a rule and then ask
 * for a sentence the learner could satisfy in present simple.
 *
 * Matched by prefix fragment (`.includes`), so one entry covers deck families.
 */
const DECK_CONSTRAINT_MAP: Array<{ fragment: string; constraintId: SpeechConstraintId }> = [
  { fragment: 'presente-perfecto',   constraintId: 'present_perfect_experience' },
  { fragment: 'pasado-perfecto',     constraintId: 'past_simple_narrative' },
  { fragment: 'pasado-continuo',     constraintId: 'past_continuous_interrupted' },
  { fragment: 'experiencias-pasadas', constraintId: 'past_simple_narrative' },
  { fragment: 'habitos-pasados',     constraintId: 'past_simple_narrative' },
  { fragment: 'used-to',             constraintId: 'past_simple_narrative' },
  { fragment: 'segundo-condicional', constraintId: 'second_conditional' },
  { fragment: 'condicional',         constraintId: 'second_conditional' },
  { fragment: 'wish',                constraintId: 'second_conditional' },
  { fragment: 'will-going-to',       constraintId: 'future_plan' },
  { fragment: 'planes-futuros',      constraintId: 'future_plan' },
  { fragment: 'futuro',              constraintId: 'future_plan' },
  { fragment: 'comparativ',          constraintId: 'comparison' },
  { fragment: 'superlativ',          constraintId: 'comparison' },
  { fragment: 'conectores',          constraintId: 'opinion_connector' },
  { fragment: 'opiniones',           constraintId: 'opinion_connector' },
  { fragment: 'preguntas',           constraintId: 'question_form' },
  { fragment: 'negativas',           constraintId: 'negative_experience' },
  { fragment: 'obligacion',          constraintId: 'justify_decision' },
  { fragment: 'modales',             constraintId: 'justify_decision' },
  { fragment: 'cuantificadores',     constraintId: 'quantity_frequency' },
  { fragment: 'adverbios-frecuencia', constraintId: 'quantity_frequency' },
]

/** The constraint a grammar deck should be practised with, or null. */
export function constraintIdForDeck(deckSlug: string): SpeechConstraintId | null {
  const slug = deckSlug.toLowerCase()
  return DECK_CONSTRAINT_MAP.find((e) => slug.includes(e.fragment))?.constraintId ?? null
}
