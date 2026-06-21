import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { UserContrastProgress } from '../types'
import type { SessionResult, ExerciseResult } from '@/lib/practice/types'

const { mockUpdateContrastProgress, mockGetContrastProgress, mockRecordActivitySession } =
  vi.hoisted(() => ({
    mockUpdateContrastProgress: vi.fn(),
    mockGetContrastProgress: vi.fn(),
    mockRecordActivitySession: vi.fn(),
  }))

vi.mock('../queries', () => ({
  updateContrastProgress: mockUpdateContrastProgress,
  getContrastProgress: mockGetContrastProgress,
}))
vi.mock('@/lib/progress/activity-hub', () => ({
  recordActivitySession: mockRecordActivitySession,
}))

import { finishContrastSession } from '../finish-session'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeResult(overrides: Partial<ExerciseResult> = {}): ExerciseResult {
  return {
    exerciseId: 'ex-1',
    slug: 'pick_word',
    exerciseTypeId: 1,
    isCorrect: true,
    timeMs: 1000,
    contentId: 'word-1',
    context: 'sound_lab',
    completedAt: new Date(),
    ...overrides,
  }
}

function makeSessionResult(results: ExerciseResult[]): SessionResult {
  const correct = results.filter((r) => r.isCorrect).length
  const total = results.length
  return {
    results,
    accuracy: total > 0 ? (correct / total) * 100 : 0,
    totalTimeMs: results.reduce((s, r) => s + r.timeMs, 0),
    bySlug: { pick_word: { total, correct } } as SessionResult['bySlug'],
  }
}

function makeContrastProgress(overrides: Partial<UserContrastProgress> = {}): UserContrastProgress {
  return {
    id: 'prog-1',
    user_id: 'user-1',
    contrast_id: '/iː/|/ɪ/',
    total_attempts: 10,
    correct_answers: 8,
    streak: 3,
    next_review: null,
    last_seen: null,
    ease_factor: 2.5,
    interval_days: 1,
    mastery_pct: 80,
    ...overrides,
  }
}

const USER_ID    = 'user-1'
const CONTRAST_ID = '/iː/|/ɪ/'

beforeEach(() => {
  vi.resetAllMocks()
  mockGetContrastProgress.mockResolvedValue(null)
  mockRecordActivitySession.mockResolvedValue({ reconciledStepIds: [] })
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('finishContrastSession', () => {
  it('returns nextReview date from SR calculation', async () => {
    const result = makeSessionResult([makeResult({ isCorrect: true })])
    const outcome = await finishContrastSession(USER_ID, CONTRAST_ID, result)

    expect(outcome.nextReview).toBeInstanceOf(Date)
    expect(outcome.nextReview.getTime()).toBeGreaterThan(Date.now())
  })

  it('calls updateContrastProgress with correct counts', async () => {
    const results = [makeResult({ isCorrect: true }), makeResult({ isCorrect: false })]
    const sessionResult = makeSessionResult(results)

    await finishContrastSession(USER_ID, CONTRAST_ID, sessionResult)

    expect(mockUpdateContrastProgress).toHaveBeenCalledOnce()
    const [uid, cid, correct, total] = mockUpdateContrastProgress.mock.calls[0]
    expect(uid).toBe(USER_ID)
    expect(cid).toBe(CONTRAST_ID)
    expect(correct).toBe(1)
    expect(total).toBe(2)
  })

  it('records a normalized Sound Lab session while preserving contrast mastery', async () => {
    const sessionResult = makeSessionResult([makeResult()])
    await finishContrastSession(USER_ID, CONTRAST_ID, sessionResult)

    expect(mockRecordActivitySession).toHaveBeenCalledWith(USER_ID, {
      practiceContext: 'sound_lab',
      sessionResult,
      source: 'sound_lab',
      metadata: { contrastId: CONTRAST_ID },
    })
  })

  it('uses default progress when no existing progress', async () => {
    const result = makeSessionResult([makeResult()])
    await finishContrastSession(USER_ID, CONTRAST_ID, result)

    expect(mockUpdateContrastProgress).toHaveBeenCalledOnce()
  })

  it('contrastMastered=false when thresholds are not met', async () => {
    const progress = makeContrastProgress({ total_attempts: 5, correct_answers: 4, streak: 2 })
    const result = makeSessionResult([makeResult()])
    const outcome = await finishContrastSession(USER_ID, CONTRAST_ID, result, progress)

    expect(outcome.contrastMastered).toBe(false)
  })

  it('contrastMastered=true when thresholds are reached', async () => {
    // After session: total=10+1=11, correct=10+1=11 (100%), streak=3+1=4 (>=3)
    const progress = makeContrastProgress({
      total_attempts: 10,
      correct_answers: 10,
      streak: 3,
      ease_factor: 2.5,
      interval_days: 1,
    })
    const sessionResult = makeSessionResult([makeResult({ isCorrect: true })])

    const outcome = await finishContrastSession(USER_ID, CONTRAST_ID, sessionResult, progress)

    expect(outcome.contrastMastered).toBe(true)
  })

  it('session passes when correct >= ceil(total/2) → SR streak increments', async () => {
    const results = [
      makeResult({ isCorrect: true }),
      makeResult({ isCorrect: true }),
      makeResult({ isCorrect: false }),
    ]
    const sessionResult = makeSessionResult(results)
    const progress = makeContrastProgress({ streak: 0, interval_days: 1, ease_factor: 2.5 })

    await finishContrastSession(USER_ID, CONTRAST_ID, sessionResult, progress)

    const srArg = mockUpdateContrastProgress.mock.calls[0][4]
    expect(srArg.streak).toBe(1)
  })

  it('session fails when correct < ceil(total/2) → SR resets streak', async () => {
    const results = [makeResult({ isCorrect: false }), makeResult({ isCorrect: false })]
    const sessionResult = makeSessionResult(results)
    const progress = makeContrastProgress({ streak: 3, interval_days: 7, ease_factor: 2.5 })

    await finishContrastSession(USER_ID, CONTRAST_ID, sessionResult, progress)

    const srArg = mockUpdateContrastProgress.mock.calls[0][4]
    expect(srArg.streak).toBe(0)
    expect(srArg.interval_days).toBe(1)
  })

  it('persists EMA mastery_pct on session complete', async () => {
    const progress = makeContrastProgress({
      mastery_pct: 100,
      last_seen: new Date('2026-06-01T12:00:00Z').toISOString(),
    })
    const sessionResult = makeSessionResult([makeResult({ isCorrect: true })])

    const outcome = await finishContrastSession(
      USER_ID,
      CONTRAST_ID,
      sessionResult,
      progress,
      new Date('2026-06-08T12:00:00Z'),
    )

    const masteryArg = mockUpdateContrastProgress.mock.calls[0][5]
    expect(masteryArg).toBeGreaterThanOrEqual(90)
    expect(outcome.masteryPct).toBe(masteryArg)
  })
})
