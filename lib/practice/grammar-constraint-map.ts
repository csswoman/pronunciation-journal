import type { SpeechConstraintId } from '@/lib/exercises/speech-constraints'

/**
 * Deck slug → the spoken constraint that makes the learner USE that deck's
 * structure. Without this the grammar step would explain a rule and then ask
 * for a sentence the learner could satisfy in present simple.
 *
 * Matched by substring fragment (`.includes`), so one entry covers deck
 * families. Array order = priority: more specific fragments must be listed
 * before generic ones that could also match the same slug (e.g. a deck slug
 * can contain both "comparativ" and "planes-futuros" — the specific
 * "comparativ" entry is listed first so it wins).
 *
 * Intentionally left unmapped (no existing SpeechConstraintId is a genuine
 * fit — forcing one would produce confusing/incorrect prompts):
 * - `voz-pasiva` (passive voice): no constraint targets the passive
 *   structure itself; the closest candidate (`justify_decision`) doesn't
 *   require passive voice at all, so it wouldn't close the loophole.
 * - `estilo-indirecto` (reported speech): `past_simple_narrative` only
 *   forces a past-tense verb, not the backshift/reporting-verb pattern that
 *   defines reported speech — a wrong-fit that would validate sentences with
 *   no reported speech in them.
 * - `clausulas-relativas` (relative clauses): no constraint checks for a
 *   relative pronoun or defining/non-defining clause; `comparison` is
 *   unrelated grammar.
 * - `phrasal-verbs`: phrasal verb choice is lexical, not a tense/discourse
 *   structure, so it doesn't correspond to any SpeechConstraintId shape.
 */
const DECK_CONSTRAINT_MAP: Array<{ fragment: string; constraintId: SpeechConstraintId }> = [
  { fragment: 'gerundios-infinitivos', constraintId: 'opinion_connector' },
  { fragment: 'presente-perfecto',   constraintId: 'present_perfect_experience' },
  { fragment: 'pasado-perfecto',     constraintId: 'past_simple_narrative' },
  { fragment: 'pasado-continuo',     constraintId: 'past_continuous_interrupted' },
  { fragment: 'experiencias-pasadas', constraintId: 'past_simple_narrative' },
  { fragment: 'habitos-pasados',     constraintId: 'past_simple_narrative' },
  { fragment: 'used-to',             constraintId: 'past_simple_narrative' },
  { fragment: 'segundo-condicional', constraintId: 'second_conditional' },
  { fragment: 'condicional',         constraintId: 'second_conditional' },
  { fragment: 'wish',                constraintId: 'second_conditional' },
  { fragment: 'comparativ',          constraintId: 'comparison' },
  { fragment: 'superlativ',          constraintId: 'comparison' },
  { fragment: 'will-going-to',       constraintId: 'future_plan' },
  { fragment: 'planes-futuros',      constraintId: 'future_plan' },
  { fragment: 'futuro',              constraintId: 'future_plan' },
  { fragment: 'conectores',          constraintId: 'opinion_connector' },
  { fragment: 'opiniones',           constraintId: 'opinion_connector' },
  { fragment: 'preguntas',           constraintId: 'question_form' },
  { fragment: 'negativas',           constraintId: 'negative_experience' },
  { fragment: 'obligacion',          constraintId: 'justify_decision' },
  { fragment: 'modales',             constraintId: 'justify_decision' },
  { fragment: 'cuantificadores',     constraintId: 'quantity_frequency' },
  { fragment: 'adverbios-frecuencia', constraintId: 'quantity_frequency' },
]

/**
 * The constraint a grammar deck should be practised with, or `null` if the
 * deck has no natural constraint. `null` means the caller should skip
 * constraint-based prompting for this deck — do not fall back to
 * unconstrained production, as that reopens the present-simple loophole
 * this module exists to close.
 */
export function constraintIdForDeck(deckSlug: string): SpeechConstraintId | null {
  const slug = deckSlug.toLowerCase()
  return DECK_CONSTRAINT_MAP.find((e) => slug.includes(e.fragment))?.constraintId ?? null
}
