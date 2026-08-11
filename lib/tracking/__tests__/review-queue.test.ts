import { describe, expect, it } from 'vitest'
import { makeWordBankEntry } from '@/lib/exercises/__tests__/fixtures/word-bank-entry'
import type { TrackedItem, TrackingItem } from '../types'
import { buildTrackingReviewQueue } from '../review-queue'

const WORD_ID = '550e8400-e29b-41d4-a716-446655440000'

function wordItem(): TrackingItem {
  return { id: WORD_ID, kind: 'word', title: 'ephemeral', progressLabel: 'Guardada' }
}

function tracked(kind: 'phrase' | 'lesson', ref: string): TrackedItem {
  return {
    id: `${kind}-1`, userId: 'user-1', kind, ref, title: ref, payload: { text: ref },
    createdAt: '2026-07-21T10:00:00.000Z', updatedAt: '2026-07-21T10:00:00.000Z',
  }
}

describe('buildTrackingReviewQueue', () => {
  it('keeps exact order, real word-bank identity and lesson destination', () => {
    const queue = buildTrackingReviewQueue([
      { item: wordItem(), word: makeWordBankEntry({ id: WORD_ID, text: 'ephemeral' }) },
      { item: { id: 'lesson-1', kind: 'lesson', title: 'Present simple' }, trackedItem: tracked('lesson', 'present-simple') },
    ])

    expect(queue.items.map((item) => item.id)).toEqual([WORD_ID, 'lesson-1'])
    expect(queue.items[1]?.href).toBe('/mini-lessons/present-simple')
    expect(queue.exercises[0]?.context).toBe('review')
    expect(queue.exercises[0]?.sourceRef).toEqual({ source: 'word_bank', id: WORD_ID })
    expect(queue.skipped).toEqual([])
  })

  it('keeps an unresolved personal phrase as activity-only shadowing', () => {
    const queue = buildTrackingReviewQueue([
      { item: { id: 'phrase-1', kind: 'phrase', title: 'I am going to call' }, trackedItem: tracked('phrase', 'i am going to call') },
    ])

    expect(queue.exercises).toHaveLength(1)
    expect(queue.exercises[0]?.sourceRef).toEqual({ source: 'tracked_items', id: 'phrase-1' })
    expect(queue.notices[0]).toMatchObject({ code: 'activity_only', itemId: 'phrase-1' })
    expect(queue.skipped).toEqual([])
  })

  it('preserves one explicit authored target and rejects stale refs', () => {
    const targeted = tracked('phrase', 'I am gonna call')
    targeted.payload.pronunciationTargetId = 'connected.reduction.gonna'
    const stale = tracked('phrase', 'stale')
    stale.id = 'phrase-stale'
    stale.payload.pronunciationTargetId = 'connected.missing'
    const queue = buildTrackingReviewQueue([
      { item: { id: 'phrase-1', kind: 'phrase', title: 'I am gonna call' }, trackedItem: targeted },
      { item: { id: 'phrase-stale', kind: 'phrase', title: 'stale' }, trackedItem: stale },
    ])

    const data = queue.exercises[0]?.payload.kind === 'generic' ? queue.exercises[0].payload.data : null
    expect(data).toMatchObject({ pronunciationTargetId: 'connected.reduction.gonna' })
    expect(queue.skipped[0]).toMatchObject({ code: 'invalid_target_ref', itemId: 'phrase-stale' })
    expect(queue.notices).toEqual([])
  })

  it('uses the resolved canonical target for a phrase and skips stale words', () => {
    const queue = buildTrackingReviewQueue([
      { item: { id: 'phrase-1', kind: 'phrase', title: 'I am gonna call' }, trackedItem: tracked('phrase', 'i am gonna call') },
      { item: { id: 'missing-word', kind: 'word', title: 'gone' }, word: undefined as never },
    ], {
      resolvePhrase: () => ({
        sourceRef: { source: 'text_fragments', id: 'cs-linking:phrase-1' },
        phrase: 'I am gonna call you later.',
        deckSlug: 'cs-linking',
      }),
    })

    expect(queue.exercises[0]?.sourceRef).toEqual({ source: 'text_fragments', id: 'cs-linking:phrase-1' })
    expect(queue.exercises[0]?.slug).toBe('cs_shadow_phrase')
    expect(queue.skipped[0]).toMatchObject({ code: 'missing_word', itemId: 'missing-word' })
  })

  it('deduplicates the same selected item without duplicating evidence targets', () => {
    const source = { item: wordItem(), word: makeWordBankEntry({ id: WORD_ID }) }
    const queue = buildTrackingReviewQueue([source, source])
    expect(queue.items).toHaveLength(1)
    expect(queue.exercises).toHaveLength(1)
  })
})
