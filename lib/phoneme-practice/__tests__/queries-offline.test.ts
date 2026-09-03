import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAllSounds, getSoundById, getAllContrastProgress, getContrastProgress } from '@/lib/phoneme-practice/queries'
import { db } from '@/lib/db'

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({
    from: () => {
      throw new Error('Network error: Supabase is offline')
    },
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
})
