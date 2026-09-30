// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/sync/sync-manager', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/sync/sync-manager')>(),
  flushOutbox: vi.fn().mockResolvedValue({ synced: 0, failed: 0, skipped: 0, operations: [] }),
}))

import { db } from '@/lib/db'
import { recordActivitySession } from '@/lib/progress/activity-hub'
import { buildSessionResult } from '@/lib/practice/session-result'
import { createEmptyState } from '@/lib/ai-practice/learning-state'
import type { ConceptSignal } from '@/lib/courses/concept-profile'
import { mergeConceptSignals } from '@/lib/courses/assessment-profile'
import {
  CONCEPT_EVIDENCE_WINDOW,
  mergeConceptEvidence,
  summarizeConceptEvidence,
} from '@/lib/progress/concept-evidence'
import type { ExerciseResult } from '@/lib/practice/types'

/**
 * Plan 050 step 3: concept signals accumulate unique attempts per content
 * over time. One session — let alone one answer — is not proof of mastery.
 */
const USER = '00000000-0000-4000-8000-000000000051'

function answer(
  lessonSlug: string,
  contentId: string,
  isCorrect: boolean,
  attemptId = `${lessonSlug}:${contentId}:${isCorrect}`,
): ExerciseResult {
  return {
    attemptId,
    exerciseId: contentId,
    slug: 'multiple_choice',
    exerciseTypeId: 17,
    isCorrect,
    timeMs: 900,
    status: 'answered',
    contentId,
    context: 'courses',
    exercisePayload: { lessonSlug },
    completedAt: new Date('2026-09-27T12:00:00Z'),
  }
}

async function record(sessionId: string, results: ExerciseResult[]) {
  await recordActivitySession(USER, {
    practiceContext: 'courses',
    sessionResult: buildSessionResult(results, sessionId),
    activitySessionId: sessionId,
  })
}

async function concept(lessonSlug: string): Promise<ConceptSignal | undefined> {
  const concepts = (await db.learningState.get(USER))?.state.theory?.concepts ?? []
  return concepts.find((signal) => signal.lessonSlug === lessonSlug)
}

async function settled(lessonSlug: string, total: number): Promise<ConceptSignal> {
  let found: ConceptSignal | undefined
  await vi.waitFor(async () => {
    found = await concept(lessonSlug)
    expect(found?.total).toBe(total)
  })
  return found!
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

describe('concept evidence accumulation', () => {
  it('does not turn 1/1 into mastery', async () => {
    await record('s1', [answer('present-simple', 'q1', true)])

    const signal = await settled('present-simple', 1)
    expect(signal.correct).toBe(1)
    expect(signal.status).not.toBe('mastered')
  })

  it('accumulates distinct contents across sessions instead of replacing the signal', async () => {
    await record('s1', [
      answer('present-simple', 'q1', true),
      answer('present-simple', 'q2', true),
      answer('present-simple', 'q3', true),
    ])
    await settled('present-simple', 3)
    await record('s2', [
      answer('present-simple', 'q4', true),
      answer('present-simple', 'q5', true),
    ])

    const signal = await settled('present-simple', 5)
    expect(signal.correct).toBe(5)
    expect(signal.status).toBe('mastered')
  })

  it('does not double count a retried session', async () => {
    const results = [answer('present-simple', 'q1', true), answer('present-simple', 'q2', false)]
    await record('s1', results)
    await settled('present-simple', 2)
    await record('s1', results)
    await new Promise((resolve) => setTimeout(resolve, 50))

    const signal = await settled('present-simple', 2)
    expect(signal.correct).toBe(1)
  })

  it('returns to review when the latest answer lowers accuracy below 80 percent', async () => {
    await record('s1', Array.from({ length: 5 }, (_, index) =>
      answer('present-simple', `q${index}`, index < 4)))
    expect((await settled('present-simple', 5)).status).toBe('mastered')

    const laterMiss = answer('present-simple', 'q0', false, 's2:q0')
    laterMiss.completedAt = new Date('2026-09-27T13:00:00Z')
    await record('s2', [laterMiss])

    await vi.waitFor(async () => {
      const signal = await concept('present-simple')
      expect(signal).toMatchObject({ correct: 3, total: 5, status: 'review' })
      expect(signal?.evidence).toHaveLength(6)
    })
  })

  it('counts repeating the same content as one piece of evidence', async () => {
    await record('s1', Array.from({ length: 5 }, (_, index) =>
      answer('present-simple', 'q1', true, `s1:${index}`)))

    const signal = await settled('present-simple', 1)
    expect(signal.status).not.toBe('mastered')
  })

  it('keeps distinct concepts apart', async () => {
    await record('s1', [
      answer('present-simple', 'q1', true),
      answer('past-simple', 'q1', false),
    ])

    expect((await settled('present-simple', 1)).correct).toBe(1)
    expect((await settled('past-simple', 1)).correct).toBe(0)
  })
})

describe('concept evidence contract (pure)', () => {
  const item = (attemptId: string, contentId: string, correct: boolean, at: string) =>
    ({ attemptId, contentId, correct, at })

  it('uses the latest answer per content and ignores replays of the same attempt', () => {
    const merged = mergeConceptEvidence(
      [item('a1', 'q1', false, '2026-09-27T10:00:00Z')],
      [item('a1', 'q1', true, '2026-09-27T10:00:00Z'), item('a2', 'q1', true, '2026-09-27T11:00:00Z')],
    )
    expect(merged.map((entry) => entry.attemptId)).toEqual(['a1', 'a2'])
    expect(summarizeConceptEvidence(merged)).toEqual({ correct: 1, total: 1, status: 'review' })
  })

  it('converges regardless of arrival order (offline replays)', () => {
    const a = [item('a1', 'q1', true, '2026-09-27T10:00:00Z')]
    const b = [item('a2', 'q2', false, '2026-09-26T10:00:00Z')]
    expect(mergeConceptEvidence(a, b)).toEqual(mergeConceptEvidence(b, a))
  })

  it('keeps only the most recent evidence window', () => {
    const many = Array.from({ length: CONCEPT_EVIDENCE_WINDOW + 5 }, (_, index) =>
      item(`a${index}`, `q${index}`, true, new Date(Date.UTC(2026, 8, 1, 0, index)).toISOString()))
    const merged = mergeConceptEvidence([], many)
    expect(merged).toHaveLength(CONCEPT_EVIDENCE_WINDOW)
    expect(merged[0]?.attemptId).toBe('a5')
  })

  it.each([
    { correct: 4, total: 4, status: 'review' },
    { correct: 4, total: 5, status: 'mastered' },
    { correct: 3, total: 5, status: 'review' },
    { correct: 7, total: 9, status: 'review' },
  ])('applies the approved criterion: $correct/$total is $status', ({ correct, total, status }) => {
    const evidence = Array.from({ length: total }, (_, index) =>
      item(`a${index}`, `q${index}`, index < correct, '2026-09-27T10:00:00Z'))
    expect(summarizeConceptEvidence(evidence)).toEqual({ correct, total, status })
  })

  it('carries exercise evidence through a later manual claim', () => {
    const base = { level: 'a1' as const, title: 'Present simple', assessedAt: '2026-09-27T10:00:00Z' }
    const exercise: ConceptSignal = {
      ...base, lessonSlug: 'present-simple', selfRating: 'familiar', status: 'review', correct: 1, total: 1,
      source: 'exercise', evidence: [item('a1', 'q1', true, '2026-09-27T10:00:00Z')],
    }
    const manual: ConceptSignal = {
      ...base, lessonSlug: 'present-simple', selfRating: 'unknown', status: 'review', correct: 0, total: 0,
      source: 'manual', assessedAt: '2026-09-27T11:00:00Z',
    }
    const [merged] = mergeConceptSignals([exercise], [manual])
    expect(merged?.source).toBe('manual')
    expect(merged?.evidence).toEqual(exercise.evidence)
  })
})
