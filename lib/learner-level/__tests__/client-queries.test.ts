import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  maybeSingle: vi.fn(),
  ensureDbReady: vi.fn(),
  getLearningState: vi.fn(),
  readGuestStudyLevel: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: mocks.maybeSingle }),
      }),
    }),
  }),
}))

vi.mock('@/lib/db', () => ({
  ensureDbReady: mocks.ensureDbReady,
  db: { learningState: { get: mocks.getLearningState } },
}))

vi.mock('@/lib/preferences/guest-study-level', () => ({
  readGuestStudyLevel: mocks.readGuestStudyLevel,
}))

import { getEffectiveLearnerLevel, getEffectiveLearnerLevelForViewer } from '../client-queries'

beforeEach(() => {
  vi.clearAllMocks()
  mocks.ensureDbReady.mockResolvedValue(undefined)
  mocks.getLearningState.mockResolvedValue(undefined)
  mocks.readGuestStudyLevel.mockReturnValue('B2')
})

describe('getEffectiveLearnerLevel', () => {
  it('reports unknown when the profile query fails', async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: new Error('offline') })

    await expect(getEffectiveLearnerLevel('u1')).resolves.toMatchObject({
      level: 'A1', source: 'unknown', isPlaced: false,
    })
  })

  it('uses the guest study level through the unified viewer reader', async () => {
    await expect(getEffectiveLearnerLevelForViewer(null)).resolves.toMatchObject({
      level: 'B2', source: 'manual', isPlaced: false,
    })
  })
})
