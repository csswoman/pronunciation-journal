import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { applyJournalFeedback } from '@/lib/journal/apply-feedback'
import type { JournalCorrectionResult } from '@/lib/journal/correction'

interface TopicRow {
  id: string
  ease_factor: number
  interval_days: number
  repetitions: number
  next_review_at: string | null
  srs_status: string
  last_reviewed_at: string | null
  review_count: number
}

interface MockState {
  journalUpdatePayload: Record<string, unknown> | null
  topicSelects: string[]
  topicUpdates: Record<string, unknown>[]
  topicInserts: Record<string, unknown>[]
}

function createSupabaseMock(opts: {
  journalUpdate: { data: unknown[] | null; error: unknown }
  topicRow?: (topic: string) => TopicRow | null
}): { client: SupabaseClient<Database>; state: MockState } {
  const state: MockState = {
    journalUpdatePayload: null,
    topicSelects: [],
    topicUpdates: [],
    topicInserts: [],
  }

  const thenable = (result: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test double
    const chain: any = {
      eq: () => chain,
      then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve),
    }
    return chain
  }

  const from = vi.fn((table: string) => {
    if (table === 'journal_entries') {
      return {
        update(payload: Record<string, unknown>) {
          state.journalUpdatePayload = payload
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test double
          const builder: any = {
            eq: () => builder,
            select: async () => opts.journalUpdate,
          }
          return builder
        },
      }
    }

    if (table === 'topic_srs') {
      let selectedTopic = ''
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test double
      const selectBuilder: any = {
        eq: (col: string, val: string) => {
          if (col === 'topic') selectedTopic = val
          return selectBuilder
        },
        maybeSingle: async () => {
          state.topicSelects.push(selectedTopic)
          return { data: opts.topicRow?.(selectedTopic) ?? null, error: null }
        },
      }
      return {
        select: () => selectBuilder,
        update(payload: Record<string, unknown>) {
          state.topicUpdates.push(payload)
          return thenable({ error: null })
        },
        insert(payload: Record<string, unknown>) {
          state.topicInserts.push(payload)
          return thenable({ error: null })
        },
      }
    }

    throw new Error(`unexpected table ${table}`)
  })

  return { client: { from } as unknown as SupabaseClient<Database>, state }
}

const baseCorrection: JournalCorrectionResult = {
  correctedContent: 'Yesterday I went to work.',
  errors: [
    { quote: 'I go', correction: 'I went', type: 'tense', explanationEs: 'Usa pasado.', topic: 'grammar:past_simple' },
  ],
  newWords: ['commute'],
}

describe('applyJournalFeedback', () => {
  it('marks the entry corrected and schedules an SM-2 review (not a bare counter bump)', async () => {
    const { client, state } = createSupabaseMock({ journalUpdate: { data: [{ id: 'e1' }], error: null } })

    const result = await applyJournalFeedback(client, {
      userId: 'u1',
      entryId: 'e1',
      correction: baseCorrection,
    })

    expect(result).toEqual({ applied: true, scheduledTopics: ['grammar:past simple'] })
    expect(state.journalUpdatePayload).toMatchObject({ status: 'corrected', corrected_content: 'Yesterday I went to work.' })
    // New topic → insert with full SM-2 fields, proving real scheduling.
    expect(state.topicInserts).toHaveLength(1)
    expect(state.topicInserts[0]).toMatchObject({
      user_id: 'u1',
      topic: 'grammar:past simple',
      review_count: 1,
    })
    expect(state.topicInserts[0]).toHaveProperty('ease_factor')
    expect(state.topicInserts[0]).toHaveProperty('interval_days')
    expect(state.topicInserts[0]).toHaveProperty('next_review_at')
    expect(state.topicInserts[0]).toHaveProperty('srs_status')
  })

  it('updates an existing topic_srs row with SM-2 fields and increments review_count', async () => {
    const existing: TopicRow = {
      id: 't1',
      ease_factor: 2.5,
      interval_days: 6,
      repetitions: 2,
      next_review_at: '2026-01-01T00:00:00.000Z',
      srs_status: 'review',
      last_reviewed_at: '2025-12-26T00:00:00.000Z',
      review_count: 4,
    }
    const { client, state } = createSupabaseMock({
      journalUpdate: { data: [{ id: 'e1' }], error: null },
      topicRow: () => existing,
    })

    await applyJournalFeedback(client, { userId: 'u1', entryId: 'e1', correction: baseCorrection })

    expect(state.topicInserts).toHaveLength(0)
    expect(state.topicUpdates).toHaveLength(1)
    expect(state.topicUpdates[0]).toMatchObject({ review_count: 5 })
    // Real reschedule: interval math ran and moved the card, not just a counter.
    expect(state.topicUpdates[0]).toHaveProperty('next_review_at')
    expect(state.topicUpdates[0].interval_days).not.toBe(existing.interval_days)
  })

  it('is idempotent: a non-submitted entry skips SRS entirely', async () => {
    const { client, state } = createSupabaseMock({ journalUpdate: { data: [], error: null } })

    const result = await applyJournalFeedback(client, {
      userId: 'u1',
      entryId: 'e1',
      correction: baseCorrection,
    })

    expect(result).toEqual({ applied: false, reason: 'not_submitted' })
    expect(state.topicSelects).toEqual([])
    expect(state.topicInserts).toEqual([])
    expect(state.topicUpdates).toEqual([])
  })

  it('dedupes topics and normalizes unknown/empty labels to grammar:other', async () => {
    const correction: JournalCorrectionResult = {
      correctedContent: 'ok',
      errors: [
        { quote: 'a', correction: 'b', type: 't', explanationEs: 'x', topic: 'Past Simple' },
        { quote: 'c', correction: 'd', type: 't', explanationEs: 'y', topic: 'past  simple' },
        { quote: 'e', correction: 'f', type: 't', explanationEs: 'z', topic: '   ' },
      ],
      newWords: [],
    }
    const { client, state } = createSupabaseMock({ journalUpdate: { data: [{ id: 'e1' }], error: null } })

    const result = await applyJournalFeedback(client, { userId: 'u1', entryId: 'e1', correction })

    expect(result).toMatchObject({ applied: true })
    expect(result.applied && result.scheduledTopics.sort()).toEqual(['grammar:other', 'past simple'])
    expect(state.topicInserts).toHaveLength(2)
  })

  it('does not add newWords to the word bank', async () => {
    const { client } = createSupabaseMock({ journalUpdate: { data: [{ id: 'e1' }], error: null } })
    await applyJournalFeedback(client, { userId: 'u1', entryId: 'e1', correction: baseCorrection })
    // Only journal_entries + topic_srs tables are ever touched.
    const tables = (client.from as unknown as { mock: { calls: string[][] } }).mock.calls.map((c) => c[0])
    expect(new Set(tables)).toEqual(new Set(['journal_entries', 'topic_srs']))
  })
})
