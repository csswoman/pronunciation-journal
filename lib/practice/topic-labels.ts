import { normalizeTopic } from '@/lib/practice/normalize-topic'

/**
 * Human-facing display labels for grammar/vocab topics. Keys are the
 * normalized topic body (no domain prefix) as produced by `normalizeTopic`.
 * Maps the technical concept label that drives topic SRS
 * (e.g. `grammar:present_simple`) to learner-readable Spanish
 * (e.g. "Presente simple") so the session can narrate what each step trains.
 *
 * Unknown topics fall back to a title-cased version of the body, so the UI
 * degrades gracefully instead of leaking raw slugs.
 */
const TOPIC_LABELS: Record<string, string> = {
  'present simple': 'Presente simple',
  'present continuous': 'Presente continuo',
  'past simple': 'Pasado simple',
  'past continuous': 'Pasado continuo',
  'present perfect': 'Presente perfecto',
  'past perfect': 'Pasado perfecto',
  'future simple': 'Futuro simple',
  'going to': 'Futuro con "going to"',
  conditionals: 'Condicionales',
  articles: 'Artículos',
  prepositions: 'Preposiciones',
  'modal verbs': 'Verbos modales',
  'phrasal verbs': 'Phrasal verbs',
  comparatives: 'Comparativos',
  superlatives: 'Superlativos',
  questions: 'Preguntas',
  'question words': 'Palabras interrogativas',
  pronouns: 'Pronombres',
  quantifiers: 'Cuantificadores',
  adjectives: 'Adjetivos',
  adverbs: 'Adverbios',
  'word order': 'Orden de las palabras',
  passive: 'Voz pasiva',
  'reported speech': 'Estilo indirecto',
  'relative clauses': 'Oraciones de relativo',
  vocabulary: 'Vocabulario',
}

/** Honest topic for single-item lexical (word_bank) exercises. */
export const VOCABULARY_TOPIC = 'vocab:vocabulary'

/** Strip a leading `domain:` prefix from a normalized topic. */
function stripDomain(normalized: string): string {
  const colon = normalized.indexOf(':')
  return colon >= 0 ? normalized.slice(colon + 1) : normalized
}

/** Capitalize the first letter, leave the rest as-is. */
function titleCase(body: string): string {
  return body.charAt(0).toUpperCase() + body.slice(1)
}

/**
 * Turn a raw topic string into a learner-readable display label, or null when
 * there is nothing meaningful to show. Known topics use the curated dictionary;
 * unknown ones are title-cased with the domain prefix removed.
 */
export function topicDisplayLabel(raw: string | undefined | null): string | null {
  if (!raw) return null
  const normalized = normalizeTopic(raw)
  if (normalized === null) return null

  const body = stripDomain(normalized)
  return TOPIC_LABELS[body] ?? titleCase(body)
}
