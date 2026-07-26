// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildValidDiagnosticResult } from '@/lib/pronunciation/assessment/__tests__/fixtures'
import { contrastTargetId, phonemeTargetId } from '@/lib/pronunciation/targets/registry'
import { saveGuestPronunciationDiagnostic } from '@/lib/pronunciation/assessment/guest-transfer'

const { from } = vi.hoisted(() => ({ from: vi.fn() }))

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({ from }),
}))

import { db, lessonCompletionKey } from '@/lib/db'
import { persistPronunciationAssessmentLocal } from '@/lib/pronunciation/assessment/persistence'
import { loadPathEvidence } from '../load-evidence'

const SCHWA = phonemeTargetId('/ə/')
const TH = contrastTargetId('/θ/', '/ð/')

function mockEmptyRemote() {
  from.mockReturnValue({
    select: () => ({
      eq: () => ({
        order: () => ({
          limit: () => ({
            maybeSingle: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      }),
    }),
  })
}

function stubLocalStorage() {
  const store = new Map<string, string>()
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      clear: () => store.clear(),
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
    },
  })
}

describe('loadPathEvidence', () => {
  beforeEach(async () => {
    stubLocalStorage()
    db.close()
    await db.delete()
    await db.open()
    from.mockReset()
    mockEmptyRemote()
  })

  afterEach(() => db.close())

  it('maps completed lessonSlug to content-map keys', async () => {
    await db.completedLessons.put({
      key: lessonCompletionKey('user-1', 'a2', 'schwa-sound'),
      userId: 'user-1',
      courseSlug: 'a2',
      lessonSlug: 'schwa-sound',
      completedAt: '2026-07-20T12:00:00.000Z',
      source: 'lesson_completion',
      updatedAt: '2026-07-20T12:00:00.000Z',
    })

    const bundle = await loadPathEvidence('user-1')
    expect(bundle.completedContentKeys.has('public_lesson:schwa-sound')).toBe(true)
    expect(bundle.spokenAttempts).toEqual([])
  })

  it('reads priority target ids from the latest local diagnostic', async () => {
    const result = buildValidDiagnosticResult('user-1')
    result.targetResults = result.targetResults.map((row) =>
      row.targetId === SCHWA ? { ...row, status: 'priority' as const } : row
    )
    await persistPronunciationAssessmentLocal('user-1', result)

    const bundle = await loadPathEvidence('user-1')
    expect(bundle.diagnosticPriorityIds).toContain(SCHWA)
    expect(bundle.diagnosticByTargetId.get(SCHWA)?.status).toBe('priority')
  })

  it('puts prescription day-one first even when it is not status priority', async () => {
    const result = buildValidDiagnosticResult('user-1')
    result.prescription.sessions = [
      { targetId: TH, reason: 'Day one focus', style: 'drill' },
      { targetId: SCHWA, reason: 'Day two', style: 'drill' },
      { targetId: SCHWA, reason: 'Day three', style: 'perception' },
      { targetId: TH, reason: 'Day four', style: 'drill' },
      { targetId: 'prosody.word-stress', reason: 'Transfer', style: 'transfer' },
    ]
    result.targetResults = result.targetResults.map((row) =>
      row.targetId === SCHWA ? { ...row, status: 'priority' as const } : row
    )
    await persistPronunciationAssessmentLocal('user-1', result)

    const bundle = await loadPathEvidence('user-1')
    expect(bundle.diagnosticPriorityIds[0]).toBe(TH)
    expect(bundle.diagnosticPriorityIds).toContain(SCHWA)
  })

  it('reads a guest diagnostic when there is no userId', async () => {
    const result = buildValidDiagnosticResult('guest')
    result.prescription.sessions[0] = {
      targetId: SCHWA,
      reason: 'Guest day one',
      style: 'drill',
    }
    saveGuestPronunciationDiagnostic(result)

    const bundle = await loadPathEvidence(null)
    expect(bundle.diagnosticPriorityIds[0]).toBe(SCHWA)
  })
})
