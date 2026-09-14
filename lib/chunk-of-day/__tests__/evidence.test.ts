// @vitest-environment node
import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { deriveChunkEvidenceReadiness, recordChunkEvidence } from '../evidence'

const userId = 'user-chunk-evidence'
const chunkId = '013-where-are-you-from'

beforeEach(async () => {
  db.close()
  await db.delete()
  await db.open()
})

afterEach(() => db.close())

describe('evidencia de chunks', () => {
  it('requires contextual production on separate days before saying a chunk is usable', async () => {
    await recordChunkEvidence(userId, chunkId, 'spoken_production', '2026-09-13T12:00:00.000Z')
    await recordChunkEvidence(userId, chunkId, 'spoken_production', '2026-09-13T18:00:00.000Z')
    expect(deriveChunkEvidenceReadiness(await db.chunkEvidence.get(`${userId}:${chunkId}`))).toMatchObject({
      useDays: 1,
      canSayCanUse: false,
    })

    await recordChunkEvidence(userId, chunkId, 'contextual_use', '2026-09-14T12:00:00.000Z')
    expect(deriveChunkEvidenceReadiness(await db.chunkEvidence.get(`${userId}:${chunkId}`))).toMatchObject({
      useDays: 2,
      canSayCanUse: true,
    })
  })
})
