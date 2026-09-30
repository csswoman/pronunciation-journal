// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/sync/sync-manager', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/sync/sync-manager')>(),
  flushOutbox: vi.fn().mockResolvedValue({ synced: 0, failed: 0, skipped: 0, operations: [] }),
}))

import { db } from '@/lib/db'
import { recordLessonQuizAttempt, type LessonQuizAnswerInput } from '@/lib/practice/queries'
import { buildGrammarDrill } from '@/lib/exercises/generators/grammar-drill'
import { fromGenericExercise } from '@/lib/practice/adapters'
import { buildExerciseResult } from '@/components/practice/session/session-state-helpers'
import { recordActivitySession } from '@/lib/progress/activity-hub'
import { buildSessionResult } from '@/lib/practice/session-result'
import { createEmptyState } from '@/lib/ai-practice/learning-state'
import { theoryTopicForDeck } from '@/lib/learning-loop/theory-targets'
import type { GrammarDrill } from '@/lib/courses/grammar-deck/drill-schema'

/**
 * Producer → real writers → outbox/Dexie. Only the network flush is replaced.
 * Plan 050 step 2: attribution comes from the canonical task/concept, never
 * from the response format.
 */
const USER = '00000000-0000-4000-8000-000000000050'
const DECK = 'a1-verbo-to-be'

it('persists the canonical deck concept independently of numeric course completion ids', async () => {
  await recordLessonQuizAttempt(USER, [quiz('numeric-id', {
    lessonSlug: '1', conceptSlug: DECK, taskSkill: 'listening',
  })], { attemptId: 'numeric-course-attempt' })
  const rows = await outbox('answer_history')
  expect(rows[0]?.payload.exercise_payload).toMatchObject({ lessonSlug: DECK, taskSkill: 'listening' })
})

async function outbox(table: string) {
  return (await db.syncOutbox.where('userId').equals(USER).toArray())
    .filter((entry) => entry.table === table)
}

function quiz(questionId: string, extra: Partial<LessonQuizAnswerInput> = {}): LessonQuizAnswerInput {
  return {
    attemptId: `quiz-attempt:${questionId}`,
    questionId,
    courseSlug: 'a1',
    lessonSlug: DECK,
    question: 'I ___ a student.',
    selectedAnswer: 'am',
    correctAnswer: 'am',
    isCorrect: true,
    timeMs: 900,
    topic: theoryTopicForDeck(DECK),
    ...extra,
  }
}

const drill: GrammarDrill = {
  level: 'A1',
  reviewed: true,
  transform: [
    { source: 'I am happy.', instruction: 'Usa contracción', accept: ["I'm happy."], contractions: 'require' },
  ],
  correct: [
    { sentence: 'I are from Mexico.', accept: ["{I am|I'm} from Mexico."], explanation: 'Con I se usa am.' },
  ],
}

beforeEach(async () => {
  window.localStorage.clear()
  db.close()
  await db.delete()
  await db.open()
  await db.learningState.put({
    userId: USER,
    state: createEmptyState(USER, 'test-device'),
    updatedAt: new Date(0).toISOString(),
  })
})

afterEach(() => db.close())

describe('course quiz task attribution', () => {
  it('does not infer grammar from the multiple_choice format when no task skill is authored', async () => {
    await recordLessonQuizAttempt(USER, [quiz('q1')], { attemptId: 'quiz-attempt' })

    const [answer] = await outbox('answer_history')
    expect(answer?.payload.exercise_payload).not.toHaveProperty('taskSkill')
    const [session] = await outbox('activity_sessions')
    expect(session?.payload.skill_tags).toEqual([])
  })

  it('persists an authored task skill and topic in the answer payload', async () => {
    await recordLessonQuizAttempt(
      USER,
      [quiz('q1', { taskSkill: 'listening' })],
      { attemptId: 'quiz-attempt' },
    )

    const [answer] = await outbox('answer_history')
    expect(answer?.payload.exercise_payload).toMatchObject({
      taskSkill: 'listening',
      topic: theoryTopicForDeck(DECK),
    })
    expect(answer?.payload.topic).toBe(theoryTopicForDeck(DECK))
    const [session] = await outbox('activity_sessions')
    // A listening MC must never be attributed to grammar.
    expect(session?.payload.skill_tags).toEqual(['listening'])
  })
})

describe('grammar-deck drill attribution', () => {
  function drillResults(isCorrect: boolean) {
    return buildGrammarDrill(DECK, drill)
      .map((generic) => fromGenericExercise(generic, 'courses'))
      .map((exercise, index) => buildExerciseResult({
        current: exercise,
        isCorrect,
        userAnswer: 'answer',
        timeMs: 1000,
        context: 'courses',
        attemptId: `drill-session:${index}`,
      }))
  }

  it('carries the canonical deck topic so the concept SRS receives evidence', () => {
    for (const result of drillResults(true)) {
      expect(result.topic).toBe(theoryTopicForDeck(DECK))
      expect(result.attribution?.srsEligible).toBe(true)
    }
  })

  it('records drill evidence under the deck concept, not the sourceRef id', async () => {
    await recordActivitySession(USER, {
      practiceContext: 'courses',
      sessionResult: buildSessionResult(drillResults(true), 'drill-session'),
      activitySessionId: 'drill-session',
    })

    await vi.waitFor(async () => {
      const concepts = (await db.learningState.get(USER))?.state.theory?.concepts ?? []
      expect(concepts.map((signal) => signal.lessonSlug)).toEqual([DECK])
    })
  })
})
