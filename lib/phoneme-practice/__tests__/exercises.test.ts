import { describe, expect, it } from 'vitest'
import type { Sound, SoundWord, MinimalPair } from '../types'
import {
  generatePickWord,
  generatePickSound,
  generateIdentify,
  generateAxSameDifferent,
  generateOddOneOut,
  generateAbx,
  generateMinimalPair,
} from '../exercises'

/**
 * These tests exercise the *thin-pool* paths: real decks routinely have sounds
 * with only one or two words, or no confusable neighbours loaded. A generator
 * must never emit an exercise whose answer key is wrong or whose stimuli are
 * unplayable — it should decline (empty options) so the caller can skip it.
 */

const TARGET: Sound = { id: 1, ipa: 'ɪ', example: 'ship', category: null, type: null, difficulty: 1 }
const OTHER: Sound = { id: 2, ipa: 'iː', example: 'sheep', category: null, type: null, difficulty: 1 }

function word(id: number, soundId: number, text: string, difficulty = 1): SoundWord {
  return {
    id,
    sound_id: soundId,
    word: text,
    ipa: null,
    audio_url: null,
    difficulty,
    phonemes: null,
    sound_focus: null,
  }
}

/** Run a randomized generator many times so probabilistic branches are covered. */
function repeat(n: number, fn: (i: number) => void) {
  for (let i = 0; i < n; i++) fn(i)
}

describe('generateIdentify', () => {
  it('never labels a target-sound word as "No" when no contrast words exist', () => {
    const targetWords = [word(1, 1, 'ship'), word(2, 1, 'sit')]
    // No words registered for any other sound → the "not target" branch has no pool.
    const emptyIndex = new Map<number, SoundWord[]>()

    repeat(100, () => {
      const ex = generateIdentify(TARGET, targetWords, [TARGET, OTHER], emptyIndex)
      if (ex.options.length === 0) return // declining is acceptable

      const saysYes = ex.correctIds.includes('yes')
      const usedTargetWord = targetWords.some((w) => w.word === ex.targetWord)
      // A word drawn from the target list must be scored "yes".
      if (usedTargetWord) expect(saysYes).toBe(true)
    })
  })

  it('scores a genuine contrast word as "No"', () => {
    const targetWords = [word(1, 1, 'ship')]
    const index = new Map<number, SoundWord[]>([[2, [word(9, 2, 'sheep')]]])

    repeat(100, () => {
      const ex = generateIdentify(TARGET, targetWords, [TARGET, OTHER], index)
      if (ex.options.length === 0) return
      if (ex.targetWord === 'sheep') expect(ex.correctIds).toEqual(['no'])
      if (ex.targetWord === 'ship') expect(ex.correctIds).toEqual(['yes'])
    })
  })
})

describe('generateOddOneOut', () => {
  it('keeps oddIndex pointing at the odd word even with a thin target pool', () => {
    const index = new Map<number, SoundWord[]>([[2, [word(9, 2, 'sheep')]]])

    // Only 1 target word available — splice position must stay in range.
    repeat(100, () => {
      const ex = generateOddOneOut(TARGET, [word(1, 1, 'ship')], [TARGET, OTHER], index)
      if (ex.options.length === 0) return
      expect(ex.oddIndex).toBeLessThan(ex.options.length)
      const marked = ex.options.filter((o) => o.isCorrect)
      expect(marked).toHaveLength(1)
      expect(ex.options[ex.oddIndex!].isCorrect).toBe(true)
      expect(ex.options[ex.oddIndex!].label).toBe('sheep')
    })
  })

  it('never emits blank stimuli or blank option labels', () => {
    const index = new Map<number, SoundWord[]>([[2, [word(9, 2, 'sheep')]]])
    repeat(100, () => {
      const ex = generateOddOneOut(TARGET, [word(1, 1, 'ship')], [TARGET, OTHER], index)
      for (const o of ex.options) expect(o.label).not.toBe('')
      for (const s of ex.stimuli ?? []) expect(s.word).not.toBe('')
    })
  })

  it('declines when there is no contrast word to be the odd one', () => {
    const ex = generateOddOneOut(TARGET, [word(1, 1, 'ship')], [TARGET], new Map())
    expect(ex.options).toEqual([])
  })
})

describe('generateAxSameDifferent', () => {
  it('never emits a stimulus with an empty word', () => {
    const index = new Map<number, SoundWord[]>([[2, [word(9, 2, 'sheep')]]])
    repeat(100, () => {
      const ex = generateAxSameDifferent(TARGET, [word(1, 1, 'ship')], [TARGET, OTHER], index)
      if (ex.options.length === 0) return
      expect(ex.stimuli).toHaveLength(2)
      for (const s of ex.stimuli!) expect(s.word).not.toBe('')
    })
  })

  it('does not claim "different" when both stimuli are the same word', () => {
    // Single target word and no contrast pool: a "different" trial is impossible.
    repeat(100, () => {
      const ex = generateAxSameDifferent(TARGET, [word(1, 1, 'ship')], [TARGET], new Map())
      if (ex.options.length === 0) return
      const [a, x] = ex.stimuli!
      if (a.word === x.word) expect(ex.correctIds).toEqual(['same'])
    })
  })
})

describe('generateAbx', () => {
  it('never emits blank stimuli when falling back without minimal pairs', () => {
    const index = new Map<number, SoundWord[]>([[2, [word(9, 2, 'sheep')]]])
    repeat(50, () => {
      const ex = generateAbx(TARGET, [word(1, 1, 'ship')], [TARGET, OTHER], index, [])
      if (ex.options.length === 0) return
      expect(ex.stimuli).toHaveLength(3)
      for (const s of ex.stimuli!) expect(s.word).not.toBe('')
    })
  })

  it('declines when A and B would be the same word', () => {
    // No contrast words at all → B would duplicate A, making the trial unanswerable.
    const ex = generateAbx(TARGET, [word(1, 1, 'ship')], [TARGET], new Map(), [])
    expect(ex.options).toEqual([])
  })
})

describe('generatePickWord', () => {
  it('never repeats the same surface form across options', () => {
    // Two distinct rows can carry the same spelling; options must stay unique.
    const targetWords = [word(1, 1, 'ship'), word(2, 1, 'ship'), word(3, 1, 'sit')]
    const index = new Map<number, SoundWord[]>([
      [2, [word(9, 2, 'sheep'), word(10, 2, 'sheep')]],
    ])
    repeat(100, () => {
      const ex = generatePickWord(TARGET, targetWords, [TARGET, OTHER], index)
      const labels = ex.options.map((o) => o.label)
      expect(new Set(labels).size).toBe(labels.length)
    })
  })

  it('never marks a distractor with the same spelling as a correct answer', () => {
    const targetWords = [word(1, 1, 'ship')]
    const index = new Map<number, SoundWord[]>([[2, [word(9, 2, 'ship')]]])
    repeat(100, () => {
      const ex = generatePickWord(TARGET, targetWords, [TARGET, OTHER], index)
      const correct = ex.options.filter((o) => o.isCorrect).map((o) => o.label)
      const wrong = ex.options.filter((o) => !o.isCorrect).map((o) => o.label)
      for (const label of wrong) expect(correct).not.toContain(label)
    })
  })

  it('always marks at least one correct option when it emits any', () => {
    const targetWords = [word(1, 1, 'ship'), word(2, 1, 'sit')]
    const index = new Map<number, SoundWord[]>([[2, [word(9, 2, 'sheep')]]])
    repeat(50, () => {
      const ex = generatePickWord(TARGET, targetWords, [TARGET, OTHER], index)
      if (ex.options.length === 0) return
      expect(ex.correctIds.length).toBeGreaterThan(0)
    })
  })
})

describe('generatePickSound', () => {
  it('never offers the same IPA label twice', () => {
    const dupe: Sound = { ...OTHER, id: 3 } // different row, identical ipa
    repeat(100, () => {
      const ex = generatePickSound(TARGET, [word(1, 1, 'ship')], [TARGET, OTHER, dupe])
      const labels = ex.options.map((o) => o.label)
      expect(new Set(labels).size).toBe(labels.length)
    })
  })

  it('declines when there is no target word to present', () => {
    const ex = generatePickSound(TARGET, [], [TARGET, OTHER])
    expect(ex.options).toEqual([])
  })
})

describe('generateMinimalPair', () => {
  it('declines rather than emitting a pair of identical words', () => {
    const pairs: MinimalPair[] = [
      {
        id: 1,
        word_a: 'ship',
        word_b: 'ship',
        ipa_a: null,
        ipa_b: null,
        sound_group: null,
        contrast_ipa_a: 'ɪ',
        contrast_ipa_b: 'iː',
        contrast_sound_a_id: 1,
        contrast_sound_b_id: 2,
      },
    ]
    const ex = generateMinimalPair(TARGET, pairs)
    expect(ex.options).toEqual([])
  })
})
