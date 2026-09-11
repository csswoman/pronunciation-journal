import { describe, it, expect } from 'vitest'
import {
  aggregateTopicEvidence,
  trendDirection,
  MIN_SAMPLES,
} from '../gap-evidence'
import type { SRSRatingEventRecord } from '@/lib/db'

const NOW = new Date('2026-09-11T12:00:00.000Z').getTime()
const DAY = 24 * 60 * 60 * 1000

function event(overrides: Partial<SRSRatingEventRecord> = {}): SRSRatingEventRecord {
  return {
    id: crypto.randomUUID(),
    userId: 'u1',
    entityType: 'topic_srs',
    topic: 'grammar:past simple',
    grade: 4,
    occurredAt: new Date(NOW - DAY).toISOString(),
    status: 'applied',
    createdAt: new Date(NOW - DAY).toISOString(),
    ...overrides,
  }
}

describe('aggregateTopicEvidence', () => {
  it('ignores topics below the minimum sample count', () => {
    const events = Array.from({ length: MIN_SAMPLES - 1 }, () => event({ grade: 1 }))
    expect(aggregateTopicEvidence(events, NOW)).toEqual([])
  })

  it('computes accuracy from passing vs failing grades', () => {
    const events = [
      event({ grade: 1 }),
      event({ grade: 2 }),
      event({ grade: 4 }),
      event({ grade: 5 }),
    ]
    const [row] = aggregateTopicEvidence(events, NOW)
    expect(row.total).toBe(4)
    expect(row.failed).toBe(2)
    expect(row.accuracy).toBe(50)
  })

  it('treats grade 2 as a failure and grade 3 as a pass', () => {
    const rows = aggregateTopicEvidence(
      [event({ grade: 3 }), event({ grade: 3 }), event({ grade: 2 })],
      NOW,
    )
    expect(rows[0].failed).toBe(1)
  })

  it('drops events outside the 30-day window', () => {
    const events = [
      event({ grade: 1, occurredAt: new Date(NOW - 40 * DAY).toISOString() }),
      event({ grade: 1 }),
      event({ grade: 1 }),
      event({ grade: 1 }),
    ]
    expect(aggregateTopicEvidence(events, NOW)[0].total).toBe(3)
  })

  it('ignores non-topic events and events without a topic', () => {
    const events = [
      event({ entityType: 'word_bank', topic: undefined }),
      event({ entityType: 'essential_words', topic: undefined }),
      event({ grade: 1 }),
      event({ grade: 1 }),
      event({ grade: 1 }),
    ]
    const rows = aggregateTopicEvidence(events, NOW)
    expect(rows).toHaveLength(1)
    expect(rows[0].total).toBe(3)
  })

  it('sorts weakest topic first', () => {
    const events = [
      ...Array.from({ length: 4 }, () => event({ topic: 'grammar:articles', grade: 5 })),
      ...Array.from({ length: 4 }, () => event({ topic: 'grammar:passive', grade: 1 })),
    ]
    const rows = aggregateTopicEvidence(events, NOW)
    expect(rows.map((r) => r.topicId)).toEqual(['grammar:passive', 'grammar:articles'])
  })

  it('leaves trend buckets without attempts as null rather than zero', () => {
    const events = Array.from({ length: 3 }, () => event({ grade: 5 }))
    const [row] = aggregateTopicEvidence(events, NOW)
    expect(row.trend.some((v) => v === null)).toBe(true)
    expect(row.trend.filter((v) => v !== null)).not.toContain(0)
  })

  it('places recent and old attempts in different trend buckets', () => {
    const events = [
      ...Array.from({ length: 2 }, () => event({ grade: 1, occurredAt: new Date(NOW - 28 * DAY).toISOString() })),
      ...Array.from({ length: 2 }, () => event({ grade: 5, occurredAt: new Date(NOW - 1 * DAY).toISOString() })),
    ]
    const [row] = aggregateTopicEvidence(events, NOW)
    const filled = row.trend.filter((v) => v !== null)
    expect(filled.length).toBeGreaterThanOrEqual(2)
    expect(filled[0]).toBe(0)
    expect(filled[filled.length - 1]).toBe(100)
  })

  it('discards events dated in the future', () => {
    const events = [
      event({ grade: 1, occurredAt: new Date(NOW + 5 * DAY).toISOString() }),
      event({ grade: 1 }),
      event({ grade: 1 }),
      event({ grade: 1 }),
    ]
    expect(aggregateTopicEvidence(events, NOW)[0].total).toBe(3)
  })

  it('ignores events with an unparseable date', () => {
    const events = [
      event({ grade: 1, occurredAt: 'not-a-date' }),
      event({ grade: 1 }),
      event({ grade: 1 }),
      event({ grade: 1 }),
    ]
    expect(aggregateTopicEvidence(events, NOW)[0].total).toBe(3)
  })
})

describe('trendDirection', () => {
  it('returns null when there is nothing to compare', () => {
    expect(trendDirection([null, null, null])).toBeNull()
    expect(trendDirection([50, null, null])).toBeNull()
  })

  it('detects improvement, decline and stability', () => {
    expect(trendDirection([40, null, 80])).toBe('up')
    expect(trendDirection([90, null, 50])).toBe('down')
    expect(trendDirection([60, null, 65])).toBe('flat')
  })
})
