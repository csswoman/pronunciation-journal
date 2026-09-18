import { deckSlugForTopic } from '@/lib/practice/topic-decks'
import type { TopicProgressRow } from './domain-queries'

export type CurriculumTopicStatus = 'mastered' | 'review' | 'pending'

/** Maps canonical topic_srs rows onto authored grammar-deck slugs. */
export function buildTopicStatusByDeck(
  topics: readonly TopicProgressRow[],
): Map<string, CurriculumTopicStatus> {
  const grouped = new Map<string, TopicProgressRow[]>()

  for (const topic of topics) {
    const deckSlug = deckSlugForTopic(topic.topic)
    if (!deckSlug) continue
    const rows = grouped.get(deckSlug) ?? []
    rows.push(topic)
    grouped.set(deckSlug, rows)
  }

  return new Map(
    [...grouped].map(([deckSlug, rows]) => [
      deckSlug,
      rows.every((row) => row.srsStatus === 'mastered') ? 'mastered' : 'review',
    ]),
  )
}
