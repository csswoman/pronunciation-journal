// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock dependencies ──────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  mockSupabaseAuthGetUser: vi.fn(),
  mockSupabaseFrom: vi.fn(),
  mockDbTransaction: vi.fn(),
  mockSyncOutboxAdd: vi.fn(),
  mockSyncOutboxDelete: vi.fn(),
  mockMarkLessonComplete: vi.fn(),
  mockMarkLessonIncomplete: vi.fn(),
  mockEnqueue: vi.fn(),
  mockBuildSessionResult: vi.fn(),
  mockRecordActivitySession: vi.fn(),
  mockIsLessonComplete: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({
    auth: { getUser: mocks.mockSupabaseAuthGetUser },
    from: mocks.mockSupabaseFrom,
  }),
}))

vi.mock('@/lib/db', () => ({
  db: {
    syncOutbox: { add: mocks.mockSyncOutboxAdd, delete: mocks.mockSyncOutboxDelete },
    completedLessons: {},
    transaction: mocks.mockDbTransaction,
  },
  isLessonComplete: mocks.mockIsLessonComplete,
  markLessonComplete: mocks.mockMarkLessonComplete,
  markLessonIncomplete: mocks.mockMarkLessonIncomplete,
}))

vi.mock('@/lib/sync/sync-manager', () => ({
  enqueue: mocks.mockEnqueue,
}))

vi.mock('@/lib/practice/session-result', () => ({
  buildSessionResult: mocks.mockBuildSessionResult,
}))

vi.mock('@/lib/progress/activity-hub', () => ({
  recordActivitySession: mocks.mockRecordActivitySession,
}))

// ── Import subject ─────────────────────────────────────────────────────────

import {
  isLessonQuizPassed,
  recordLessonComplete,
  recordLessonIncomplete,
  recordLessonQuizAttempt,
  savePracticeSession,
} from '../queries'
import type { SessionResult } from '../types'

// ── A. isLessonQuizPassed ─────────────────────────────────────────────────

describe('isLessonQuizPassed', () => {
  it('returns false when total is 0', () => {
    expect(isLessonQuizPassed(0, 0)).toBe(false)
  })

  it('returns true when score meets threshold', () => {
    // 70% threshold, so 7/10 passes
    expect(isLessonQuizPassed(7, 10)).toBe(true)
    expect(isLessonQuizPassed(70, 100)).toBe(true)
  })

  it('returns false when score is below threshold', () => {
    expect(isLessonQuizPassed(6, 10)).toBe(false)
    expect(isLessonQuizPassed(69, 100)).toBe(false)
  })

  it('returns true for perfect score', () => {
    expect(isLessonQuizPassed(10, 10)).toBe(true)
  })
})

// ── B. recordLessonComplete ────────────────────────────────────────────────

describe('recordLessonComplete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.mockDbTransaction.mockImplementation(
      async (_mode: string, _tables: unknown, fn: () => Promise<unknown>) => fn()
    )
    mocks.mockEnqueue.mockResolvedValue(1)
    mocks.mockSyncOutboxAdd.mockResolvedValue(1)
  })

  it('throws when user is not authenticated', async () => {
    mocks.mockSupabaseAuthGetUser.mockResolvedValue({ data: { user: null } })
    await expect(recordLessonComplete('course-1', 'lesson-1')).rejects.toThrow(
      'Cannot record lesson completion without an authenticated user'
    )
  })

  it('does not re-enqueue if lesson already complete', async () => {
    mocks.mockSupabaseAuthGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mocks.mockIsLessonComplete.mockResolvedValue(true)
    await recordLessonComplete('course-1', 'lesson-1')
    expect(mocks.mockEnqueue).not.toHaveBeenCalled()
  })

  it('enqueues lesson_completions upsert when not previously complete', async () => {
    mocks.mockSupabaseAuthGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mocks.mockIsLessonComplete.mockResolvedValue(false)
    mocks.mockMarkLessonComplete.mockResolvedValue(undefined)

    await recordLessonComplete('course-1', 'lesson-1')

    expect(mocks.mockEnqueue).toHaveBeenCalledWith(
      'user-1',
      'lesson_completions',
      'upsert',
      expect.objectContaining({
        user_id: 'user-1',
        course_slug: 'course-1',
        lesson_slug: 'lesson-1',
        source: 'lesson_completion',
      }),
      undefined,
      'user_id,course_slug,lesson_slug'
    )
  })
})

// ── C. recordLessonIncomplete ──────────────────────────────────────────────

describe('recordLessonIncomplete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.mockDbTransaction.mockImplementation(
      async (_mode: string, _tables: unknown, fn: () => Promise<unknown>) => fn()
    )
  })

  it('throws when user is not authenticated', async () => {
    mocks.mockSupabaseAuthGetUser.mockResolvedValue({ data: { user: null } })
    await expect(recordLessonIncomplete('course-1', 'lesson-1')).rejects.toThrow(
      'Cannot remove lesson completion without an authenticated user'
    )
  })

  it('enqueues lesson_completions delete', async () => {
    mocks.mockSupabaseAuthGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mocks.mockMarkLessonIncomplete.mockResolvedValue(undefined)
    mocks.mockEnqueue.mockResolvedValue(1)

    await recordLessonIncomplete('course-1', 'lesson-1')

    expect(mocks.mockEnqueue).toHaveBeenCalledWith(
      'user-1',
      'lesson_completions',
      'delete',
      {},
      {
        user_id: 'user-1',
        course_slug: 'course-1',
        lesson_slug: 'lesson-1',
      }
    )
  })
})

// ── D. recordLessonQuizAttempt ─────────────────────────────────────────────

describe('recordLessonQuizAttempt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns pass status based on correct answers', async () => {
    const answers = [
      {
        questionId: 'q1',
        courseSlug: 'course-1',
        lessonSlug: 'lesson-1',
        question: 'What is 2+2?',
        selectedAnswer: '4',
        correctAnswer: '4',
        isCorrect: true,
        timeMs: 1000,
      },
      {
        questionId: 'q2',
        courseSlug: 'course-1',
        lessonSlug: 'lesson-1',
        question: 'What is 3+3?',
        selectedAnswer: '7',
        correctAnswer: '6',
        isCorrect: false,
        timeMs: 1000,
      },
    ]

    // Mock savePracticeAnswer via implementation
    mocks.mockEnqueue.mockResolvedValue(1)
    mocks.mockDbTransaction.mockImplementation(
      async (_mode: string, _tables: unknown, fn: () => Promise<unknown>) => fn()
    )
    mocks.mockBuildSessionResult.mockReturnValue({
      results: [
        { isCorrect: true },
        { isCorrect: false },
      ],
    })

    const result = await recordLessonQuizAttempt('user-1', answers)

    // 1/2 = 50%, below 70% threshold
    expect(result.passed).toBe(false)
    expect(result.correct).toBe(1)
    expect(result.total).toBe(2)
  })

  it('returns passed when score meets threshold', async () => {
    const answers = [
      {
        questionId: 'q1',
        courseSlug: 'course-1',
        lessonSlug: 'lesson-1',
        question: 'Q1',
        selectedAnswer: 'A',
        correctAnswer: 'A',
        isCorrect: true,
        timeMs: 1000,
      },
      {
        questionId: 'q2',
        courseSlug: 'course-1',
        lessonSlug: 'lesson-1',
        question: 'Q2',
        selectedAnswer: 'B',
        correctAnswer: 'B',
        isCorrect: true,
        timeMs: 1000,
      },
      {
        questionId: 'q3',
        courseSlug: 'course-1',
        lessonSlug: 'lesson-1',
        question: 'Q3',
        selectedAnswer: 'C',
        correctAnswer: 'C',
        isCorrect: true,
        timeMs: 1000,
      },
    ]

    mocks.mockEnqueue.mockResolvedValue(1)
    mocks.mockDbTransaction.mockImplementation(
      async (_mode: string, _tables: unknown, fn: () => Promise<unknown>) => fn()
    )
    mocks.mockBuildSessionResult.mockReturnValue({
      results: [{ isCorrect: true }, { isCorrect: true }, { isCorrect: true }],
    })

    const result = await recordLessonQuizAttempt('user-1', answers)

    // 3/3 = 100%, above 70% threshold
    expect(result.passed).toBe(true)
    expect(result.correct).toBe(3)
    expect(result.total).toBe(3)
  })
})

// ── E. savePracticeSession ─────────────────────────────────────────────────

describe('savePracticeSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.mockEnqueue.mockResolvedValue(1)
    mocks.mockDbTransaction.mockImplementation(
      async (_mode: string, _tables: unknown, fn: () => Promise<unknown>) => fn()
    )
  })

  it('saves each result as a practice answer', async () => {
    const results = {
      results: [
        {
          exerciseId: 'e1',
          slug: 'fill_blank',
          exerciseTypeId: 5,
          isCorrect: true,
          userAnswer: 'test',
          timeMs: 1000,
          contentId: 'c1',
          context: 'courses',
          exercisePayload: {},
          completedAt: new Date(),
        },
        {
          exerciseId: 'e2',
          slug: 'multiple_choice',
          exerciseTypeId: 17,
          isCorrect: false,
          userAnswer: 'wrong',
          timeMs: 500,
          contentId: 'c2',
          context: 'courses',
          exercisePayload: {},
          completedAt: new Date(),
        },
      ],
      accuracy: 50,
      totalTimeMs: 1500,
      bySlug: {} as SessionResult['bySlug'],
    } satisfies SessionResult

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await savePracticeSession('user-1', results, 'courses')

    expect(mocks.mockEnqueue).toHaveBeenCalledTimes(2)
    consoleSpy.mockRestore()
  })

  it('continues saving other results when one fails', async () => {
    const results = {
      results: [
        {
          exerciseId: 'e1',
          slug: 'fill_blank',
          exerciseTypeId: 5,
          isCorrect: true,
          userAnswer: 'test',
          timeMs: 1000,
          contentId: 'c1',
          context: 'courses',
          exercisePayload: {},
          completedAt: new Date(),
        },
      ],
      accuracy: 100,
      totalTimeMs: 1000,
      bySlug: {} as SessionResult['bySlug'],
    } satisfies SessionResult

    // First call throws, second succeeds
    mocks.mockEnqueue
      .mockRejectedValueOnce(new Error('test error'))
      .mockResolvedValueOnce(1)

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await savePracticeSession('user-1', results, 'courses')

    expect(consoleSpy).toHaveBeenCalled()
    expect(mocks.mockEnqueue).toHaveBeenCalledTimes(1) // Called once, error caught
    consoleSpy.mockRestore()
  })
})
