import type { GrammarStudyDeckData } from '@/lib/courses/grammar-deck/types'
import { fromGenericExercise } from '@/lib/practice/adapters'
import type { DailyStep } from '@/lib/practice/types'

function normalizedTopic(topic: string) {
  return topic.startsWith('grammar:') ? topic : `grammar:${topic.trim().toLowerCase().replace(/\s+/g, '_')}`
}

export function buildTopicReviewStep(topic: string, deckSlug: string, deck: GrammarStudyDeckData): DailyStep | null {
  const quiz = deck.quiz?.slice(0, 3) ?? []
  if (quiz.length === 0) return null
  const sourceRef = { source: 'text_fragments' as const, id: `grammar-deck:${deckSlug}` }
  const exercises = quiz.map((question, index) => fromGenericExercise({
    id: `topic-review:${deckSlug}:${index}`,
    type: 'multiple_choice' as const,
    sourceRef,
    topic: normalizedTopic(topic),
    question: question.q,
    options: question.options,
    answerIndex: question.answer,
    explanation: question.explain,
  }, 'review'))
  return { id: `review_topic:${deckSlug}`, kind: 'concept', title: deck.meta.title, subtitle: topic, icon: 'book-open', exercises, estMinutes: 3 }
}
