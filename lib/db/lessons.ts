import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { formatIpaDisplay } from '@/lib/lexicon/format-ipa'
import {
  CANONICAL_SOUNDS,
  canonicalizeSoundIpa,
  getCanonicalSound,
} from '@/lib/sounds/inventory'

export interface DbSound {
  id: number
  ipa: string
  type: 'vowel' | 'consonant' | 'diphthong'
  category: string | null
  example: string | null
  difficulty: number | null
}

export interface DbWord {
  id: number
  word: string
  ipa: string | null
  sound_id: number | null
  difficulty: number | null
  audio_url: string | null
  sound_focus: string | null
}

function orderWordsByCanonicalExamples(phoneme: typeof CANONICAL_SOUNDS[number], words: DbWord[]): DbWord[] {
  const wordsByKey = new Map(words.map((word) => [word.word.toLowerCase(), word]))
  const canonicalWords = phoneme.examples
    .map((example) => wordsByKey.get(example.toLowerCase()))
    .filter((word): word is DbWord => Boolean(word))
  const canonicalKeys = new Set(canonicalWords.map((word) => word.word.toLowerCase()))

  return [
    ...canonicalWords,
    ...words.filter((word) => !canonicalKeys.has(word.word.toLowerCase())),
  ]
}

function supabase() {
  return getSupabaseBrowserClient()
}

export async function getAllSoundsWithWords(): Promise<{ sound: DbSound; words: DbWord[] }[]> {
  const [soundsRes, wordsRes] = await Promise.all([
    supabase().from('sounds').select('id, ipa, type, category, example, difficulty').order('id'),
    supabase().from('words').select('id, word, ipa, sound_id, difficulty, audio_url, sound_focus'),
  ])
  if (soundsRes.error) throw soundsRes.error
  if (wordsRes.error) throw wordsRes.error

  const sounds = soundsRes.data as DbSound[]
  const words = wordsRes.data as DbWord[]

  // Normalize and group words immediately after the Supabase read. This keeps
  // sound identity separate from a word's full pronunciation transcription.
  const wordsBySound = new Map<number, DbWord[]>()
  const seenBySound = new Map<number, Set<string>>()
  for (const word of words) {
    if (word.sound_id == null) continue
    const key = word.word.toLowerCase()
    const seen = seenBySound.get(word.sound_id) ?? new Set<string>()
    if (seen.has(key)) continue
    seen.add(key)
    seenBySound.set(word.sound_id, seen)
    const soundFocus = word.sound_focus && getCanonicalSound(word.sound_focus)
      ? canonicalizeSoundIpa(word.sound_focus)
      : word.sound_focus
    const normalizedWord = soundFocus === word.sound_focus
      ? word
      : { ...word, sound_focus: soundFocus }
    wordsBySound.set(word.sound_id, [
      ...(wordsBySound.get(word.sound_id) ?? []),
      normalizedWord,
    ])
  }

  const mergedByIpa = new Map<
    string,
    { sound: DbSound; words: DbWord[]; isCanonicalSource: boolean }
  >()

  for (const rawSound of sounds) {
    const canonicalIpa = canonicalizeSoundIpa(rawSound.ipa)
    const canonicalSound = getCanonicalSound(canonicalIpa)
    if (!canonicalSound) continue

    const normalizedSound: DbSound = {
      ...rawSound,
      ipa: canonicalIpa,
      // The canonical inventory owns taxonomy; Supabase enriches it.
      type: canonicalSound.type,
    }
    const candidateWords = wordsBySound.get(rawSound.id) ?? []
    const candidateIsCanonical = formatIpaDisplay(rawSound.ipa) === canonicalIpa
    const existing = mergedByIpa.get(canonicalIpa)

    if (!existing) {
      mergedByIpa.set(canonicalIpa, {
        sound: normalizedSound,
        words: candidateWords,
        isCanonicalSource: candidateIsCanonical,
      })
      continue
    }

    const wordsByKey = new Map<string, DbWord>()
    for (const word of [...existing.words, ...candidateWords]) {
      wordsByKey.set(word.word.toLowerCase(), word)
    }

    mergedByIpa.set(canonicalIpa, {
      sound: candidateIsCanonical && !existing.isCanonicalSource
        ? normalizedSound
        : existing.sound,
      words: [...wordsByKey.values()],
      isCanonicalSource: existing.isCanonicalSource || candidateIsCanonical,
    })
  }

  // The canonical inventory owns count, order, and class. A sound enters the
  // catalog only after aliases have been merged and it has enough examples.
  return CANONICAL_SOUNDS.flatMap((phoneme) => {
    const entry = mergedByIpa.get(phoneme.symbol)
    return entry && entry.words.length >= 3
      ? [{
          sound: {
            ...entry.sound,
            // The canonical inventory owns the learner-facing anchor. The
            // database value remains available for enrichment, but cannot
            // reintroduce a lexical-set title such as "father" or "grass".
            example: phoneme.examples[0] ?? entry.sound.example,
          },
          words: orderWordsByCanonicalExamples(phoneme, entry.words),
        }]
      : []
  })
}
