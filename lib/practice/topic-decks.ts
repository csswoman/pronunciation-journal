/**
 * Maps weak grammar topics (as reported by the AI Coach and by exercise
 * results) to grammar-deck slugs under public/grammar-decks/.
 * Keys are lowercase keyword fragments matched with .includes().
 *
 * Ordering matters: more specific keywords must come before the generic ones
 * they contain ("present perfect continuous" before "present perfect", and
 * both before "perfect"), because the first match wins.
 */
export const TOPIC_DECK_MAP: Array<{ keyword: string; deckSlug: string }> = [
  // ── Tenses ────────────────────────────────────────────────────────────────
  { keyword: 'present perfect continuous', deckSlug: 'b1-presente-perfecto-continuo' },
  { keyword: 'present perfect',    deckSlug: 'a2-presente-perfecto-experiencias' },
  { keyword: 'presente perfecto',  deckSlug: 'a2-presente-perfecto-experiencias' },
  { keyword: 'past perfect',       deckSlug: 'b1-pasado-perfecto' },
  { keyword: 'past continuous',    deckSlug: 'a2-pasado-continuo' },
  { keyword: 'past simple',        deckSlug: 'a2-experiencias-pasadas-planes' },
  { keyword: 'pasado',             deckSlug: 'a2-experiencias-pasadas-planes' },
  { keyword: 'used to',            deckSlug: 'a2-used-to' },
  { keyword: 'past habit',         deckSlug: 'b1-habitos-pasados' },
  { keyword: 'future',             deckSlug: 'a2-will-going-to' },
  { keyword: 'futuro',             deckSlug: 'a2-will-going-to' },
  { keyword: 'going to',           deckSlug: 'a2-will-going-to' },

  // ── Conditionals & hypotheticals ──────────────────────────────────────────
  { keyword: 'second conditional', deckSlug: 'b1-segundo-condicional' },
  { keyword: 'zero conditional',   deckSlug: 'b1-condicional-cero' },
  { keyword: 'first conditional',  deckSlug: 'b1-primer-condicional-pasado-continuo' },
  { keyword: 'conditional',        deckSlug: 'b1-segundo-condicional' },
  { keyword: 'condicional',        deckSlug: 'b1-segundo-condicional' },
  { keyword: 'wish',               deckSlug: 'b1-wish-presente' },

  // ── Modality, voice, non-finite ───────────────────────────────────────────
  { keyword: 'modal',              deckSlug: 'b1-modales-deduccion' },
  { keyword: 'obligation',         deckSlug: 'a2-obligacion-prohibicion' },
  { keyword: 'passive',            deckSlug: 'b1-voz-pasiva-consejos' },
  { keyword: 'pasiva',             deckSlug: 'b1-voz-pasiva-consejos' },
  { keyword: 'gerund',             deckSlug: 'b1-gerundios-infinitivos' },
  { keyword: 'infinitive',         deckSlug: 'b1-gerundios-infinitivos' },
  { keyword: 'reported speech',    deckSlug: 'b1-estilo-indirecto' },
  { keyword: 'estilo indirecto',   deckSlug: 'b1-estilo-indirecto' },

  // ── Discourse & structure ─────────────────────────────────────────────────
  { keyword: 'relative clause',    deckSlug: 'b1-pronombres-clausulas-relativas' },
  { keyword: 'connector',          deckSlug: 'b1-conectores-discurso' },
  { keyword: 'conector',           deckSlug: 'b1-conectores-discurso' },
  { keyword: 'phrasal verb',       deckSlug: 'b1-phrasal-verbs-tipos' },
  { keyword: 'comparativ',         deckSlug: 'b1-comparativos-planes-futuros' },
  { keyword: 'question',           deckSlug: 'a1-preguntas-do-does' },
  { keyword: 'negative',           deckSlug: 'b1-preguntas-negativas-recomendaciones' },

  // ── Collocations & Light Verbs ────────────────────────────────────────────
  { keyword: 'light verb',         deckSlug: 'chunk-the-9-verbs-strategy' },
  { keyword: '9-verb',             deckSlug: 'chunk-the-9-verbs-strategy' },
  { keyword: '9 verb',             deckSlug: 'chunk-the-9-verbs-strategy' },
  { keyword: 'delexical',          deckSlug: 'c1-verbos-delexicales' },
  { keyword: 'get collocation',    deckSlug: 'chunk-light-verbs-get-set-put-go' },
  { keyword: 'set collocation',    deckSlug: 'chunk-light-verbs-get-set-put-go' },
  { keyword: 'put collocation',    deckSlug: 'chunk-light-verbs-get-set-put-go' },
  { keyword: 'collocation',        deckSlug: 'chunk-collocations' },
  { keyword: 'colocaci',           deckSlug: 'chunk-collocations' },

  // ── Word classes ──────────────────────────────────────────────────────────
  { keyword: 'article',            deckSlug: 'a1-articulos-basicos' },
  { keyword: 'pronoun',            deckSlug: 'a1-pronombres-objeto' },
  { keyword: 'determiner',         deckSlug: 'a2-determinantes' },
  { keyword: 'adjective',          deckSlug: 'a2-orden-adjetivos' },
  { keyword: 'preposition',        deckSlug: 'b1-preposiciones-dependientes' },
  { keyword: 'quantifier',         deckSlug: 'b1-cuantificadores' },
  { keyword: 'verb',               deckSlug: 'a1-verbos-comunes' },

  // ── Pronunciation & domain ────────────────────────────────────────────────
  { keyword: 'causative',          deckSlug: 'b2-causativo' },
  { keyword: 'connected speech',   deckSlug: 'cs-linking' },
  { keyword: 'reduction',          deckSlug: 'cs-reductions' },
  { keyword: 'interview',          deckSlug: 'biz-entrevistas-trabajo' },
  { keyword: 'finance',            deckSlug: 'b1-finanzas-personales' },
  { keyword: 'tech',               deckSlug: 'tech-ingles-programadores' },
  { keyword: 'artificial intelligence', deckSlug: 'tech-ingles-inteligencia-artificial' },
  { keyword: 'code review',        deckSlug: 'biz-code-review' },
  { keyword: 'pull request',       deckSlug: 'biz-code-review' },
  { keyword: 'standup',            deckSlug: 'biz-code-review' },
  { keyword: 'hedging',            deckSlug: 'biz-code-review' },
]

/**
 * Weakness thresholds.
 *
 * Previously 0.4 / 3: a topic had to be failed almost half the time, three
 * times over, before it could ever be targeted — so in practice the grammar
 * targeting almost never fired. Lowered so two attempts with one mistake is
 * enough evidence to schedule practice.
 */
export const WEAK_TOPIC_MIN_ERROR_RATE = 0.2
export const WEAK_TOPIC_MIN_SAMPLES = 2

export function deckSlugForTopic(topic: string): string | null {
  const normalized = topic.toLowerCase()
  return TOPIC_DECK_MAP.find((entry) => normalized.includes(entry.keyword))?.deckSlug ?? null
}

export interface WeakTopicLike {
  topic: string
  errorRate: number
  sampleCount: number
}

/** Weak topics that clear the evidence thresholds, worst first. */
export function eligibleWeakTopics(weakTopics: readonly WeakTopicLike[]): WeakTopicLike[] {
  return weakTopics
    .filter(
      (t) => t.errorRate >= WEAK_TOPIC_MIN_ERROR_RATE && t.sampleCount >= WEAK_TOPIC_MIN_SAMPLES,
    )
    .sort((a, b) => b.errorRate - a.errorRate)
}

/**
 * Given a list of weak topics, return the deck slug of the best match.
 * Returns null if no keyword matches any topic.
 */
export function deckSlugForWeakTopics(weakTopics: readonly WeakTopicLike[]): string | null {
  for (const { topic } of eligibleWeakTopics(weakTopics)) {
    const slug = deckSlugForTopic(topic)
    if (slug) return slug
  }
  return null
}
