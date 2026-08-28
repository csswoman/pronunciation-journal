import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ConceptSignal } from '@/lib/courses/concept-profile'

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  getUserLearningState: vi.fn(),
  persistLearningState: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  db: { learningState: { get: mocks.get } },
}))
vi.mock('@/lib/ai-practice/load-state', () => ({
  getUserLearningState: mocks.getUserLearningState,
}))
vi.mock('@/lib/ai-practice/queries', () => ({
  persistLearningState: mocks.persistLearningState,
}))

import { mergeConceptSignals, persistAssessmentConceptProfile, updateConceptSignalsWithEvidence } from '../assessment-profile'
import { createEmptyState } from '@/lib/ai-practice/learning-state'

function concept(lessonSlug: string, assessedAt: string, status: ConceptSignal['status']): ConceptSignal {
  return {
    lessonSlug,
    level: 'a1',
    title: lessonSlug,
    selfRating: 'familiar',
    status,
    correct: 1,
    total: 1,
    assessedAt,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('assessment concept profile', () => {
  it('merges by lesson slug and keeps the newest assessment', () => {
    const result = mergeConceptSignals(
      [concept('be', '2026-07-18T12:00:00.000Z', 'review')],
      [
        concept('be', '2026-07-18T11:00:00.000Z', 'learn'),
        concept('articles', '2026-07-18T13:00:00.000Z', 'mastered'),
      ],
    )

    expect(result).toEqual([
      concept('articles', '2026-07-18T13:00:00.000Z', 'mastered'),
      concept('be', '2026-07-18T12:00:00.000Z', 'review'),
    ])
  })

  it('preserves manual signal over an assessment that has no real question evidence', () => {
    const manualSignal: ConceptSignal = {
      lessonSlug: 'conditionals',
      level: 'b1',
      title: 'Conditionals',
      selfRating: 'unknown',
      status: 'review',
      correct: 0,
      total: 0,
      assessedAt: '2026-08-20T10:00:00.000Z',
      source: 'manual',
    }
    const assessmentSignalWithoutQuestions: ConceptSignal = {
      lessonSlug: 'conditionals',
      level: 'b1',
      title: 'Conditionals',
      selfRating: 'confident',
      status: 'mastered',
      correct: 0,
      total: 0,
      assessedAt: '2026-08-20T12:00:00.000Z',
      source: 'assessment',
    }

    const merged = mergeConceptSignals([manualSignal], [assessmentSignalWithoutQuestions])
    expect(merged[0].status).toBe('review')
    expect(merged[0].source).toBe('manual')
  })

  it('lets real quiz evidence override a manual signal', () => {
    const manualSignal: ConceptSignal = {
      lessonSlug: 'conditionals',
      level: 'b1',
      title: 'Conditionals',
      selfRating: 'unknown',
      status: 'review',
      correct: 0,
      total: 0,
      assessedAt: '2026-08-20T10:00:00.000Z',
      source: 'manual',
    }
    const quizEvidenceSignal: ConceptSignal = {
      lessonSlug: 'conditionals',
      level: 'b1',
      title: 'Conditionals',
      selfRating: 'confident',
      status: 'mastered',
      correct: 3,
      total: 3,
      assessedAt: '2026-08-20T12:00:00.000Z',
      source: 'assessment',
    }

    const merged = mergeConceptSignals([manualSignal], [quizEvidenceSignal])
    expect(merged[0].status).toBe('mastered')
    expect(merged[0].correct).toBe(3)
  })

  it('persists theory separately through the learning-state outbox path', async () => {
    const state = createEmptyState('u1', 'device-1')
    state.grammar.weakTopics = [{
      topic: 'articles',
      errorRate: 0.5,
      sampleCount: 2,
      lastCoveredAt: '2026-07-17T12:00:00.000Z',
    }]
    mocks.get.mockResolvedValue({ userId: 'u1', state, updatedAt: state.updatedAt })
    const incoming = concept('be', '2026-07-18T12:00:00.000Z', 'review')

    const result = await persistAssessmentConceptProfile('u1', [incoming], 'B2')

    expect(result.theory.concepts).toEqual([incoming])
    expect(result.level).toEqual({ cefrEstimate: 'B2', confidence: state.level.confidence })
    expect(result.grammar).toEqual(state.grammar)
    expect(mocks.persistLearningState).toHaveBeenCalledWith('u1', result)
    expect(mocks.getUserLearningState).not.toHaveBeenCalled()
  })

  it('records evidence sessions into lastSessions so the coach knows what was studied today', async () => {
    const state = createEmptyState('u1', 'device-1')
    mocks.get.mockResolvedValue({ userId: 'u1', state, updatedAt: state.updatedAt })
    const incoming = concept('present-perfect', '2026-08-27T12:00:00.000Z', 'review')
    incoming.source = 'exercise'
    incoming.correct = 2
    incoming.total = 3

    const result = await updateConceptSignalsWithEvidence('u1', [incoming])

    expect(result.lastSessions[0]).toEqual({
      topic: 'present-perfect',
      endedAt: '2026-08-27T12:00:00.000Z',
      exercisesCompleted: 3,
      correctRate: 2 / 3,
    })
  })
})
