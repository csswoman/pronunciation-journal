import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import {
  completeCurrentAction,
  createActionSession,
  type ActionSessionState,
} from '../action-session'
import {
  clearEssentialWordsSessionDraft,
  ESSENTIAL_WORDS_DRAFT_MAX_AGE_MS,
  loadEssentialWordsSessionDraft,
  saveEssentialWordsSessionDraft,
  type EssentialWordsSessionDraft,
} from '../session-draft'
import type { EssentialWord } from '../types'

const entry: EssentialWord = {
  rank: 1,
  word: 'test',
  pos: 'noun',
  ipa_strong: 'test',
  meaning: 'a check',
  example_sentence: 'This is a test.',
  cefr_level: 'A1',
}

function draft(userId = 'user-a'): EssentialWordsSessionDraft {
  const now = new Date('2026-08-10T12:00:00.000Z').toISOString()
  return {
    userId,
    version: 1,
    sessionId: 'session-1',
    source: 'legacy',
    sizeId: 'recommended',
    routeId: null,
    levels: null,
    pos: null,
    plan: { actionBudget: 15, completedActions: 2, pending: [], reserve: [], claimedKnownWordIds: [] },
    results: [],
    progress: [],
    summary: { practiced: 2, correct: 1 },
    activeElapsedMs: 1_000,
    createdAt: now,
    updatedAt: now,
  }
}

describe('essential words session draft', () => {
  beforeEach(async () => {
    await db.essentialWordSessionDrafts.clear()
  })

  it('keeps drafts isolated by account', async () => {
    await saveEssentialWordsSessionDraft(draft('user-a'))
    expect(await loadEssentialWordsSessionDraft('user-a', new Date('2026-08-10T12:01:00.000Z'))).not.toBeNull()
    expect(await loadEssentialWordsSessionDraft('user-b', new Date('2026-08-10T12:01:00.000Z'))).toBeNull()
  })

  it('expires and removes drafts after fourteen days', async () => {
    await saveEssentialWordsSessionDraft(draft())
    const now = new Date(new Date('2026-08-10T12:00:00.000Z').getTime() + ESSENTIAL_WORDS_DRAFT_MAX_AGE_MS + 1)
    expect(await loadEssentialWordsSessionDraft('user-a', now)).toBeNull()
    expect(await db.essentialWordSessionDrafts.get('user-a')).toBeUndefined()
  })

  it('clears a completed or discarded draft', async () => {
    await saveEssentialWordsSessionDraft(draft())
    await clearEssentialWordsSessionDraft('user-a')
    expect(await loadEssentialWordsSessionDraft('user-a')).toBeNull()
  })

  it('removes an invalid snapshot instead of attempting to resume it', async () => {
    const invalid = { ...draft(), progress: undefined }
    await db.essentialWordSessionDrafts.put(invalid as never)

    expect(await loadEssentialWordsSessionDraft('user-a')).toBeNull()
    expect(await db.essentialWordSessionDrafts.get('user-a')).toBeUndefined()
  })

  it.each([
    ['after exposure', completeCurrentAction(createActionSession([{ entry, source: 'new' }], 5))],
    ['after a failed answer', completeCurrentAction(createActionSession([{ entry, source: 'new' }], 5), { retry: true })],
    ['before final verification', Array.from({ length: 4 }).reduce<ActionSessionState>(
      (state) => completeCurrentAction(state),
      createActionSession([{ entry, source: 'new' }], 5),
    )],
  ] satisfies Array<[string, ActionSessionState]>)('restores the exact action state %s', async (_label, plan) => {
    const snapshot = { ...draft(), plan, activeElapsedMs: 12_345 }
    await saveEssentialWordsSessionDraft(snapshot)

    const restored = await loadEssentialWordsSessionDraft(
      'user-a',
      new Date('2026-08-10T12:01:00.000Z'),
    )

    expect(restored?.plan).toEqual(plan)
    expect(restored?.activeElapsedMs).toBe(12_345)
  })
})
