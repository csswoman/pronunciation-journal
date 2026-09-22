import { describe, expect, it } from 'vitest'
import { buildLearningContentManifest } from '../content-manifest'
import { auditEvidenceExits, EVIDENCE_EXIT_CONTRACTS } from '../evidence-exits'

describe('learning-loop evidence exits', () => {
  it('gives every practicable adapter one declared answer/session exit', async () => {
    expect(auditEvidenceExits(await buildLearningContentManifest())).toEqual([])
  }, 30_000)

  it('does not register duplicate adapter owners', () => {
    expect(new Set(EVIDENCE_EXIT_CONTRACTS.map((contract) => contract.adapter)).size)
      .toBe(EVIDENCE_EXIT_CONTRACTS.length)
  })

  it('attributes immersion to its persisted progress row, not an unwritten activity session', async () => {
    const manifest = await buildLearningContentManifest()
    const immersion = manifest.find((entry) => entry.surface === 'immersion' && entry.practice.status === 'activity_only')
    expect(immersion?.owners).toEqual(['immersion_lesson_progress'])
    expect(EVIDENCE_EXIT_CONTRACTS.find((contract) => contract.adapter === 'immersion_quiz'))
      .toMatchObject({ domainWriter: 'immersion_lesson_progress', sessionWriter: null })
  }, 30_000)
})
