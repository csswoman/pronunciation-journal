import { describe, expect, it } from 'vitest'
import { conceptMasteryBySkill, summarizeConceptEvidence } from '../concept-evidence'
import type { ConceptEvidenceItem } from '@/lib/courses/concept-profile'

const evidence = (count: number, taskSkill: ConceptEvidenceItem['taskSkill']): ConceptEvidenceItem[] =>
  Array.from({ length: count }, (_, i) => ({ attemptId: `${taskSkill}-${i}`, contentId: `${i}`,
    taskSkill, correct: true, at: '2026-09-27T12:00:00Z' }))

describe('concept skill boundaries', () => {
  it('does not pool three listening and two reading answers into mastery', () => {
    const items = [...evidence(3, 'listening'), ...evidence(2, 'reading')]
    expect(summarizeConceptEvidence(items).status).toBe('review')
    expect(conceptMasteryBySkill(items)).toEqual({
      listening: { correct: 3, total: 3, status: 'review' },
      reading: { correct: 2, total: 2, status: 'review' },
    })
  })
  it('preserves mastery in one skill without declaring mastery in the other', () => {
    const items = [...evidence(5, 'grammar'), ...evidence(1, 'listening')]
    expect(summarizeConceptEvidence(items).status).toBe('review')
    expect(conceptMasteryBySkill(items)?.grammar?.status).toBe('mastered')
    expect(conceptMasteryBySkill(items)?.listening?.status).toBe('review')
  })
  it('does not relabel legacy unattributed answers as authored skill evidence', () => {
    expect(summarizeConceptEvidence([...evidence(4, undefined), ...evidence(1, 'grammar')]).status).toBe('review')
  })
})
