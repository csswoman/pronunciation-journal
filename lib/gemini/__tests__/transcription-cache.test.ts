import { describe, expect, it, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: async () => ({ from: mocks.from }),
}))

import { buildTranscriptionCacheKey, createTranscriptionCache } from '../transcription-cache'

beforeEach(() => {
  mocks.from.mockReset()
})

describe('transcription cache', () => {
  it('builds stable keys from ordered parts', () => {
    expect(buildTranscriptionCacheKey(['user', 'audio/webm', 'abc'])).toBe(
      buildTranscriptionCacheKey(['user', 'audio/webm', 'abc'])
    )
    expect(buildTranscriptionCacheKey(['user', 'audio/webm', 'abc'])).not.toBe(
      buildTranscriptionCacheKey(['user', 'audio/ogg', 'abc'])
    )
  })

  it('returns fresh L2 hits and scopes lookup to user and cache key', async () => {
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { transcript: 'cached', updated_at: new Date().toISOString() },
        error: null,
      }),
    }
    mocks.from.mockReturnValueOnce(query)
    const cache = createTranscriptionCache({
      table: 'sentence_transcription_cache',
      ttlMs: 60_000,
      maxEntries: 10,
    })

    const transcript = await cache.getL2('u1', 'key')

    expect(transcript).toBe('cached')
    expect(query.eq).toHaveBeenNthCalledWith(1, 'user_id', 'u1')
    expect(query.eq).toHaveBeenNthCalledWith(2, 'cache_key', 'key')
  })

  it('upserts L2 rows with optional extra fields', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null })
    mocks.from.mockReturnValueOnce({ upsert })
    const cache = createTranscriptionCache<{ targetWord?: string }>({
      table: 'stt_transcription_cache',
      ttlMs: 60_000,
      maxEntries: 10,
      buildExtraRow: ({ targetWord }) => ({ target_word: targetWord ?? null }),
    })

    await cache.setL2('u1', 'key', 'hello', 'audio/webm', 4, { targetWord: 'hello' })

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'u1',
        cache_key: 'key',
        mime_type: 'audio/webm',
        transcript: 'hello',
        payload_size: 4,
        target_word: 'hello',
      }),
      { onConflict: 'user_id,cache_key' }
    )
  })
})
