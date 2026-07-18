import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fromMock = vi.fn()
const updateMock = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({ from: fromMock }),
}))

vi.mock('@/lib/sync/sync-manager', () => ({ enqueue: vi.fn() }))

import { applyFlashcardRating, applyPhase2Penalty } from '../srs-queries'

const NOW = new Date('2026-07-18T12:00:00.000Z')

function existingEntry(overrides: Record<string, unknown> = {}) {
  return {
    id: 'word-1',
    user_id: 'user-1',
    text: 'ship',
    source_ref: 'lexicon:ship',
    ease_factor: 1.5,
    interval_days: 6,
    repetitions: 3,
    srs_status: 'review',
    next_review_at: '2026-07-18T00:00:00.000Z',
    last_reviewed_at: '2026-07-01T00:00:00.000Z',
    review_count: 4,
    ...overrides,
  }
}

function mockExistingFlashcard(entry = existingEntry()) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: entry, error: null })
  const selectSecondEq = vi.fn(() => ({ maybeSingle }))
  const selectFirstEq = vi.fn(() => ({ eq: selectSecondEq }))
  const select = vi.fn(() => ({ eq: selectFirstEq }))

  const single = vi.fn(async () => ({
    data: { ...entry, ...updateMock.mock.calls.at(-1)?.[0] },
    error: null,
  }))
  const updateSelect = vi.fn(() => ({ single }))
  const updateSecondEq = vi.fn(() => ({ select: updateSelect, error: null }))
  const updateFirstEq = vi.fn(() => ({ eq: updateSecondEq }))
  updateMock.mockImplementation(() => ({ eq: updateFirstEq }))

  fromMock.mockReturnValue({ select, update: updateMock })
}

function lastPayload() {
  return updateMock.mock.calls.at(-1)?.[0]
}

describe('word-bank SRS manual writes', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    fromMock.mockReset()
    updateMock.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("preserves historical ease for the 'known' fast path", async () => {
    mockExistingFlashcard(existingEntry({ ease_factor: 1.5 }))

    await applyFlashcardRating(
      'user-1',
      { sourceRef: 'lexicon:ship', text: 'ship', definition: 'a vessel' },
      'known',
    )

    expect(lastPayload()).toMatchObject({
      ease_factor: 1.5,
      interval_days: 30,
      repetitions: 1,
      srs_status: 'mastered',
    })
  })

  it("records 'forgot' as a coherent learning lapse with the deliberate soft ease penalty", async () => {
    mockExistingFlashcard(existingEntry({ ease_factor: 1.4 }))

    await applyFlashcardRating(
      'user-1',
      { sourceRef: 'lexicon:ship', text: 'ship', definition: 'a vessel' },
      'forgot',
    )

    expect(lastPayload()).toMatchObject({
      ease_factor: 1.3,
      interval_days: 1,
      repetitions: 0,
      srs_status: 'learning',
      last_reviewed_at: NOW.toISOString(),
      review_count: 5,
    })
    expect(lastPayload().next_review_at).toBe('2026-07-19T12:00:00.000Z')
  })

  it('records a phase-2 penalty as a coherent learning lapse', async () => {
    const secondEq = vi.fn(() => ({ error: null }))
    const firstEq = vi.fn(() => ({ eq: secondEq }))
    updateMock.mockImplementation(() => ({ eq: firstEq }))
    fromMock.mockReturnValue({ update: updateMock })

    await applyPhase2Penalty('user-1', 'word-1', 1.4)

    expect(lastPayload()).toEqual({
      srs_status: 'learning',
      interval_days: 1,
      repetitions: 0,
      ease_factor: 1.3,
      next_review_at: '2026-07-19T12:00:00.000Z',
      last_reviewed_at: NOW.toISOString(),
    })
  })
})
