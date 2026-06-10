/**
 * Maps weak grammar topics (as reported by the AI Coach) to grammar-deck slugs.
 * Keys are lowercase keyword fragments matched with .includes().
 * Used by buildDailyPlan to target the sentence_builder step at the student's weakest area.
 */
export const TOPIC_DECK_MAP: Array<{ keyword: string; deckSlug: string }> = [
  { keyword: 'past simple',        deckSlug: 'past-simple-irregular' },
  { keyword: 'past perfect',       deckSlug: 'b2-pasado-perfecto-frases-adverbiales' },
  { keyword: 'future',             deckSlug: 'b2-futuro-perfecto-continuo' },
  { keyword: 'comparativ',         deckSlug: 'b1-comparativos-planes-futuros' },
  { keyword: 'article',            deckSlug: 'articles-a-an-the' },
  { keyword: 'pronoun',            deckSlug: 'a1-pronombres-objeto' },
  { keyword: 'determiner',         deckSlug: 'a2-determinantes' },
  { keyword: 'adjective',          deckSlug: 'a2-orden-adjetivos' },
  { keyword: 'verb',               deckSlug: 'a1-verbos-comunes' },
  { keyword: 'causative',          deckSlug: 'b2-causativo' },
  { keyword: 'connected speech',   deckSlug: 'cs-linking' },
  { keyword: 'reduction',          deckSlug: 'cs-reductions' },
  { keyword: 'interview',          deckSlug: 'biz-entrevistas-trabajo' },
  { keyword: 'finance',            deckSlug: 'b1-finanzas-personales' },
  { keyword: 'tech',               deckSlug: 'tech-ingles-programadores' },
  { keyword: 'ai',                 deckSlug: 'tech-ingles-inteligencia-artificial' },
  { keyword: 'code review',        deckSlug: 'biz-code-review' },
  { keyword: 'pull request',       deckSlug: 'biz-code-review' },
  { keyword: 'standup',            deckSlug: 'biz-code-review' },
  { keyword: 'hedging',            deckSlug: 'biz-code-review' },
]

/**
 * Given a list of weak topics, return the deck slug of the best match.
 * Returns null if no keyword matches any topic.
 */
export function deckSlugForWeakTopics(
  weakTopics: Array<{ topic: string; errorRate: number; sampleCount: number }>,
): string | null {
  // Only consider topics with enough data and meaningful error rate
  const eligible = weakTopics.filter((t) => t.errorRate > 0.4 && t.sampleCount >= 3)
  if (eligible.length === 0) return null

  // Sort by priority (highest errorRate first)
  const sorted = [...eligible].sort((a, b) => b.errorRate - a.errorRate)

  for (const { topic } of sorted) {
    const lower = topic.toLowerCase()
    const match = TOPIC_DECK_MAP.find((m) => lower.includes(m.keyword))
    if (match) return match.deckSlug
  }
  return null
}
