import { describe, expect, it } from 'vitest'
import { deriveWordProgressSignal } from '../progress-state'

const base = { srs_status: 'review', familiarity_status: 'unknown', mastery_provenance: 'none', objective_evidence_count: 0 }

describe('word progress signals', () => {
  it.each([
    ['saved', { ...base }],
    ['familiar', { ...base, familiarity_status: 'familiar' }],
    ['objective_evidence', { ...base, objective_evidence_count: 1 }],
    ['mastered', { ...base, srs_status: 'mastered', mastery_provenance: 'objective', objective_evidence_count: 2 }],
    ['legacy_mastered', { ...base, srs_status: 'mastered', mastery_provenance: 'legacy_self_report' }],
  ] as const)('keeps %s distinct from the other signals', (expected, entry) => {
    expect(deriveWordProgressSignal(entry)).toBe(expected)
  })
})
