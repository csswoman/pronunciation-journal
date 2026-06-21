import type { ExerciseResult } from '@/lib/ai-practice/types'
import { normalizeTopic } from '@/lib/practice/normalize-topic'
import { savePracticeAnswer } from '@/lib/practice/queries'
import { EXERCISE_TYPE_IDS, type ExerciseSlug, type PracticeAnswer } from '@/lib/practice/types'
import { buildSessionResult } from '@/lib/practice/session-result'
import { recordActivitySession } from '@/lib/progress/activity-hub'

const TOOL_SLUG_MAP: Record<string, ExerciseSlug> = {
  render_fill_blank: 'fill_blank',
  render_multiple_choice: 'multiple_choice',
  render_speaking: 'speak_word',
}

export function buildCoachPracticeAnswer(
  toolName: string,
  result: ExerciseResult,
): PracticeAnswer | null {
  const slug = TOOL_SLUG_MAP[toolName]
  if (!slug) return null

  const exerciseTypeId = EXERCISE_TYPE_IDS[slug]
  if (exerciseTypeId === null) return null

  const topicKey = normalizeTopic(result.topic) ?? result.topic.trim()
  const contentId = `ai_coach:${topicKey}`

  return {
    exerciseId: contentId,
    slug,
    exerciseTypeId,
    isCorrect: result.correct,
    topic: result.topic,
    context: 'ai_coach',
    contentId,
    timeMs: result.latencyMs ?? 0,
    score: result.score !== undefined ? Math.round(result.score * 100) : undefined,
    exercisePayload: result.ipa ? { targetWord: result.topic, ipa: result.ipa } : undefined,
  }
}

export async function persistCoachExerciseResult(
  userId: string,
  toolName: string,
  result: ExerciseResult,
): Promise<void> {
  const answer = buildCoachPracticeAnswer(toolName, result)
  if (!answer) return
  await savePracticeAnswer(userId, answer)
}

export type CoachSessionExercise = {
  toolName: string
  result: ExerciseResult
}

/** Records one coherent AI Coach session after its widgets were persisted individually. */
export async function recordCoachSession(
  userId: string,
  exercises: CoachSessionExercise[],
): Promise<void> {
  const completedAt = new Date()
  const answers = exercises.flatMap(({ toolName, result }) => {
    const answer = buildCoachPracticeAnswer(toolName, result)
    return answer ? [{ ...answer, completedAt }] : []
  })
  if (answers.length === 0) return

  await recordActivitySession(userId, {
    practiceContext: 'ai_coach',
    sessionResult: buildSessionResult(answers),
    metadata: {
      coachTool: [...new Set(exercises.map((exercise) => exercise.toolName))].join(','),
    },
  })
}
