import type { MultipleChoiceExercise } from '@/lib/exercises/types'
import { exerciseId } from '@/lib/exercises/utils'
import type { FalseFriend, FalseFriendPrompt } from '@/lib/false-friends/types'

/**
 * Turns false-friend pairs into contextual multiple-choice exercises.
 *
 * Each prompt is already authored as a gapped sentence plus options, so this
 * only maps to the generic exercise shape. Options are NOT shuffled: the
 * authored order is validated (`answer` indexes into it) and shuffling here
 * would break the deterministic id that dedupe and answer_history rely on.
 */

const GAP_TOKEN = '___'

/** `topic` drives topic-level SRS; namespaced so it never collides with grammar. */
function topicFor(entry: FalseFriend): string {
  return `false_friend:${entry.id}`
}

function toExercise(entry: FalseFriend, prompt: FalseFriendPrompt, index: number): MultipleChoiceExercise {
  return {
    id: exerciseId('multiple_choice', `ff:${entry.id}`, String(index)),
    type: 'multiple_choice',
    sourceRef: { source: 'false_friends', id: entry.id },
    level: entry.cefr_level,
    topic: topicFor(entry),
    question: prompt.sentence,
    options: [...prompt.options],
    answerIndex: prompt.answer,
    explanation: prompt.explain,
  }
}

/**
 * One exercise per entry, rotating which prompt is used so a learner meeting
 * the same pair on a later day gets the other direction of the confusion
 * (trap-is-wrong vs. trap-is-right) instead of memorizing one sentence.
 */
export function generateFalseFriendExercises(
  entries: FalseFriend[],
  limit: number,
  day = 0,
): MultipleChoiceExercise[] {
  const exercises: MultipleChoiceExercise[] = []

  for (const entry of entries) {
    if (exercises.length >= limit) break
    if (entry.prompts.length === 0) continue

    const index = day % entry.prompts.length
    exercises.push(toExercise(entry, entry.prompts[index], index))
  }

  return exercises
}

/** True when the sentence still carries its gap — guards authored regressions. */
export function hasGap(sentence: string): boolean {
  return sentence.includes(GAP_TOKEN)
}
