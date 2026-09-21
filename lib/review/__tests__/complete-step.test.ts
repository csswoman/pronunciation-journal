import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SessionResult } from '@/lib/practice/types'

const finishAttributedContrastSessions = vi.hoisted(() => vi.fn())

vi.mock('@/lib/phoneme-practice/finish-session', () => ({
  finishAttributedContrastSessions,
}))

import { persistReviewStepProgress } from '../complete-step'

const result = { results: [], accuracy: 0, totalTimeMs: 0, bySlug: {} } as unknown as SessionResult

describe('persistReviewStepProgress', () => {
  beforeEach(() => vi.clearAllMocks())

  it('forwards Review results to the canonical contrast updater', async () => {
    await persistReviewStepProgress('user-1', result)
    expect(finishAttributedContrastSessions).toHaveBeenCalledWith('user-1', result)
  })

  it('does not persist anonymous progress', async () => {
    await persistReviewStepProgress(null, result)
    expect(finishAttributedContrastSessions).not.toHaveBeenCalled()
  })
})
