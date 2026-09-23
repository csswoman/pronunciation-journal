import { buildTopicReviewStep } from '@/lib/review/topic-review-step'
import { deckSlugForTopic } from '@/lib/practice/topic-decks'
import { GrammarStudyDeckSchema } from '@/lib/courses/grammar-deck/schema'
import type { GrammarStudyDeckData } from '@/lib/courses/grammar-deck/types'
import type { PronunciationTargetId } from '@/lib/pronunciation/targets/types'
import type { DailyStep } from '@/lib/practice/types'
import type { DueTopic } from './fetchers'

async function loadDeckForTopic(slug: string): Promise<GrammarStudyDeckData | null> {
  try {
    const res = await fetch(`/grammar-decks/${slug}.json`)
    if (!res.ok) return null
    const data: unknown = await res.json()
    const result = GrammarStudyDeckSchema.safeParse(data)
    if (!result.success) return null
    return {
      meta: result.data.meta ?? { eyebrow: 'Mazo de estudio · sin voltear', title: 'Gramática' },
      sounds: result.data.sounds,
      pronunciationTargetIds: (result.data.pronunciationTargetIds ?? []) as PronunciationTargetId[],
      related: result.data.related,
      quiz: result.data.quiz,
      cards: result.data.cards.map((card, i) => ({ ...card, index: i + 1 })),
    }
  } catch {
    return null
  }
}

/**
 * Overdue grammar topics (topic_srs) mapped to concrete review steps, each
 * already carrying its own `selection` (reason: 'due', source: 'topic_srs')
 * from buildTopicReviewStep. Topics with no matching deck are dropped.
 */
export async function buildDueTopicSteps(dueTopics: DueTopic[], limit = 2): Promise<DailyStep[]> {
  const steps: DailyStep[] = []
  for (const due of dueTopics.slice(0, limit)) {
    const slug = deckSlugForTopic(due.topic)
    if (!slug) continue
    const deck = await loadDeckForTopic(slug)
    if (!deck) continue
    const step = buildTopicReviewStep(due.topic, slug, deck)
    if (step) steps.push(step)
  }
  return steps
}

