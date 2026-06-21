import { describe, expect, it } from 'vitest'
import { buildAdaptiveSession, buildMixedSession } from '@/lib/phoneme-practice/mixed-session'
import type { MinimalPair, Sound, SoundWord } from '@/lib/phoneme-practice/types'

function sound(id: number, ipa: string): Sound {
  return {
    id,
    ipa,
    example: `We practice sound ${id}`,
    category: 'vowel',
    type: 'monophthong',
    difficulty: 1,
  }
}

function word(id: number, soundId: number, label: string): SoundWord {
  return {
    id,
    sound_id: soundId,
    word: label,
    ipa: `/${label}/`,
    audio_url: null,
    difficulty: 1,
    phonemes: null,
    sound_focus: null,
  }
}

describe('phoneme mixed sessions with bounded datasets', () => {
  it('buildMixedSession still emits every current exercise kind from target plus confusables', () => {
    const target = sound(1, '/ɪ/')
    const contrast = sound(2, '/iː/')
    const allSounds = [target, contrast]
    const targetWords = [word(1, 1, 'ship'), word(2, 1, 'sit'), word(3, 1, 'live')]
    const contrastWords = [word(4, 2, 'sheep'), word(5, 2, 'seat'), word(6, 2, 'leave')]
    const allWordsBySoundId = new Map([
      [1, targetWords],
      [2, contrastWords],
    ])
    const pairs: MinimalPair[] = [{
      id: 1,
      word_a: 'ship',
      word_b: 'sheep',
      ipa_a: '/ʃɪp/',
      ipa_b: '/ʃiːp/',
      sound_group: 'ship-sheep',
      contrast_ipa_a: '/ɪ/',
      contrast_ipa_b: '/iː/',
      contrast_sound_a_id: 1,
      contrast_sound_b_id: 2,
    }]

    const session = buildMixedSession(target, targetWords, allSounds, allWordsBySoundId, pairs)
    const phonemeTypes = new Set(
      session.filter((item) => item.kind === 'phoneme').map((item) => item.data.type),
    )

    expect(phonemeTypes).toEqual(new Set([
      'identify',
      'ax_same_different',
      'odd_one_out',
      'pick_word',
      'minimal_pair',
      'dictation',
    ]))
    expect(session.some((item) => item.kind === 'match_pairs')).toBe(true)
    expect(session.some((item) => item.kind === 'reorder_words')).toBe(true)
  })

  it('falls back cleanly when minimal pairs are missing from the bounded dataset', () => {
    const target = sound(1, '/ɪ/')
    const contrast = sound(2, '/iː/')
    const targetWords = [word(1, 1, 'ship'), word(2, 1, 'sit'), word(3, 1, 'live')]
    const allWordsBySoundId = new Map([
      [1, targetWords],
      [2, [word(4, 2, 'sheep')]],
    ])

    const session = buildAdaptiveSession(target, targetWords, [target, contrast], allWordsBySoundId, [])
    const minimalPairExercises = session.filter(
      (item) => item.kind === 'phoneme' && item.data.type === 'minimal_pair',
    )
    const pickWordExercises = session.filter(
      (item) => item.kind === 'phoneme' && item.data.type === 'pick_word',
    )

    expect(minimalPairExercises).toHaveLength(1)
    const fallbackExercise = minimalPairExercises[0]
    expect(fallbackExercise?.kind).toBe('phoneme')
    if (fallbackExercise?.kind === 'phoneme') {
      expect(fallbackExercise.data.synthetic).toBe(true)
    }
    expect(pickWordExercises.length).toBeGreaterThanOrEqual(1)
  })
})
