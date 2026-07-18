import { describe, expect, it } from 'vitest'
import { buildWordsBySoundId } from '@/lib/phoneme-practice/session-data'
import type { SoundWord } from '@/lib/phoneme-practice/types'

function word(partial: Partial<SoundWord> & Pick<SoundWord, 'id' | 'sound_id' | 'word'>): SoundWord {
  return {
    ipa: null,
    audio_url: null,
    difficulty: 1,
    phonemes: null,
    sound_focus: null,
    ...partial,
  }
}

describe('buildWordsBySoundId', () => {
  it('keeps the first row when the same lemma is duplicated for a sound', () => {
    const grouped = buildWordsBySoundId([
      word({ id: 1, sound_id: 5, word: 'grass', ipa: '/ɡræs/' }),
      word({ id: 2, sound_id: 5, word: 'car', ipa: '/kɑr/' }),
      word({ id: 3, sound_id: 5, word: 'grass', ipa: '/ɡræs/' }),
      word({ id: 4, sound_id: 15, word: 'shoulder', ipa: '/ˈʃoʊldər/' }),
      word({ id: 5, sound_id: 15, word: 'shoulder', ipa: '/ˈʃoʊldər/' }),
    ])

    expect(grouped.get(5)?.map((w) => w.id)).toEqual([1, 2])
    expect(grouped.get(15)?.map((w) => w.id)).toEqual([4])
  })

  it('treats lemma matches as case-insensitive', () => {
    const grouped = buildWordsBySoundId([
      word({ id: 1, sound_id: 1, word: 'Go' }),
      word({ id: 2, sound_id: 1, word: 'go' }),
    ])

    expect(grouped.get(1)?.map((w) => w.word)).toEqual(['Go'])
  })
})
