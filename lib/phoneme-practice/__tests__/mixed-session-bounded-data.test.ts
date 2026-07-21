import { describe, expect, it } from 'vitest'
import { buildAdaptiveSession, buildMixedSession } from '@/lib/phoneme-practice/mixed-session'
import type { MinimalPair, Sound, SoundWord, UserContrastProgress } from '@/lib/phoneme-practice/types'

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

  it('never schedules speak_word for a brand-new contrast with no prior evidence', () => {
    const target = sound(1, '/ɪ/')
    const contrast = sound(2, '/iː/')
    const targetWords = [word(1, 1, 'ship'), word(2, 1, 'sit'), word(3, 1, 'live')]
    const allWordsBySoundId = new Map([
      [1, targetWords],
      [2, [word(4, 2, 'sheep')]],
    ])

    const session = buildAdaptiveSession(target, targetWords, [target, contrast], allWordsBySoundId, [])
    const speakWordExercises = session.filter(
      (item) => item.kind === 'phoneme' && item.data.type === 'speak_word',
    )

    expect(speakWordExercises).toHaveLength(0)
  })

  it('schedules speak_word once prior contrast evidence exists', () => {
    const target = sound(1, '/ɪ/')
    const contrast = sound(2, '/iː/')
    const targetWords = [word(1, 1, 'ship'), word(2, 1, 'sit'), word(3, 1, 'live')]
    const allWordsBySoundId = new Map([
      [1, targetWords],
      [2, [word(4, 2, 'sheep')]],
    ])
    // /ɪ/'s confusables are /iː/, /ɛ/, /ə/ (see PHONEME_CONFUSION). Mark the
    // other two mastered so weakestContrastIpa's "unmastered first" ordering
    // actually selects /iː/ as the focus contrast.
    const mastered = (id: string, contrastId: string): UserContrastProgress => ({
      id,
      user_id: 'u1',
      contrast_id: contrastId,
      ease_factor: 2.5,
      interval_days: 30,
      next_review: null,
      last_seen: new Date().toISOString(),
      total_attempts: 20,
      correct_answers: 19,
      streak: 10,
      mastery_pct: 95,
    })
    const contrastProgress: UserContrastProgress[] = [
      {
        id: 'p1',
        user_id: 'u1',
        contrast_id: '/iː/|/ɪ/',
        ease_factor: 2.5,
        interval_days: 1,
        next_review: null,
        last_seen: new Date().toISOString(),
        total_attempts: 4,
        correct_answers: 3,
        streak: 2,
        mastery_pct: 40,
      },
      mastered('p2', '/ɛ/|/ɪ/'),
      mastered('p3', '/ə/|/ɪ/'),
    ]

    const session = buildAdaptiveSession(
      target, targetWords, [target, contrast], allWordsBySoundId, [],
      { contrastProgress },
    )
    const speakExercises = session.filter(
      (item) => item.kind === 'phoneme' && item.data.type === 'speak_word',
    )

    // Word production, then phrase production — both scheduled together.
    expect(speakExercises).toHaveLength(2)
    for (const ex of speakExercises) {
      expect(ex.kind).toBe('phoneme')
      if (ex.kind === 'phoneme') expect(ex.data.contrastId).toBe('/iː/|/ɪ/')
    }
    const wordOnly = speakExercises.filter(
      (item) => item.kind === 'phoneme' && item.data.targetWord?.trim().split(/\s+/).length === 1,
    )
    const phraseOnly = speakExercises.filter(
      (item) => item.kind === 'phoneme' && (item.data.targetWord?.trim().split(/\s+/).length ?? 0) > 1,
    )
    expect(wordOnly).toHaveLength(1)
    expect(phraseOnly).toHaveLength(1)
  })

  it('does not add speak_word for an already-mastered contrast', () => {
    const target = sound(1, '/ɪ/')
    const contrast = sound(2, '/iː/')
    const targetWords = [word(1, 1, 'ship'), word(2, 1, 'sit'), word(3, 1, 'live')]
    const allWordsBySoundId = new Map([
      [1, targetWords],
      [2, [word(4, 2, 'sheep')]],
    ])
    const mastered = (id: string, contrastId: string): UserContrastProgress => ({
      id,
      user_id: 'u1',
      contrast_id: contrastId,
      ease_factor: 2.5,
      interval_days: 30,
      next_review: null,
      last_seen: new Date().toISOString(),
      total_attempts: 20,
      correct_answers: 19,
      streak: 10,
      mastery_pct: 95,
    })
    // All of /ɪ/'s confusables are mastered, so the focus contrast itself
    // resolves to a mastered one — no speak_word should be scheduled.
    const contrastProgress: UserContrastProgress[] = [
      mastered('p1', '/iː/|/ɪ/'),
      mastered('p2', '/ɛ/|/ɪ/'),
      mastered('p3', '/ə/|/ɪ/'),
    ]

    const session = buildAdaptiveSession(
      target, targetWords, [target, contrast], allWordsBySoundId, [],
      { contrastProgress },
    )
    const speakWordExercises = session.filter(
      (item) => item.kind === 'phoneme' && item.data.type === 'speak_word',
    )

    // Mastered contrasts don't need more scheduled production in this mix.
    expect(speakWordExercises).toHaveLength(0)
  })
})
