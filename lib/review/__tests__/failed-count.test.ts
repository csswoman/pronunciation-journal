import { describe, expect, it } from 'vitest'
import { countUnredeemedFailures } from '../failed-count-core'

describe('countUnredeemedFailures', () => {
  it('counts every distinct unresolved failure without a row cap', () => {
    const failures = Array.from({ length: 125 }, (_, index) => ({
      content_id: `content-${index}`,
      answered_at: '2026-09-18T10:00:00.000Z',
    }))
    expect(countUnredeemedFailures(failures, [])).toBe(125)
  })

  it('redeems only with success newer than the latest failure', () => {
    const failures = [
      { content_id: 'one', answered_at: '2026-09-18T10:00:00.000Z' },
      { content_id: 'one', answered_at: '2026-09-18T12:00:00.000Z' },
      { content_id: 'two', answered_at: '2026-09-18T10:00:00.000Z' },
    ]
    const successes = [
      { content_id: 'one', answered_at: '2026-09-18T11:00:00.000Z' },
      { content_id: 'two', answered_at: '2026-09-18T11:00:00.000Z' },
    ]
    expect(countUnredeemedFailures(failures, successes)).toBe(1)
  })
})
