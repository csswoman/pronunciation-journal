import { buildTopicReviewStep } from '@/lib/review/topic-review-step'
import { deckSlugForTopic } from '@/lib/practice/topic-decks'
import { getDeckBySlug } from '@/lib/courses/grammar-deck/decks'
import type { DailyStep } from '@/lib/practice/types'
import type { DueTopic } from './fetchers'

/**
 * Overdue grammar topics (topic_srs) mapped to concrete review steps, each
 * already carrying its own `selection` (reason: 'due', source: 'topic_srs')
 * from buildTopicReviewStep. Topics with no matching deck are dropped.
 */
export function buildDueTopicSteps(dueTopics: DueTopic[], limit = 2): DailyStep[] {
  return dueTopics.slice(0, limit).flatMap((due) => {
    const slug = deckSlugForTopic(due.topic)
    const deck = slug ? getDeckBySlug(slug) : null
    if (!slug || !deck) return []
    const step = buildTopicReviewStep(due.topic, slug, deck)
    return step ? [step] : []
  })
}
