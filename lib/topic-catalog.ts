import { normalizeTopic } from '@/lib/practice/normalize-topic'

/**
 * The only topic keys that may reach topic_srs.
 *
 * Topic keys are deliberately namespaced. `grammar:articles` and
 * `vocab:articles` are different learning targets, even when their display
 * labels happen to be the same. Keep this list in sync with the database
 * check constraint in
 * `supabase/migrations/20260803053244_enforce_topic_srs_catalog.sql`.
 */
export const TOPIC_CATALOG = [
  { id: 'grammar:subject omission', label: 'Omisión del sujeto' },
  { id: 'grammar:articles', label: 'Artículos' },
  { id: 'grammar:present simple', label: 'Presente simple' },
  { id: 'grammar:past simple', label: 'Pasado simple' },
  { id: 'grammar:present continuous', label: 'Presente continuo' },
  { id: 'grammar:word order', label: 'Orden de las palabras' },
  { id: 'grammar:past continuous', label: 'Pasado continuo' },
  { id: 'grammar:present perfect', label: 'Presente perfecto' },
  { id: 'grammar:past perfect', label: 'Pasado perfecto' },
  { id: 'grammar:future simple', label: 'Futuro simple' },
  { id: 'grammar:going to', label: 'Futuro con “going to”' },
  { id: 'grammar:conditionals', label: 'Condicionales' },
  { id: 'grammar:prepositions', label: 'Preposiciones' },
  { id: 'grammar:modal verbs', label: 'Verbos modales' },
  { id: 'grammar:phrasal verbs', label: 'Phrasal verbs' },
  { id: 'grammar:comparatives', label: 'Comparativos' },
  { id: 'grammar:superlatives', label: 'Superlativos' },
  { id: 'grammar:questions', label: 'Preguntas' },
  { id: 'grammar:question words', label: 'Palabras interrogativas' },
  { id: 'grammar:pronouns', label: 'Pronombres' },
  { id: 'grammar:quantifiers', label: 'Cuantificadores' },
  { id: 'grammar:adjectives', label: 'Adjetivos' },
  { id: 'grammar:adverbs', label: 'Adverbios' },
  { id: 'grammar:passive', label: 'Voz pasiva' },
  { id: 'grammar:reported speech', label: 'Estilo indirecto' },
  { id: 'grammar:relative clauses', label: 'Oraciones de relativo' },
  { id: 'vocab:vocabulary', label: 'Vocabulario' },
] as const

export type TopicId = (typeof TOPIC_CATALOG)[number]['id']

export const TOPIC_IDS = new Set<string>(TOPIC_CATALOG.map(({ id }) => id))

/**
 * Compatibility aliases for labels already emitted by authored exercises or
 * older model prompts. They are accepted only at the boundary and are always
 * persisted as the single canonical ID on the right-hand side.
 */
const TOPIC_ALIASES: ReadonlyMap<string, TopicId> = new Map([
  ['grammar:present simple s', 'grammar:present simple'],
  ['grammar:adjective order', 'grammar:word order'],
  ['grammar:simple past tense', 'grammar:past simple'],
  ['grammar:past simple tense', 'grammar:past simple'],
])

/**
 * Normalize and validate a topic at the topic_srs write boundary.
 *
 * A namespace is mandatory. Unknown namespaces, unlisted IDs, and bare
 * labels are rejected instead of being guessed into the SRS table.
 */
export function canonicalTopic(raw: unknown): TopicId | null {
  if (typeof raw !== 'string') return null

  const normalized = normalizeTopic(raw)
  if (!normalized || !normalized.includes(':')) return null

  const canonical = TOPIC_ALIASES.get(normalized) ?? normalized
  return TOPIC_IDS.has(canonical) ? (canonical as TopicId) : null
}
