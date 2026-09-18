import { describe, expect, it } from 'vitest'
import { summarizeEssentialWordsProgress } from '../progress-summary'

describe('summarizeEssentialWordsProgress', () => {
  it('counts distinct studied and due words from learning item schedules', () => {
    const summary = summarizeEssentialWordsProgress([
      {
        wordId: 'c1k:the',
        schedule: { kind: 'provisional', dueAt: '2026-09-16T00:00:00.000Z', source: 'direct', evidenceConfidence: 1 },
        suspended: false,
      },
      {
        wordId: 'c1k:the',
        schedule: { kind: 'fsrs', dueAt: '2026-09-16T00:00:00.000Z', stability: 2, difficulty: 5, state: 'Learning' },
        suspended: false,
      },
      {
        wordId: 'c1k:be',
        schedule: { kind: 'fsrs', dueAt: '2026-09-20T00:00:00.000Z', stability: 5, difficulty: 4, state: 'Review' },
        suspended: false,
      },
      { wordId: 'c1k:of', schedule: { kind: 'none' }, suspended: false },
    ], new Date('2026-09-17T00:00:00.000Z'))

    expect(summary).toEqual({ studiedWords: 2, dueWords: 1, dueItems: 2 })
  })

  it('excludes suspended and out-of-scope items from due counts', () => {
    const summary = summarizeEssentialWordsProgress([
      {
        wordId: 'c1k:the',
        schedule: { kind: 'provisional', dueAt: '2026-09-16T00:00:00.000Z', source: 'direct', evidenceConfidence: 1 },
        suspended: true,
      },
      {
        wordId: 'c1k:be',
        schedule: { kind: 'provisional', dueAt: '2026-09-16T00:00:00.000Z', source: 'direct', evidenceConfidence: 1 },
        suspended: false,
      },
    ], new Date('2026-09-17T00:00:00.000Z'), new Set(['c1k:the']))

    expect(summary).toEqual({ studiedWords: 1, dueWords: 0, dueItems: 0 })
  })
})
