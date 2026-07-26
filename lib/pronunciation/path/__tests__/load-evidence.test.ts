// @vitest-environment node
import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildValidDiagnosticResult } from '@/lib/pronunciation/assessment/__tests__/fixtures'
import { phonemeTargetId } from '@/lib/pronunciation/targets/registry'

const { from } = vi.hoisted(() => ({ from: vi.fn() }))

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({ from }),
}))

import { db, lessonCompletionKey } from '@/lib/db'
import { persistPronunciationAssessmentLocal } from '@/lib/pronunciation/assessment/persistence'
import { loadPathEvidence } from '../load-evidence'

const SCHWA = phonemeTargetId('/ə/')

describe('loadPathEvidence', () => {
  beforeEach(async () => {
    db.close()
    await db.delete()
    await db.open()
    from.mockReset()
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
})
