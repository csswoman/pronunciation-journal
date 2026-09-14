import { describe, expect, it } from 'vitest'
import type { Lesson } from '@/lib/types'
import {
  pickSoundLabPhraseRecommendation,
  type SoundLabPhraseCandidate,
} from '../recommended-phrase'
import { getSoundLabPhraseCandidates } from '../recommended-phrase-candidates'

const candidates: SoundLabPhraseCandidate[] = [
  {
    id: 'where',
    phrase: 'Where are you from?',
    ipa: '/wɛr ɑr ju frʌm/',
    meaning: '¿De dónde eres?',
    targetIpas: ['/ɹ/'],
  },
  {
    id: 'true',
    phrase: "That's true.",
    ipa: '/ðæts tru/',
    meaning: 'Es verdad.',
    targetIpas: ['/θ/', '/ð/'],
  },
]

function lesson(title: string): Lesson {
  return {
    id: title,
    title,
    description: '',
    category: 'pronunciation',
    difficulty: 'easy',
    words: [],
  }
}

describe('pickSoundLabPhraseRecommendation', () => {
  it('offers only chunks with an authored pronunciation target', () => {
    const authored = getSoundLabPhraseCandidates()

    expect(authored.length).toBeGreaterThan(0)
    expect(authored.every((candidate) => candidate.targetIpas.length > 0)).toBe(true)
    expect(authored.some((candidate) => candidate.phrase === 'Where are you from?')).toBe(true)
  })

  it('keeps the current sound but recommends it inside a phrase', () => {
    const result = pickSoundLabPhraseRecommendation(
      candidates,
      lesson('/ð/ — this'),
      new Map(),
    )

    expect(result?.id).toBe('true')
    expect(result?.reason).toContain('dentro de una frase')
  })

  it('uses the weakest practiced sound as a bounded fallback', () => {
    const result = pickSoundLabPhraseRecommendation(
      candidates,
      null,
      new Map([['/ɹ/', 55], ['/θ/', 20]]),
    )

    expect(result?.id).toBe('true')
  })

  it('falls back to an authored phrase without inventing evidence', () => {
    const result = pickSoundLabPhraseRecommendation(candidates, null, new Map())

    expect(result).toMatchObject({ id: 'where', phrase: 'Where are you from?' })
    expect(result?.reason).not.toContain('débil')
  })
})
