// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AI_UNAVAILABLE_MESSAGE } from '@/lib/degradation/messages'
import {
  correctJournalEntry,
  JournalCorrectionError,
} from '@/lib/journal/correct-client'

const input = { entryId: '11111111-1111-4111-8111-111111111111', content: 'Yesterday I go to work.' }

describe('correctJournalEntry', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('fails fast and offline without hitting the network', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('navigator', { onLine: false })
    vi.stubGlobal('fetch', fetchSpy)

    await expect(correctJournalEntry(input)).rejects.toMatchObject({
      name: 'JournalCorrectionError',
      code: 'offline',
    } satisfies Partial<JournalCorrectionError>)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('maps a thrown fetch to a public network error', async () => {
    vi.stubGlobal('navigator', { onLine: true })
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('DNS boom')))

    await expect(correctJournalEntry(input)).rejects.toMatchObject({
      code: 'network',
      message: AI_UNAVAILABLE_MESSAGE,
    })
  })

  it('hides provider details from failed corrections', async () => {
    vi.stubGlobal('navigator', { onLine: true })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ error: 'Gemini stack trace: api key invalid' }),
      }),
    )

    await expect(correctJournalEntry(input)).rejects.toMatchObject({
      code: 'server',
      message: AI_UNAVAILABLE_MESSAGE,
    })
  })

  it('keeps quota failures public and actionable', async () => {
    vi.stubGlobal('navigator', { onLine: true })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: 'Resource exhausted: quota exceeded' }),
      }),
    )

    await expect(correctJournalEntry(input)).rejects.toMatchObject({
      code: 'server',
      message: expect.stringMatching(/temporarily limited/i),
    })
  })

  it('returns the parsed correction on success', async () => {
    const result = { correctedContent: 'Yesterday I went to work.', errors: [], newWords: [] }
    vi.stubGlobal('navigator', { onLine: true })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => result }))

    await expect(correctJournalEntry(input)).resolves.toEqual(result)
  })
})
