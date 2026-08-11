import type { GrammarStudyDeckData } from '@/lib/courses/grammar-deck/types'
import { generateErrorCorrectionFromDeck, normalizeReviewTopic } from '@/lib/exercises/generators/error-correction'
import { fromGenericExercise } from '@/lib/practice/adapters'
import type { DailyStep } from '@/lib/practice/types'

export function buildTopicReviewStep(topic: string, deckSlug: string, deck: GrammarStudyDeckData): DailyStep | null {
  const errorCorrection = generateErrorCorrectionFromDeck(deckSlug, topic, deck, 1)
  const quiz = deck.quiz?.slice(0, 3 - errorCorrection.length) ?? []
  if (quiz.length === 0 && errorCorrection.length === 0) return null
  const sourceRef = { source: 'text_fragments' as const, id: `grammar-deck:${deckSlug}` }
  const multipleChoice = quiz.map((question, index) => fromGenericExercise({
    id: `topic-review:${deckSlug}:${index}`,
    type: 'multiple_choice' as const,
    sourceRef,
    topic: normalizeReviewTopic(topic),
    question: question.q,
    options: question.options,
    answerIndex: question.answer,
    explanation: question.explain,
  }, 'review'))
  const exercises = [
    ...errorCorrection.map((exercise) => fromGenericExercise(exercise, 'review')),
    ...multipleChoice,
  ]
  return { id: `review_topic:${deckSlug}`, kind: 'concept', title: deck.meta.title, subtitle: topic, icon: 'book-open', exercises, estMinutes: 3 }
}
