import { describe, expect, it } from 'vitest'
import { classifyTouchedWord, tallyVocabularyBuckets } from '../ready-vocabulary'

describe('ready-vocabulary', () => {
  it('classifies mastered and mature as dominadas', () => {
    expect(classifyTouchedWord({ meaningStatus: 'review', vaultStatus: 'mastered' })).toBe('dominadas')
    expect(classifyTouchedWord({ meaningStatus: 'learning', mature: true })).toBe('dominadas')
  })

  it('maps skill statuses to the four buckets', () => {
    expect(classifyTouchedWord({ meaningStatus: 'unseen' })).toBe('nuevas')
    expect(classifyTouchedWord({ meaningStatus: 'learning' })).toBe('aprendiendo')
    expect(classifyTouchedWord({ meaningStatus: 'provisional' })).toBe('aprendiendo')
    expect(classifyTouchedWord({ meaningStatus: 'review' })).toBe('en_repaso')
  })

  it('falls back to legacy FSRS state', () => {
    expect(classifyTouchedWord({ meaningStatus: null, legacyState: 2 })).toBe('en_repaso')
    expect(classifyTouchedWord({ meaningStatus: null, legacyState: 1 })).toBe('aprendiendo')
    expect(classifyTouchedWord({ meaningStatus: null, legacyState: 0 })).toBe('nuevas')
  })

  it('tallies unique wordIds', () => {
    expect(
      tallyVocabularyBuckets([
        { wordId: 'c1k:a', bucket: 'nuevas' },
        { wordId: 'c1k:a', bucket: 'aprendiendo' },
        { wordId: 'c1k:b', bucket: 'en_repaso' },
        { wordId: 'c1k:c', bucket: 'dominadas' },
      ]),
    ).toEqual({ nuevas: 1, aprendiendo: 0, en_repaso: 1, dominadas: 1 })
  })
})
