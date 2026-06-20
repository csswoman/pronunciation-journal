import { describe, it, expect, vi } from 'vitest'
import { resolveReaderPassage } from '../get-passage'
import type { ReaderPassage } from '../types'

const passage = (over: Partial<ReaderPassage> = {}): ReaderPassage => ({
  id: 'p1', userId: 'u1', targetItems: ['go'], targetSrsIds: ['c1k:go'], targetHash: 'h', topic: 't',
  passage: 'x', questions: [], level: 'B1', createdAt: '2030-01-01T00:00:00.000Z', ...over,
})

const STALE_MS = 7 * 24 * 60 * 60 * 1000

describe('resolveReaderPassage', () => {
  it('returns null when there are no targets and no cache', async () => {
    const out = await resolveReaderPassage({
      userId: 'u1', targets: [], online: true,
      getCached: async () => undefined, generate: vi.fn(), save: vi.fn(), now: Date.now(),
    })
    expect(out).toBeNull()
  })

  it('serves fresh cache without generating', async () => {
    const now = Date.parse('2030-01-02T00:00:00.000Z') // 1 day old
    const generate = vi.fn()
    const out = await resolveReaderPassage({
      userId: 'u1', targets: [{ srsId: 'c1k:go', word: 'go' }], online: true,
      getCached: async () => passage(), generate, save: vi.fn(), now,
    })
    expect(out?.id).toBe('p1')
    expect(generate).not.toHaveBeenCalled()
  })

  it('generates and saves when there is no cache and we are online', async () => {
    const fresh = passage({ id: 'p2' })
    const save = vi.fn()
    const out = await resolveReaderPassage({
      userId: 'u1', targets: [{ srsId: 'c1k:go', word: 'go' }], online: true,
      getCached: async () => undefined, generate: async () => fresh, save, now: Date.now(),
    })
    expect(out?.id).toBe('p2')
    expect(save).toHaveBeenCalledWith(fresh)
  })

  it('serves stale immediately and revalidates in the background', async () => {
    const now = Date.parse('2030-01-01T00:00:00.000Z') + STALE_MS + 1000 // >7 days old
    const fresh = passage({ id: 'p3' })
    const save = vi.fn(async () => {})
    const generate = vi.fn(async () => fresh)
    const out = await resolveReaderPassage({
      userId: 'u1', targets: [{ srsId: 'c1k:go', word: 'go' }], online: true,
      getCached: async () => passage(), generate, save, now,
    })
    expect(out?.id).toBe('p1') // stale served immediately
    await Promise.resolve(); await Promise.resolve()
    expect(generate).toHaveBeenCalled() // revalidation fired
  })

  it('keeps stale when background regeneration fails', async () => {
    const now = Date.parse('2030-01-01T00:00:00.000Z') + STALE_MS + 1000
    const out = await resolveReaderPassage({
      userId: 'u1', targets: [{ srsId: 'c1k:go', word: 'go' }], online: true,
      getCached: async () => passage(),
      generate: async () => { throw new Error('network') }, save: vi.fn(), now,
    })
    expect(out?.id).toBe('p1') // no throw, stale retained
  })

  it('returns null offline with no cache', async () => {
    const out = await resolveReaderPassage({
      userId: 'u1', targets: [{ srsId: 'c1k:go', word: 'go' }], online: false,
      getCached: async () => undefined, generate: vi.fn(), save: vi.fn(), now: Date.now(),
    })
    expect(out).toBeNull()
  })
})
