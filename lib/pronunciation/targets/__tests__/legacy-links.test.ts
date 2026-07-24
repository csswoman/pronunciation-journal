import { describe, expect, it } from 'vitest'
import {
  resolveLegacyContrastPair,
  resolveLegacyIpaToken,
  resolveLegacySoundList,
} from '../legacy-links'
import { phonemeTargetId, contrastTargetId } from '../registry'

describe('resolveLegacyIpaToken', () => {
  it('resolves a known phoneme token to its target id deterministically', () => {
    const first = resolveLegacyIpaToken('ə')
    const second = resolveLegacyIpaToken('ə')
    expect(first).toEqual(second)
    expect(first.targetId).toBe(phonemeTargetId('/ə/'))
  })

  it('returns null targetId for an unresolvable token, never a guessed fallback', () => {
    const result = resolveLegacyIpaToken('zzz-not-a-phoneme')
    expect(result.targetId).toBeNull()
  })
})

describe('resolveLegacyContrastPair', () => {
  it('round-trips regardless of argument order', () => {
    const a = resolveLegacyContrastPair('/θ/', '/ð/')
    const b = resolveLegacyContrastPair('/ð/', '/θ/')
    expect(a.targetId).toBe(b.targetId)
    expect(a.targetId).toBe(contrastTargetId('/θ/', '/ð/'))
  })
})

describe('resolveLegacySoundList', () => {
  it('throws outside production when any token is unresolved', () => {
    expect(() => resolveLegacySoundList(['ə', 'not-a-real-token'])).toThrow(/unresolved legacy sound tokens/)
  })

  it('resolves a fully-known list without throwing', () => {
    const result = resolveLegacySoundList(['ə'])
    expect(result).toEqual([{ raw: 'ə', targetId: phonemeTargetId('/ə/') }])
  })
})
