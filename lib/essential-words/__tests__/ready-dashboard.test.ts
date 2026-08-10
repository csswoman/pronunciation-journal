import { describe, expect, it, vi, beforeEach } from 'vitest'
import { loadEssentialWordsReadyDashboard } from '../ready-dashboard'

vi.mock('../queries', () => ({
  getLearningItems: vi.fn(),
  getAttemptLogs: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  db: {
    srsData: {
      filter: vi.fn(),
    },
  },
}))

vi.mock('../ready-last-session', () => ({
  loadLastEssentialWordsSession: vi.fn(() => null),
}))

import { getAttemptLogs, getLearningItems } from '../queries'
import { db } from '@/lib/db'
import { loadLastEssentialWordsSession } from '../ready-last-session'

describe('loadEssentialWordsReadyDashboard', () => {
  beforeEach(() => {
    vi.mocked(getLearningItems).mockReset()
    vi.mocked(getAttemptLogs).mockReset()
    vi.mocked(loadLastEssentialWordsSession).mockReset().mockReturnValue(null)
    vi.mocked(db.srsData.filter).mockReset()
  })

  it('returns empty-signal dashboard for a new learner', async () => {
    vi.mocked(getLearningItems).mockResolvedValue([])
    vi.mocked(getAttemptLogs).mockResolvedValue([])
    vi.mocked(db.srsData.filter).mockReturnValue({
      toArray: async () => [],
    } as never)

    const dashboard = await loadEssentialWordsReadyDashboard(
      'user-1',
      new Date('2026-08-10T12:00:00.000Z'),
    )

    expect(dashboard.forecast).toHaveLength(7)
    expect(dashboard.vocabulary).toBeNull()
    expect(dashboard.retention).toBeNull()
    expect(dashboard.leeches).toEqual([])
    expect(dashboard.heatmap).toBeNull()
    expect(dashboard.streakMarks).toHaveLength(7)
    expect(dashboard.lastSession).toBeNull()
  })
})
