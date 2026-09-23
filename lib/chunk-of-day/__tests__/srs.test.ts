import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SRSData } from '@/lib/types'

const dbMocks = vi.hoisted(() => ({
  getSRSData: vi.fn(),
  saveSRSData: vi.fn(),
  transaction: vi.fn(async (_mode: string, _tables: unknown[], work: () => Promise<void>) => work()),
}))
const syncMocks = vi.hoisted(() => ({ enqueue: vi.fn() }))
vi.mock('@/lib/db', () => ({ ...dbMocks, db: { srsData: {}, syncOutbox: {}, transaction: dbMocks.transaction } }))
vi.mock('@/lib/sync/sync-manager', () => syncMocks)

import { chunkSrsId, upsertChunkSrs } from '../srs'

beforeEach(() => {
  vi.clearAllMocks()
  dbMocks.getSRSData.mockResolvedValue(undefined)
  syncMocks.enqueue.mockResolvedValue(1)
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
    expect(syncMocks.enqueue).toHaveBeenCalledWith(
      'user-1',
      'content_srs',
      'upsert',
      expect.objectContaining({ content_id: '001-hello', namespace: 'chunks', user_id: 'user-1' }),
      undefined,
      'user_id,namespace,content_id',
    )
  })
})
