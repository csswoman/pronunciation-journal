import { describe, expect, it } from 'vitest'
import {
  PRONUNCIATION_TARGETS,
  contrastIdToTargetId,
  contrastTargetId,
  getTarget,
  resolvePrerequisiteChain,
  targetIdToContrastId,
  validateRegistry,
  validateTarget,
} from '../registry'
import type { PronunciationTarget } from '../types'

describe('PRONUNCIATION_TARGETS registry integrity', () => {
  it('has unique ids across all targets', () => {
    const ids = Object.values(PRONUNCIATION_TARGETS).map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every target key matches its own id', () => {
    for (const [key, target] of Object.entries(PRONUNCIATION_TARGETS)) {
      expect(key).toBe(target.id)
    }
  })

  it('has no cycles and no missing prerequisites', () => {
    expect(validateRegistry()).toEqual([])
  })

  it('produces a deterministic prerequisite chain ordering', () => {
    const first = resolvePrerequisiteChain('connected.elision' as PronunciationTarget['id'])
    const second = resolvePrerequisiteChain('connected.elision' as PronunciationTarget['id'])
    expect(first).toEqual(second)
    expect(first.length).toBeGreaterThan(0)
  })

  it('canonicalizes contrast pair order regardless of argument order', () => {
    expect(contrastTargetId('/θ/', '/ð/')).toBe(contrastTargetId('/ð/', '/θ/'))
  })

  it('gives every masteryEligible target at least one objective evidence capability', () => {
    for (const target of Object.values(PRONUNCIATION_TARGETS)) {
      if (!target.masteryEligible) continue
      const hasObjective = target.evidenceCapabilities.some(
        (c) => c === 'stt_intelligibility' || c === 'acoustic'
      )
      expect(hasObjective, `${target.id} is masteryEligible but has no objective capability`).toBe(true)
    }
  })

  it('has no target claiming the unavailable acoustic capability', () => {
    for (const target of Object.values(PRONUNCIATION_TARGETS)) {
      expect(target.evidenceCapabilities, `${target.id} claims acoustic`).not.toContain('acoustic')
    }
  })
})

describe('getTarget', () => {
  it('returns ok:true for a known id', () => {
    const result = getTarget('prosody.word-stress')
    expect(result.ok).toBe(true)
  })

  it('returns a typed not_found error for an unknown id, never a silent fallback', () => {
    const result = getTarget('segmental.phoneme.nonexistent')
    expect(result).toEqual({ ok: false, error: { kind: 'not_found', id: 'segmental.phoneme.nonexistent' } })
  })
})

describe('legacy contrast_id adapter', () => {
  it('round-trips a canonical contrast_id through the adapter', () => {
    const contrastId = 'θ|ð'
    const targetId = contrastIdToTargetId(contrastId)
    expect(targetIdToContrastId(targetId)).toBe(contrastId)
  })

  it('returns null when adapting a non-contrast target id', () => {
    expect(targetIdToContrastId('prosody.word-stress' as PronunciationTarget['id'])).toBeNull()
  })
})

describe('validateTarget', () => {
  const base: PronunciationTarget = {
    id: 'segmental.phoneme./x/' as PronunciationTarget['id'],
    category: 'segmental.phoneme',
    label: 'fixture',
    recommendedCefr: 'A1',
    prerequisites: [],
    evidenceCapabilities: ['stt_intelligibility'],
    masteryEligible: true,
  }

  it('accepts a valid fixture target declaring stt_intelligibility', () => {
    expect(validateTarget(base)).toEqual([])
  })

  it('rejects a fixture target that claims the unavailable acoustic capability', () => {
    const invalid: PronunciationTarget = { ...base, evidenceCapabilities: ['acoustic'] }
    const issues = validateTarget(invalid)
    expect(issues.some((i) => i.code === 'unavailable_capability')).toBe(true)
  })

  it('rejects a masteryEligible target with no objective evidence capability', () => {
    const invalid: PronunciationTarget = { ...base, evidenceCapabilities: ['perception'] }
    const issues = validateTarget(invalid)
    expect(issues.some((i) => i.code === 'no_objective_capability')).toBe(true)
  })

  it('rejects a target referencing a missing prerequisite', () => {
    const invalid: PronunciationTarget = { ...base, prerequisites: ['segmental.phoneme./nope/' as PronunciationTarget['id']] }
    const issues = validateTarget(invalid)
    expect(issues.some((i) => i.code === 'missing_prerequisite')).toBe(true)
  })

  it('rejects a self-referencing cycle', () => {
    const invalid: PronunciationTarget = { ...base, prerequisites: [base.id] }
    const issues = validateTarget(invalid)
    expect(issues.some((i) => i.code === 'cycle')).toBe(true)
  })

  it('rejects a contrast target whose id does not match the canonical pair', () => {
    const invalid: PronunciationTarget = {
      ...base,
      id: 'segmental.contrast.wrong-id' as PronunciationTarget['id'],
      category: 'segmental.contrast',
      contrastPair: ['/θ/', '/ð/'],
    }
    const issues = validateTarget(invalid)
    expect(issues.some((i) => i.code === 'invalid_contrast_pair')).toBe(true)
  })

})
