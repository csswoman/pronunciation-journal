import { describe, expect, it } from 'vitest'
import { projectProgress, type ProgressFact } from '../projections'

const fact = (overrides: Partial<ProgressFact>): ProgressFact => ({
  id: 'fact-1',
  signal: 'exposure',
  occurredAt: '2026-08-10T10:00:00.000Z',
  provenance: 'test',
  ...overrides,
})

describe('projectProgress', () => {
  it('keeps save, read and completion out of the learning projection', () => {
    const result = projectProgress([
      fact({ id: 'saved', signal: 'intent', provenance: 'word_bank.save' }),
      fact({ id: 'read', signal: 'exposure', provenance: 'lesson.open' }),
      fact({ id: 'done', signal: 'completion', provenance: 'lesson_completions' }),
    ])
    expect(result.coverage).toEqual({ encountered: 2, completed: 1 })
    expect(result.learning.evidencedTargets).toBe(0)
    expect(result.learning.evidence).toEqual([])
  })

  it('retains provenance and modality for objective and transfer evidence', () => {
    const result = projectProgress([
      fact({ id: 'a1', signal: 'objective_evidence', targetId: 'topic:past', correct: true, provenance: 'answer_history', modality: 'contextual_use' }),
      fact({ id: 'a2', signal: 'transfer', targetId: 'pronunciation:target-1', correct: true, provenance: 'oral_mission', modality: 'stt_intelligibility' }),
    ])
    expect(result.learning.evidencedTargets).toBe(2)
    expect(result.learning.transferTargets).toBe(1)
    expect(result.learning.evidence[0]).toMatchObject({ provenance: 'answer_history', modality: 'contextual_use' })
  })

  it('moves a target back to review when its latest owner evidence declines', () => {
    const result = projectProgress([
      fact({ id: 'older', signal: 'objective_evidence', targetId: 'word:one', correct: true, occurredAt: '2026-08-09T10:00:00.000Z' }),
      fact({ id: 'newer', signal: 'objective_evidence', targetId: 'word:one', correct: false, occurredAt: '2026-08-10T10:00:00.000Z' }),
    ])
    expect(result.learning.evidencedTargets).toBe(0)
    expect(result.learning.reviewTargets).toBe(1)
  })

  it('counts coherent sessions separately from learning', () => {
    const result = projectProgress([
      fact({ id: 'session-1', exercises: 5, durationMs: 90_000 }),
      fact({ id: 'session-2', exercises: 0, durationMs: 30_000 }),
    ])
    expect(result.activity).toEqual({ sessions: 2, exercises: 5, durationMs: 120_000, activeDays: 1 })
    expect(result.learning.evidencedTargets).toBe(0)
  })
})
