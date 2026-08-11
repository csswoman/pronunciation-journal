import { describe, expect, it } from 'vitest'
import {
  claimKnownInActionSession,
  completeCurrentAction,
  createActionSession,
  deriveActionSessionPreview,
  removeWordFromActionSession,
  type SessionCandidate,
} from '../action-session'
import type { EssentialWord } from '../types'

function word(rank: number): EssentialWord {
  return {
    rank,
    word: `word-${rank}`,
    pos: 'noun',
    ipa_strong: `word-${rank}`,
    meaning: `meaning-${rank}`,
    example_sentence: `This is word ${rank}.`,
    cefr_level: 'A1',
  }
}

function candidate(rank: number, source: SessionCandidate['source']): SessionCandidate {
  return { entry: word(rank), source }
}

describe('action-session', () => {
  it('caps sessions at 5, 15, and 25 real actions', () => {
    const candidates = Array.from({ length: 8 }, (_, index) => candidate(index + 1, 'new'))
    expect(deriveActionSessionPreview(createActionSession(candidates, 5)))
      .toMatchObject({ scheduledActions: 5, newWordCount: 1 })
    expect(deriveActionSessionPreview(createActionSession(candidates, 15)))
      .toMatchObject({ scheduledActions: 15, newWordCount: 3 })
    expect(deriveActionSessionPreview(createActionSession(candidates, 25)))
      .toMatchObject({ scheduledActions: 25, newWordCount: 5 })
  })

  it('prioritizes continuations, then one action per review, then new sequences', () => {
    const state = createActionSession([
      candidate(3, 'new'),
      candidate(2, 'review'),
      { ...candidate(1, 'continuation'), resumeFromLevel: 2, includeExposure: false },
    ], 8)
    expect(state.pending.map((action) => action.source)).toEqual([
      'continuation', 'continuation', 'continuation', 'review', 'new', 'new', 'new', 'new',
    ])
  })

  it('uses a retry as another budgeted action without growing the denominator', () => {
    const initial = createActionSession([candidate(1, 'new'), candidate(2, 'new')], 5)
    const next = completeCurrentAction(initial, { retry: true })
    expect(next.completedActions).toBe(1)
    expect(next.pending).toHaveLength(4)
    expect(next.pending.some((action) => action.id.includes(':retry:'))).toBe(true)
    expect(next.completedActions + next.pending.length).toBe(5)
  })

  it('removes a paused word and backfills from reserve', () => {
    const initial = createActionSession([candidate(1, 'new'), candidate(2, 'new')], 5)
    const next = removeWordFromActionSession(initial, 'c1k:word-1')
    expect(next.pending).toHaveLength(5)
    expect(next.pending.every((action) => action.wordId === 'c1k:word-2')).toBe(true)
  })

  it('replaces a known claim with one final verification', () => {
    const initial = createActionSession([candidate(1, 'new'), candidate(2, 'new')], 5)
    const next = claimKnownInActionSession(initial, 'c1k:word-1', 'cloze_sentence')
    expect(next.pending).toHaveLength(5)
    expect(next.pending.at(-1)).toMatchObject({ wordId: 'c1k:word-1', final: true })
    expect(next.claimedKnownWordIds).toContain('c1k:word-1')
    expect([...next.pending, ...next.reserve]).toHaveLength(6)
  })

  it('derives a non-overlapping preview from actual actions', () => {
    const state = createActionSession([
      candidate(1, 'review'), candidate(2, 'new'), candidate(3, 'new'), candidate(4, 'new'),
    ], 15)
    expect(deriveActionSessionPreview(state)).toMatchObject({
      actionBudget: 15,
      scheduledActions: 15,
      reviewActionCount: 1,
      newWordCount: 3,
      uniqueWords: 4,
      completedActions: 0,
      remainingActions: 15,
    })
  })

  it('reports the smaller real total when a route has too few valid candidates', () => {
    const state = createActionSession([candidate(1, 'review'), candidate(2, 'review')], 15)
    expect(deriveActionSessionPreview(state)).toMatchObject({
      actionBudget: 15,
      scheduledActions: 2,
      reviewActionCount: 2,
      remainingActions: 2,
    })
  })
})
