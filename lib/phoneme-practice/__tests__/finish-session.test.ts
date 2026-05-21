import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { UserSoundProgress } from '../types'
import type { SessionResult, ExerciseResult } from '@/lib/practice/types'

const { mockUpdateProgress, mockMarkMastered, mockUnlockNextSound, mockGetAllProgress } =
  vi.hoisted(() => ({
    mockUpdateProgress: vi.fn(),
    mockMarkMastered: vi.fn(),
    mockUnlockNextSound: vi.fn(),
    mockGetAllProgress: vi.fn(),
  }))

vi.mock('../queries', () => ({
  updateProgress: mockUpdateProgress,
  markMastered: mockMarkMastered,
  unlockNextSound: mockUnlockNextSound,
  getAllProgress: mockGetAllProgress,
}))

import { finishPhonemeSession } from '../finish-session'

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

function makeProgress(overrides: Partial<UserSoundProgress> = {}): UserSoundProgress {
  return {
    id: 'prog-1',
    user_id: 'user-1',
    sound_id: 1,
    status: 'practicing',
    total_attempts: 10,
    correct_answers: 8,
    streak: 3,
    best_streak: 4,
    last_practiced: null,
    next_review: null,
    ease_factor: 2.5,
    interval_days: 1,
    ...overrides,
  }
}

const USER_ID = 'user-1'
const SOUND_ID = 1

beforeEach(() => {
  vi.resetAllMocks()
  mockGetAllProgress.mockResolvedValue([])
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('finishPhonemeSession', () => {
  it('returns nextReview date from SR calculation', async () => {
    const result = makeSessionResult([makeResult({ isCorrect: true })])
    const outcome = await finishPhonemeSession(USER_ID, SOUND_ID, result, null)

    expect(outcome.nextReview).toBeInstanceOf(Date)
    expect(outcome.nextReview.getTime()).toBeGreaterThan(Date.now())
  })

  it('calls updateProgress with correct counts', async () => {
    const results = [makeResult({ isCorrect: true }), makeResult({ isCorrect: false })]
    const sessionResult = makeSessionResult(results)

    await finishPhonemeSession(USER_ID, SOUND_ID, sessionResult, null)

    expect(mockUpdateProgress).toHaveBeenCalledOnce()
    const [uid, sid, correct, total] = mockUpdateProgress.mock.calls[0]
    expect(uid).toBe(USER_ID)
    expect(sid).toBe(SOUND_ID)
    expect(correct).toBe(1)
    expect(total).toBe(2)
  })

  it('uses default progress when currentProgress is null', async () => {
    const result = makeSessionResult([makeResult()])
    await finishPhonemeSession(USER_ID, SOUND_ID, result, null)

    expect(mockUpdateProgress).toHaveBeenCalledOnce()
  })

  it('does not call markMastered when thresholds are not met', async () => {
    const progress = makeProgress({ total_attempts: 5, correct_answers: 4, streak: 2 })
    const result = makeSessionResult([makeResult()])
    await finishPhonemeSession(USER_ID, SOUND_ID, result, progress)

    expect(mockMarkMastered).not.toHaveBeenCalled()
  })

  it('calls markMastered and unlockNextSound when mastery is reached', async () => {
    // After session: total_attempts=15+1=16, correct=14+1=15 (93%), streak will be >=5
    const progress = makeProgress({
      total_attempts: 15,
      correct_answers: 14,
      streak: 4,
      ease_factor: 2.5,
      interval_days: 1,
    })
    // Pass the session so streak increments to 5
    const results = Array.from({ length: 1 }, () => makeResult({ isCorrect: true }))
    const sessionResult = makeSessionResult(results)

    const nextSoundId = 2
    mockGetAllProgress.mockResolvedValue([
      { sound_id: SOUND_ID, status: 'mastered', user_id: USER_ID },
      { sound_id: nextSoundId, status: 'locked', user_id: USER_ID },
    ])

    const outcome = await finishPhonemeSession(USER_ID, SOUND_ID, sessionResult, progress)

    expect(mockMarkMastered).toHaveBeenCalledWith(USER_ID, SOUND_ID)
    expect(mockUnlockNextSound).toHaveBeenCalledWith(USER_ID, nextSoundId)
    expect(outcome.mastered).toBe(true)
    expect(outcome.unlockedSoundId).toBe(nextSoundId)
  })

  it('returns mastered=false and unlockedSoundId=null when not mastered', async () => {
    const result = makeSessionResult([makeResult()])
    const outcome = await finishPhonemeSession(USER_ID, SOUND_ID, result, makeProgress())

    expect(outcome.mastered).toBe(false)
    expect(outcome.unlockedSoundId).toBeNull()
  })

  it('session passes when correct >= ceil(total/2)', async () => {
    // 2 out of 3 correct → passes → SR should use correct=true path (streak increases)
    const results = [
      makeResult({ isCorrect: true }),
      makeResult({ isCorrect: true }),
      makeResult({ isCorrect: false }),
    ]
    const sessionResult = makeSessionResult(results)
    const progress = makeProgress({ streak: 0, interval_days: 1, ease_factor: 2.5 })

    await finishPhonemeSession(USER_ID, SOUND_ID, sessionResult, progress)

    const srArg = mockUpdateProgress.mock.calls[0][4]
    expect(srArg.streak).toBe(1) // SR ran with sessionPassed=true
  })

  it('session fails when correct < ceil(total/2)', async () => {
    const results = [makeResult({ isCorrect: false }), makeResult({ isCorrect: false })]
    const sessionResult = makeSessionResult(results)
    const progress = makeProgress({ streak: 3, interval_days: 7, ease_factor: 2.5 })

    await finishPhonemeSession(USER_ID, SOUND_ID, sessionResult, progress)

    const srArg = mockUpdateProgress.mock.calls[0][4]
    expect(srArg.streak).toBe(0) // SR ran with sessionPassed=false
    expect(srArg.interval_days).toBe(1) // reset to 1
  })
})
