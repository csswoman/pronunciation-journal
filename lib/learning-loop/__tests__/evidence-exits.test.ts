import { describe, expect, it } from 'vitest'
import { vi } from 'vitest'

vi.mock('server-only', () => ({}))

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

  it('declares the answer and session writers used by the immersion quiz', async () => {
    const manifest = await buildLearningContentManifest()
    const immersion = manifest.find((entry) => entry.surface === 'immersion' && entry.practice.status === 'objective')
    expect(immersion?.owners).toEqual(['immersion_lesson_progress', 'activity_sessions'])
    expect(EVIDENCE_EXIT_CONTRACTS.find((contract) => contract.adapter === 'immersion_quiz'))
      .toMatchObject({
        answerWriter: 'savePracticeAnswer',
        sessionWriter: 'recordActivitySession',
        domainWriter: 'immersion_lesson_progress',
      })
  }, 30_000)
})
