import { deckSlugForTopic } from '@/lib/practice/topic-decks'
import type { TopicProgressRow } from './domain-queries'

export type CurriculumTopicStatus = 'mastered' | 'review' | 'pending'

/** Classify topic_srs entries into learning vs mastered based on SRS evidence. */
export function classifyTopicProgress(topics: readonly TopicProgressRow[]): {
  learningTopics: TopicProgressRow[]
  masteredTopics: TopicProgressRow[]
} {
  const masteredTopics = topics.filter(
    (t) =>
      t.srsStatus === 'mastered' ||
      ((t.repetitions ?? 0) >= 3 && (t.intervalDays ?? 0) >= 7),
  )

  const learningTopics = topics.filter(
    (t) =>
      !masteredTopics.includes(t) &&
      (t.srsStatus === 'learning' || t.srsStatus === 'review' || (t.repetitions ?? 0) > 0),
  )

  return { learningTopics, masteredTopics }
}

/**
 * Maps canonical topic_srs rows onto authored grammar-deck slugs.
 * Route completion is intentionally excluded: finishing content is coverage,
 * not evidence that the underlying concept was retained.
 */
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

  const result = new Map<string, CurriculumTopicStatus>()

  for (const [deckSlug, rows] of grouped) {
    const allMastered = rows.every(
      (row) =>
        row.srsStatus === 'mastered' ||
        ((row.repetitions ?? 0) >= 3 && (row.intervalDays ?? 0) >= 7),
    )
    result.set(deckSlug, allMastered ? 'mastered' : 'review')
  }

  return result
}
