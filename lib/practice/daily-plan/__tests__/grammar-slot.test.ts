import { describe, it, expect } from 'vitest'
import { selectDailyCandidates, candidate } from '@/lib/practice/daily-plan/policy'
import type { DailyStep } from '@/lib/practice/types'

function step(id: string, kind: DailyStep['kind']): DailyStep {
  return {
    kind,
    id,
    title: id,
    subtitle: '',
    icon: 'Sparkles',
    exercises: [],
    estMinutes: 2,
  } as DailyStep
}

describe('grammar slot priority', () => {
  it('keeps the grammar step even when lower-priority steps are plentiful', () => {
    const candidates = [
      candidate(step('variety-1', 'connected_speech'), {
        reason: 'variety', targetRefs: [], source: 'connected_speech',
      }),
      candidate(step('variety-2', 'false_friends'), {
        reason: 'variety', targetRefs: [], source: 'false_friends',
      }),
      candidate(step('variety-3', 'reader'), {
        reason: 'variety', targetRefs: [], source: 'reader',
      }),
      candidate(step('grammar_focus:x', 'grammar_focus'), {
        reason: 'grammar_slot', targetRefs: [], source: 'grammar_focus',
      }),
    ]

    const selected = selectDailyCandidates(candidates, { limit: 2 })
    expect(selected.map((s) => s.id)).toContain('grammar_focus:x')
  })

  it('still lets due SRS work outrank the grammar slot', () => {
    const candidates = [
      candidate(step('due-1', 'word_review'), {
        reason: 'due', targetRefs: [], source: 'word_review',
      }),
      candidate(step('grammar_focus:x', 'grammar_focus'), {
        reason: 'grammar_slot', targetRefs: [], source: 'grammar_focus',
      }),
    ]
    const selected = selectDailyCandidates(candidates, { limit: 1 })
    expect(selected[0]!.id).toBe('due-1')
  })
})
