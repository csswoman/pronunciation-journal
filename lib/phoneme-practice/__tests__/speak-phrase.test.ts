import { describe, expect, it } from 'vitest'
import { generateSpeakPhrase } from '@/lib/phoneme-practice/exercises'
import type { Sound, SoundWord } from '@/lib/phoneme-practice/types'

function sound(id: number, ipa: string): Sound {
  return { id, ipa, example: null, category: 'vowel', type: 'monophthong', difficulty: 1 }
}

function word(id: number, soundId: number, label: string): SoundWord {
  return { id, sound_id: soundId, word: label, ipa: `/${label}/`, audio_url: null, difficulty: 1, phonemes: null, sound_focus: null }
}

describe('generateSpeakPhrase', () => {
  it('wraps the target word in a fixed carrier phrase', () => {
    const target = sound(1, '/ɪ/')
    const targetWords = [word(1, 1, 'ship')]

    const ex = generateSpeakPhrase(target, targetWords)

    expect(ex.type).toBe('speak_word')
    expect(ex.targetWord).toContain('ship')
    // A carrier phrase is more than the bare word — it's an actual short phrase.
    expect(ex.targetWord?.trim().split(/\s+/).length).toBeGreaterThan(1)
  })

  it('returns undefined targetWord when there are no words to draw from', () => {
    const target = sound(1, '/ɪ/')
    const ex = generateSpeakPhrase(target, [])
    expect(ex.targetWord).toBeUndefined()
  })

  it('carries the sound id and ipa like other phoneme exercises', () => {
    const target = sound(7, '/θ/')
    const ex = generateSpeakPhrase(target, [word(1, 7, 'think')])
    expect(ex.soundId).toBe(7)
    expect(ex.ipa).toBe('/θ/')
  })
})
