import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PracticeSessionRecord } from '@/lib/db'
import type { ExerciseResult, PracticeExercise } from '../types'

// In-memory replacement for Dexie's `practiceSessions` table. Implements the
// subset of the Dexie API our session-store uses: get, put, update, delete,
// and `where('expiresAt').below(...).delete()`.
const store = new Map<string, PracticeSessionRecord>()
const fakeTable = {
  get: vi.fn(async (id: string) => store.get(id)),
  put: vi.fn(async (record: PracticeSessionRecord) => {
    store.set(record.id, record)
  }),
  update: vi.fn(
    async (id: string, patch: Partial<PracticeSessionRecord>) => {
      const existing = store.get(id)
      if (!existing) return 0
      store.set(id, { ...existing, ...patch })
      return 1
    },
  ),
  delete: vi.fn(async (id: string) => {
    store.delete(id)
  }),
  where: vi.fn((field: keyof PracticeSessionRecord) => ({
    below: (value: string) => ({
      delete: vi.fn(async () => {
        for (const [id, rec] of store) {
          const v = rec[field]
          if (typeof v === 'string' && v < value) store.delete(id)
        }
      }),
    }),
  })),
}

vi.mock('@/lib/db', () => ({
  db: { practiceSessions: fakeTable },
}))

// Import AFTER the mock so the module picks up the fake `db`.
const {
  createSession,
  deleteSession,
  evictExpiredSessions,
  loadActiveSession,
  updateSessionProgress,
} = await import('../session-store')

const sampleExercise: PracticeExercise = {
  id: 'ex-1',
  slug: 'pick_word',
  exerciseTypeId: 1,
  contentId: '42:pick_word:seat:a,b',
  context: 'sound_lab',
  payload: {
    kind: 'phoneme',
    ipa: 'iː',
    targetWord: 'seat',
    options: [
      { id: 'a', label: 'seat', isCorrect: true },
      { id: 'b', label: 'sit', isCorrect: false },
    ],
    correctIds: ['a'],
  },
  soundId: 42,
}

function sampleAnswer(isCorrect = true): ExerciseResult {
  return {
    exerciseId: 'ex-1',
    slug: 'pick_word',
    exerciseTypeId: 1,
    isCorrect,
    userAnswer: 'seat',
    timeMs: 1200,
    contentId: '42:pick_word:seat:a,b',
    context: 'sound_lab',
    soundId: 42,
    completedAt: new Date('2026-05-20T10:00:00Z'),
  }
}

beforeEach(() => {
  store.clear()
  vi.clearAllMocks()
})

describe('session-store', () => {
  it('createSession persists a record with composite key and 24h TTL', async () => {
    const before = Date.now()
    const rec = await createSession({
      userId: 'user-1',
      soundId: 42,
      exercises: [sampleExercise],
    })
    const after = Date.now()

    expect(rec.id).toBe('user-1:42')
    expect(rec.currentIndex).toBe(0)
    expect(rec.answers).toEqual([])
    expect(rec.exercises).toEqual([sampleExercise])

    const expiresAt = new Date(rec.expiresAt).getTime()
    const startedAt = new Date(rec.startedAt).getTime()
    expect(expiresAt - startedAt).toBe(24 * 60 * 60 * 1000)
    expect(startedAt).toBeGreaterThanOrEqual(before)
    expect(startedAt).toBeLessThanOrEqual(after)

    expect(store.get('user-1:42')).toEqual(rec)
  })

  it('loadActiveSession returns null when no session exists', async () => {
    const result = await loadActiveSession('user-1', 42)
    expect(result).toBeNull()
  })

  it('loadActiveSession returns the active record when not expired', async () => {
    await createSession({ userId: 'user-1', soundId: 42, exercises: [sampleExercise] })
    const result = await loadActiveSession('user-1', 42)
    expect(result).not.toBeNull()
    expect(result?.exercises).toEqual([sampleExercise])
  })

  it('loadActiveSession deletes and returns null for an expired record', async () => {
    const expired: PracticeSessionRecord = {
      id: 'user-1:42',
      userId: 'user-1',
      soundId: 42,
      exercises: [sampleExercise],
      currentIndex: 0,
      answers: [],
      startedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() - 60 * 1000).toISOString(),
    }
    store.set(expired.id, expired)

    const result = await loadActiveSession('user-1', 42)
    expect(result).toBeNull()
    expect(store.has('user-1:42')).toBe(false)
  })

  it('updateSessionProgress patches currentIndex and answers in place', async () => {
    await createSession({ userId: 'user-1', soundId: 42, exercises: [sampleExercise] })
    const answer = sampleAnswer()
    await updateSessionProgress('user-1', 42, {
      currentIndex: 1,
      answers: [answer],
    })

    const reloaded = await loadActiveSession('user-1', 42)
    expect(reloaded?.currentIndex).toBe(1)
    expect(reloaded?.answers).toEqual([answer])
    // Exercises were not in the patch — they must remain intact.
    expect(reloaded?.exercises).toEqual([sampleExercise])
  })

  it('deleteSession removes the record', async () => {
    await createSession({ userId: 'user-1', soundId: 42, exercises: [sampleExercise] })
    await deleteSession('user-1', 42)
    expect(store.has('user-1:42')).toBe(false)
  })

  it('evictExpiredSessions removes only past-TTL rows', async () => {
    const fresh: PracticeSessionRecord = {
      id: 'user-1:1',
      userId: 'user-1',
      soundId: 1,
      exercises: [sampleExercise],
      currentIndex: 0,
      answers: [],
      startedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    }
    const stale: PracticeSessionRecord = {
      ...fresh,
      id: 'user-1:2',
      soundId: 2,
      expiresAt: new Date(Date.now() - 60_000).toISOString(),
    }
    store.set(fresh.id, fresh)
    store.set(stale.id, stale)

    await evictExpiredSessions()

    expect(store.has(fresh.id)).toBe(true)
    expect(store.has(stale.id)).toBe(false)
  })
})
