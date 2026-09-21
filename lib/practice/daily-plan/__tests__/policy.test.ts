import { describe, expect, it } from 'vitest'
import { candidate, selectDailyCandidates } from '../policy'
import type { DailySelectionReason, DailyStep } from '@/lib/practice/types'

function step(id: string, reason: DailySelectionReason, target = id, capability?: 'network'): ReturnType<typeof candidate> {
  const value = {
    id, kind: 'concept', title: id, subtitle: '', icon: 'book', exercises: [], estMinutes: 1,
  } as DailyStep
  return candidate(value, {
    reason,
    targetRefs: [target],
    source: 'test',
    requiredCapability: capability,
  })
}

describe('daily candidate policy', () => {
  it('orders due, weak, route, saved, then variety deterministically', () => {
    const selected = selectDailyCandidates([
      step('variety', 'variety'), step('saved', 'saved_intent'), step('route', 'route_next'),
      step('weak', 'weak_target'), step('due', 'due'),
    ], { limit: 5 })
    expect(selected.map((entry) => entry.id)).toEqual(['due', 'weak', 'route', 'saved', 'variety'])
  })

  it('orders identically with no learner context (parity check)', () => {
    const selected = selectDailyCandidates([
      step('variety', 'variety'), step('saved', 'saved_intent'), step('route', 'route_next'),
      step('weak', 'weak_target'), step('due', 'due'),
    ], { limit: 5, context: {} })
    expect(selected.map((entry) => entry.id)).toEqual(['due', 'weak', 'route', 'saved', 'variety'])
  })

  it('prioritizes variety over new-word drilling for advanced learners (C1/C2)', () => {
    const selected = selectDailyCandidates([
      step('word', 'word_new'), step('variety', 'variety'),
    ], { limit: 2, context: { learnerLevel: 'c1' } })
    expect(selected.map((entry) => entry.id)).toEqual(['variety', 'word'])
  })

  it('applies the same advanced ordering for C2', () => {
    const selected = selectDailyCandidates([
      step('word', 'word_new'), step('variety', 'variety'),
    ], { limit: 2, context: { learnerLevel: 'c2' } })
    expect(selected.map((entry) => entry.id)).toEqual(['variety', 'word'])
  })

  it('keeps the default order for non-advanced levels', () => {
    const selected = selectDailyCandidates([
      step('word', 'word_new'), step('variety', 'variety'),
    ], { limit: 2, context: { learnerLevel: 'a2' } })
    expect(selected.map((entry) => entry.id)).toEqual(['word', 'variety'])
  })

  it('keeps a new chunk thread immediately after genuinely due work', () => {
    const selected = selectDailyCandidates([
      step('variety', 'variety'), step('chunk', 'chunk_new'), step('due', 'due'),
    ], { limit: 3 })
    expect(selected.map((entry) => entry.id)).toEqual(['due', 'chunk', 'variety'])
  })

  it('reserves a slot for new chunks so a review backlog cannot fill the plan', () => {
    // Regression: with 5 due steps and limit 5 the learner never saw new
    // material again — the plan became review-only and progress stalled.
    const selected = selectDailyCandidates([
      step('due-1', 'due'), step('due-2', 'due'), step('due-3', 'due'),
      step('due-4', 'due'), step('due-5', 'due'), step('chunk', 'chunk_new'),
    ], { limit: 5, reservedChunkNewSlots: 1 })
    expect(selected.map((entry) => entry.id)).toContain('chunk')
    expect(selected).toHaveLength(5)
  })

  it('returns reserved slots to the general pool when no new chunk exists', () => {
    const selected = selectDailyCandidates([
      step('due-1', 'due'), step('due-2', 'due'), step('due-3', 'due'),
    ], { limit: 3, reservedChunkNewSlots: 1 })
    expect(selected.map((entry) => entry.id)).toEqual(['due-1', 'due-2', 'due-3'])
  })

  it('keeps priority order even when a reserved slot was used', () => {
    const selected = selectDailyCandidates([
      step('variety', 'variety'), step('chunk', 'chunk_new'), step('due', 'due'),
    ], { limit: 3, reservedChunkNewSlots: 1 })
    expect(selected.map((entry) => entry.id)).toEqual(['due', 'chunk', 'variety'])
  })

  it('dedupes targets and caps saved intent without displacing due work', () => {
    const selected = selectDailyCandidates([
      step('saved-1', 'saved_intent'), step('due', 'due', 'same'), step('saved-same', 'saved_intent', 'same'),
      step('saved-2', 'saved_intent'), step('saved-3', 'saved_intent'),
    ], { limit: 5, maxSavedIntent: 2 })
    expect(selected.map((entry) => entry.id)).toEqual(['due', 'saved-1', 'saved-2'])
  })

  it('drops unavailable capabilities and never mutates candidate steps', () => {
    const online = step('online', 'route_next', 'target', 'network')
    const fallback = step('offline', 'variety')
    const selected = selectDailyCandidates([online, fallback], { limit: 2, availableCapabilities: new Set() })
    expect(selected.map((entry) => entry.id)).toEqual(['offline'])
    expect(online.step.selection).toBeUndefined()
  })
})
