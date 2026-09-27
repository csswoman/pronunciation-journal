import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAllSounds, getSoundById, getAllContrastProgress, getContrastProgress } from '@/lib/phoneme-practice/queries'
import { db } from '@/lib/db'

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }))

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({
    from: mockFrom,
  }),
}))

vi.mock('@/lib/sync/sync-manager', () => ({
  enqueue: vi.fn(),
}))

describe('phoneme queries offline fallback', () => {
  beforeEach(async () => {
    // Clear test tables
    await db.cachedSounds.clear()
    await db.cachedContrastProgress.clear()
    await db.syncOutbox.clear()
    mockFrom.mockReset()
    mockFrom.mockImplementation(() => {
      throw new Error('Network error: Supabase is offline')
    })
  })

  it('falls back to cachedSounds when Supabase fails on getAllSounds', async () => {
    // Pre-populate Dexie
    await db.cachedSounds.bulkPut([
      { id: 1, ipa: '/ɪ/', example: 'ship', category: 'vowel', type: 'short', difficulty: 1 },
      { id: 2, ipa: '/iː/', example: 'sheep', category: 'vowel', type: 'long', difficulty: 1 },
    ])

    const sounds = await getAllSounds()
    expect(sounds).toHaveLength(2)
    expect(sounds.map(s => s.ipa)).toEqual(expect.arrayContaining(['/ɪ/', '/iː/']))
  })

  it('falls back to cachedSounds when Supabase fails on getSoundById', async () => {
    await db.cachedSounds.put({
      id: 5,
      ipa: '/æ/',
      example: 'cat',
      category: 'vowel',
      type: 'short',
      difficulty: 1,
    })

    const sound = await getSoundById(5)
    expect(sound).toBeDefined()
    expect(sound.ipa).toBe('/æ/')
    expect(sound.example).toBe('cat')
  })

  it('falls back to cachedContrastProgress when Supabase fails on getAllContrastProgress', async () => {
    await db.cachedContrastProgress.put({
      key: 'user-1:/iː/|/ɪ/',
      userId: 'user-1',
      contrastId: '/iː/|/ɪ/',
      easeFactor: 2.5,
      intervalDays: 3,
      nextReview: '2026-09-03T00:00:00.000Z',
      lastSeen: '2026-09-01T00:00:00.000Z',
      totalAttempts: 10,
      correctAnswers: 8,
      streak: 2,
      masteryPct: 80,
      updatedAt: '2026-09-01T00:00:00.000Z',
    })

    const progress = await getAllContrastProgress('user-1')
    expect(progress).toHaveLength(1)
    expect(progress[0].contrast_id).toBe('/iː/|/ɪ/')
    expect(progress[0].mastery_pct).toBe(80)
  })

  it('falls back to cachedContrastProgress on getContrastProgress', async () => {
    const contrastKey = '/ð/|/θ/'
    await db.cachedContrastProgress.put({
      key: `user-1:${contrastKey}`,
      userId: 'user-1',
      contrastId: contrastKey,
      easeFactor: 2.3,
      intervalDays: 2,
      nextReview: '2026-09-04T00:00:00.000Z',
      lastSeen: '2026-09-02T00:00:00.000Z',
      totalAttempts: 5,
      correctAnswers: 4,
      streak: 3,
      masteryPct: 75,
      updatedAt: '2026-09-02T00:00:00.000Z',
    })

    const result = await getContrastProgress('user-1', 'θ|ð')
    expect(result).not.toBeNull()
    expect(result?.contrast_id).toBe(contrastKey)
    expect(result?.mastery_pct).toBe(75)
  })

  it('keeps a locally pending contrast event ahead of a stale remote snapshot', async () => {
    const contrastKey = '/ð/|/θ/'
    await db.cachedContrastProgress.put({
      key: `user-1:${contrastKey}`,
      userId: 'user-1',
      contrastId: contrastKey,
      easeFactor: 2.3,
      intervalDays: 2,
      nextReview: '2026-09-04T00:00:00.000Z',
      lastSeen: '2026-09-02T00:00:00.000Z',
      totalAttempts: 15,
      correctAnswers: 12,
      streak: 4,
      masteryPct: 82,
      updatedAt: '2026-09-02T00:00:00.000Z',
    })
    await db.syncOutbox.add({
      userId: 'user-1',
      table: 'user_contrast_progress',
      operation: 'rpc',
      rpcName: 'apply_contrast_session_result',
      payload: { p_contrast_id: contrastKey },
      status: 'pending',
      createdAt: '2026-09-02T00:00:00.000Z',
      retryCount: 0,
    })

    const result = await getContrastProgress('user-1', contrastKey)
    expect(result?.total_attempts).toBe(15)
    expect(result?.mastery_pct).toBe(82)
  })

  it('keeps a locally pending projection when getAll receives a stale remote snapshot', async () => {
    const contrastKey = '/ð/|/θ/'
    await db.cachedContrastProgress.put({
      key: `user-1:${contrastKey}`,
      userId: 'user-1',
      contrastId: contrastKey,
      easeFactor: 2.3,
      intervalDays: 2,
      nextReview: null,
      lastSeen: '2026-09-02T00:00:00.000Z',
      totalAttempts: 15,
      correctAnswers: 12,
      streak: 4,
      masteryPct: 82,
      updatedAt: '2026-09-02T00:00:00.000Z',
    })
    await db.syncOutbox.add({
      userId: 'user-1',
      table: 'user_contrast_progress',
      operation: 'rpc',
      rpcName: 'apply_contrast_session_result',
      payload: { p_contrast_id: contrastKey },
      status: 'pending',
      createdAt: '2026-09-02T00:00:00.000Z',
      retryCount: 0,
    })
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [{
          id: 'remote', user_id: 'user-1', contrast_id: contrastKey,
          ease_factor: 2.5, interval_days: 1, next_review: null,
          last_seen: '2026-09-01T00:00:00.000Z', total_attempts: 10,
          correct_answers: 8, streak: 2, mastery_pct: 70,
        }],
        error: null,
      }),
    })

    const result = await getAllContrastProgress('user-1')
    expect(result[0]).toMatchObject({ total_attempts: 15, mastery_pct: 82 })
  })
})
