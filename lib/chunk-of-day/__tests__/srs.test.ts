import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SRSData } from '@/lib/types'

const dbMocks = vi.hoisted(() => ({
  getSRSData: vi.fn(),
  saveSRSData: vi.fn(),
}))
vi.mock('@/lib/db', () => dbMocks)

import { chunkSrsId, upsertChunkSrs } from '../srs'

beforeEach(() => {
  vi.clearAllMocks()
  dbMocks.getSRSData.mockResolvedValue(undefined)
})

describe('chunk SRS', () => {
  it('uses a user-scoped namespaced row', async () => {
    await upsertChunkSrs('user-1', '001-hello', 4)
    expect(chunkSrsId('001-hello')).toBe('chunk:001-hello')
    expect(dbMocks.getSRSData).toHaveBeenCalledWith('chunk:001-hello', 'user-1')
    const [saved, userId] = dbMocks.saveSRSData.mock.calls[0] as [SRSData, string]
    expect(userId).toBe('user-1')
    expect(saved.wordId).toBe('chunk:001-hello')
    expect(saved.repetitions).toBe(1)
    expect(new Date(saved.nextReview).getTime()).toBeGreaterThan(Date.now())
  })
})
