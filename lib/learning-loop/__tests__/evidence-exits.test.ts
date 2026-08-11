import { describe, expect, it } from 'vitest'
import { buildLearningContentManifest } from '../content-manifest'
import { auditEvidenceExits, EVIDENCE_EXIT_CONTRACTS } from '../evidence-exits'

describe('learning-loop evidence exits', () => {
  it('gives every practicable adapter one declared answer/session exit', async () => {
    expect(auditEvidenceExits(await buildLearningContentManifest())).toEqual([])
  })

  it('does not register duplicate adapter owners', () => {
    expect(new Set(EVIDENCE_EXIT_CONTRACTS.map((contract) => contract.adapter)).size)
      .toBe(EVIDENCE_EXIT_CONTRACTS.length)
  })
})
