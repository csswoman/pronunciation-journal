import { PHONEME_CONFUSION } from './phoneme-similarity'
import type { MinimalPair, Sound, SoundWord } from './types'

export const SESSION_WORD_LIMIT_PER_SOUND = 16

export interface PhonemeSessionDataset {
  targetSound: Sound
  sounds: Sound[]
  wordsBySoundId: Map<number, SoundWord[]>
  minimalPairs: MinimalPair[]
}

/**
 * Groups words by sound, keeping the first row per (sound_id, word) pair.
 * Seed re-runs left duplicate rows in `public.words`; without this, React lists
 * keyed by word text warn and sessions over-weight the same lemma.
 */
export function buildWordsBySoundId(words: SoundWord[]): Map<number, SoundWord[]> {
  const grouped = new Map<number, SoundWord[]>()
  const seen = new Map<number, Set<string>>()

  for (const word of words) {
    const key = word.word.toLowerCase()
    const seenForSound = seen.get(word.sound_id) ?? new Set<string>()
    if (seenForSound.has(key)) continue
    seenForSound.add(key)
    seen.set(word.sound_id, seenForSound)

    const bucket = grouped.get(word.sound_id) ?? []
    bucket.push(word)
    grouped.set(word.sound_id, bucket)
  }

  return grouped
}

export function limitWordsBySoundId(
  wordsBySoundId: Map<number, SoundWord[]>,
  limitPerSound: number = SESSION_WORD_LIMIT_PER_SOUND,
): Map<number, SoundWord[]> {
  if (limitPerSound <= 0) return new Map()

  return new Map(
    [...wordsBySoundId.entries()].map(([soundId, words]) => [soundId, words.slice(0, limitPerSound)]),
  )
}

export function getSessionCandidateIpas(targetIpa: string): string[] {
  const confusables = PHONEME_CONFUSION[targetIpa] ?? []
  return [targetIpa, ...confusables]
}

export function getSessionCandidateSoundIds(targetSound: Sound, sounds: Sound[]): number[] {
  const allowedIpas = new Set(getSessionCandidateIpas(targetSound.ipa))
  return sounds.filter((sound) => allowedIpas.has(sound.ipa)).map((sound) => sound.id)
}
