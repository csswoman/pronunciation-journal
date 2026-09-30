import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { applyJournalFeedback } from '@/lib/journal/apply-feedback'
import type { JournalCorrectionResult } from '@/lib/journal/correction'

vi.mock('server-only', () => ({}))

interface TopicRow {
  topic: string
  interval_days: number
  next_review_at: string | null
}

interface MockState {
  correctionRpcArgs: Record<string, unknown> | null
  topicRpcArgs: Record<string, unknown>[]
}

function createSupabaseMock(opts: {
  journalUpdate: { data: unknown[] | null; error: unknown }
  topicRow?: (topic: string) => TopicRow | null
}): { client: SupabaseClient<Database>; state: MockState } {
  const state: MockState = {
    correctionRpcArgs: null,
    topicRpcArgs: [],
  }

  const from = vi.fn(() => { throw new Error('correction persistence must use the atomic RPC') })

  const rpc = vi.fn(async (name: string, args: Record<string, unknown>) => {
    if (name === 'apply_journal_correction') {
      state.correctionRpcArgs = args
      if (opts.journalUpdate.error) return { data: null, error: opts.journalUpdate.error }
      return { data: { applied: Boolean(opts.journalUpdate.data?.length), state: null }, error: null }
    }
    expect(name).toBe('apply_topic_srs_rating_event')
    state.topicRpcArgs.push(args)
    const existing = opts.topicRow?.(String(args.p_topic))
    return {
      data: existing ?? {
        topic: args.p_topic,
        interval_days: 1,
        next_review_at: '2026-01-01T00:00:00.000Z',
      },
      error: null,
    }
  })

  return { client: { from, rpc } as unknown as SupabaseClient<Database>, state }
}

const baseCorrection: JournalCorrectionResult = {
  correctedContent: 'Yesterday I went to work.',
  errors: [
    { quote: 'I go', correction: 'I went', type: 'tense', explanationEs: 'Usa pasado.', topic: 'grammar:past_simple' },
  ],
  newWords: ['commute'],
}

describe('applyJournalFeedback', () => {
  it('marks the entry corrected and schedules the canonical topic through the RPC', async () => {
    const { client, state } = createSupabaseMock({ journalUpdate: { data: [{ id: 'e1' }], error: null } })

    const result = await applyJournalFeedback(client, {
      userId: 'u1',
      entryId: 'e1',
      correction: baseCorrection,
    })

    expect(result).toMatchObject({ applied: true })
    expect(result.applied && result.scheduledTopics).toHaveLength(1)
    expect(result.applied && result.scheduledTopics[0]).toMatchObject({
      topicId: 'grammar:past simple',
      intervalDays: 1,
    })
    expect(state.correctionRpcArgs).toMatchObject({
      p_user_id: 'u1', p_entry_id: 'e1', p_corrected_content: 'Yesterday I went to work.',
      p_pattern_ids: ['tense_present_for_past'],
    })
    expect(state.topicRpcArgs).toHaveLength(1)
    expect(state.topicRpcArgs[0]).toMatchObject({ p_user_id: 'u1', p_topic: 'grammar:past simple', p_grade: 2 })
  })

  it('captures the dates returned for two different canonical topics', async () => {
    const correction: JournalCorrectionResult = {
      correctedContent: 'I went to the shop.',
      errors: [
        { quote: 'go', correction: 'went', type: 'tense', explanationEs: 'Usa pasado.', topic: 'grammar:past_simple' },
        { quote: 'shop', correction: 'the shop', type: 'article', explanationEs: 'Usa artículo.', topic: 'grammar:articles' },
      ],
      newWords: [],
    }
    const { client, state } = createSupabaseMock({ journalUpdate: { data: [{ id: 'e1' }], error: null } })

    const result = await applyJournalFeedback(client, { userId: 'u1', entryId: 'e1', correction })

    expect(result).toMatchObject({ applied: true })
    if (!result.applied) return
    expect(result.scheduledTopics.map((topic) => topic.topicId)).toEqual(['grammar:past simple', 'grammar:articles'])
    expect(state.topicRpcArgs.map((args) => args.p_topic)).toEqual(['grammar:past simple', 'grammar:articles'])
    for (const scheduled of result.scheduledTopics) {
      const row = state.topicRpcArgs.find((args) => args.p_topic === scheduled.topicId)
      expect(row).toBeDefined()
    }
  })

  it('uses the server RPC result for an existing topic row', async () => {
    const existing: TopicRow = {
      topic: 'grammar:past simple',
      interval_days: 6,
      next_review_at: '2026-01-01T00:00:00.000Z',
    }
    const { client, state } = createSupabaseMock({
      journalUpdate: { data: [{ id: 'e1' }], error: null },
      topicRow: () => existing,
    })

    const result = await applyJournalFeedback(client, { userId: 'u1', entryId: 'e1', correction: baseCorrection })

    expect(result).toMatchObject({ applied: true })
    expect(result.applied && result.scheduledTopics[0]).toMatchObject({ topicId: 'grammar:past simple', intervalDays: 6 })
    expect(state.topicRpcArgs).toHaveLength(1)
  })

  it('is idempotent: a non-submitted entry skips SRS entirely', async () => {
    const { client, state } = createSupabaseMock({ journalUpdate: { data: [], error: null } })

    const result = await applyJournalFeedback(client, {
      userId: 'u1',
      entryId: 'e1',
      correction: baseCorrection,
    })

    expect(result).toEqual({ applied: false, reason: 'not_submitted' })
    expect(state.topicRpcArgs).toEqual([])
  })

  it('dedupes canonical spellings and warns/discards topics outside the journal catalog', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const correction: JournalCorrectionResult = {
      correctedContent: 'ok',
      errors: [
        { quote: 'a', correction: 'b', type: 't', explanationEs: 'x', topic: 'grammar:past_simple' },
        { quote: 'c', correction: 'd', type: 't', explanationEs: 'y', topic: 'grammar:past  simple' },
        { quote: 'e', correction: 'f', type: 't', explanationEs: 'z', topic: 'grammar:conditionals' },
        { quote: 'g', correction: 'h', type: 't', explanationEs: 'z', topic: 'past_simple' },
      ],
      newWords: [],
    }
    const { client, state } = createSupabaseMock({ journalUpdate: { data: [{ id: 'e1' }], error: null } })

    const result = await applyJournalFeedback(client, { userId: 'u1', entryId: 'e1', correction })

    expect(result).toMatchObject({ applied: true })
    expect(result.applied && result.scheduledTopics).toHaveLength(1)
    expect(result.applied && result.scheduledTopics[0]?.topicId).toBe('grammar:past simple')
    expect(state.topicRpcArgs).toHaveLength(1)
    expect(warn).toHaveBeenCalledTimes(2)
    warn.mockRestore()
  })

  it('persists correction and mapped patterns through one atomic RPC', async () => {
    const { client, state } = createSupabaseMock({ journalUpdate: { data: [{ id: 'e1' }], error: null } })
    await applyJournalFeedback(client, { userId: 'u1', entryId: 'e1', correction: baseCorrection })

    expect(state.correctionRpcArgs).toBeDefined()
    expect(state.topicRpcArgs).toHaveLength(1)
  })

  it('propagates atomic persistence failures so the route cannot report success', async () => {
    const { client } = createSupabaseMock({ journalUpdate: { data: null, error: new Error('transaction failed') } })
    await expect(applyJournalFeedback(client, { userId: 'u1', entryId: 'e1', correction: baseCorrection }))
      .rejects.toThrow('transaction failed')
  })
})
