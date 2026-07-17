import { describe, it, expect } from 'vitest'
import type { PracticeExercise } from '@/lib/practice/types'
import { formatIpaDisplay, resolveSessionIpa } from '../resolve-session-ipa'

function phonemeExercise(ipa: string): PracticeExercise {
  return {
    id: '1',
    slug: 'pick_word',
    exerciseTypeId: 1,
    contentId: 'c1',
    context: 'daily',
    payload: {
      kind: 'phoneme',
      ipa,
      options: [],
      correctIds: [],
    },
  }
}

describe('resolveSessionIpa', () => {
  it('prefers soundIpa from config', () => {
    expect(resolveSessionIpa('/ŋ/', [phonemeExercise('/ɪ/')])).toBe('/ŋ/')
  })

  it('falls back to first phoneme exercise', () => {
    expect(resolveSessionIpa(undefined, [phonemeExercise('ŋ')])).toBe('ŋ')
  })

  it('returns undefined when no ipa is available', () => {
    expect(resolveSessionIpa(undefined, [])).toBeUndefined()
  })
})

describe('formatIpaDisplay', () => {
  it('wraps bare symbols in slashes', () => {
    expect(formatIpaDisplay('ŋ')).toBe('/ŋ/')
  })

  it('keeps already slashed ipa', () => {
    expect(formatIpaDisplay('/ɪ/')).toBe('/ɪ/')
  })
})
