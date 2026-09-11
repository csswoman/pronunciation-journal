import type { ExerciseResult } from '@/lib/ai-practice/types'
import type { UserLearningState } from '@/lib/ai-practice/learning-state'
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

/** How many past sessions the coach keeps as "recently covered". */
const MAX_LAST_SESSIONS = 10

export type CoachSessionTopic = UserLearningState['lastSessions'][number]

/**
 * Collapses a session's exercises into one `lastSessions` entry per topic.
 *
 * Pure so the aggregation is testable without Dexie. Topics are kept in the
 * display form the coach reads back ("Present perfect"), not the normalized
 * SRS key, because these strings are matched loosely against lesson titles by
 * `grammarTopicsForLevel`.
 */
export function buildSessionTopics(
  exercises: readonly CoachSessionExercise[],
  endedAt: string,
): CoachSessionTopic[] {
  const byTopic = new Map<string, { completed: number; correct: number }>()

  for (const { result } of exercises) {
    const topic = result.topic?.trim()
    if (!topic) continue
    const entry = byTopic.get(topic) ?? { completed: 0, correct: 0 }
    entry.completed += 1
    if (result.correct) entry.correct += 1
    byTopic.set(topic, entry)
  }

  return [...byTopic.entries()].map(([topic, { completed, correct }]) => ({
    topic,
    endedAt,
    exercisesCompleted: completed,
    correctRate: completed > 0 ? correct / completed : 0,
  }))
}

/**
 * Writes what this session covered into `lastSessions`, which is what makes
 * "enséñame algo nuevo" stop proposing the same topic every time — the
 * starter feeds these strings to the model as `avoidTopics`.
 *
 * Best-effort: a failure here must never lose the session's practice answers,
 * which were already persisted by the caller.
 */
async function recordSessionTopics(
  userId: string,
  exercises: readonly CoachSessionExercise[],
  endedAt: string,
): Promise<void> {
  const sessions = buildSessionTopics(exercises, endedAt)
  if (sessions.length === 0) return

  const { db } = await import('@/lib/db')
  const { getUserLearningState } = await import('@/lib/ai-practice/load-state')
  const { persistLearningState } = await import('@/lib/ai-practice/queries')

  const local = await db.learningState.get(userId)
  const base = local?.state ?? (await getUserLearningState(userId))

  await persistLearningState(userId, {
    ...base,
    userId,
    updatedAt: endedAt,
    lastSessions: [...sessions, ...base.lastSessions].slice(0, MAX_LAST_SESSIONS),
  })
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

  // Closes the loop back to the coach's own starters. Best-effort: the
  // practice answers above are already durable, so a write failure here costs
  // topic variety, never data.
  await recordSessionTopics(userId, exercises, completedAt.toISOString()).catch((err) => {
    console.error('[AI Coach] lastSessions update failed', err)
  })
}
