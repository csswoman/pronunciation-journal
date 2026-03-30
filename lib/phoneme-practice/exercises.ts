import type { Exercise, Option, Sound, SoundWord, MinimalPair } from './types'
import type { StageId } from './stages'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pick<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n)
}

/**
 * pick_word: show the IPA symbol, choose which words contain that sound.
 * 2 correct words from targetSound, 2 distractors from another random sound.
 */
export function generatePickWord(
  targetSound: Sound,
  targetWords: SoundWord[],
  allSounds: Sound[],
  allWordsBySoundId: Map<number, SoundWord[]>
): Exercise {
  const correctWords = pick(targetWords, 2)

  // Pick a distractor sound (different category preferred, else any other)
  const distractors = allSounds.filter(s => s.id !== targetSound.id)
  const distractor = distractors[Math.floor(Math.random() * distractors.length)]
  const distractorWords = pick(allWordsBySoundId.get(distractor.id) ?? [], 2)

  const options: Option[] = shuffle([
    ...correctWords.map(w => ({ id: `c-${w.id}`, label: w.word, isCorrect: true })),
    ...distractorWords.map(w => ({ id: `d-${w.id}`, label: w.word, isCorrect: false })),
  ])

  return {
    type: 'pick_word',
    soundId: targetSound.id,
    ipa: targetSound.ipa,
    options,
    correctIds: options.filter(o => o.isCorrect).map(o => o.id),
  }
}

/**
 * pick_sound: show/play a word, choose which IPA symbol it contains.
 * 1 target word, 4 IPA options (1 correct + 3 distractors).
 */
export function generatePickSound(
  targetSound: Sound,
  targetWords: SoundWord[],
  allSounds: Sound[]
): Exercise {
  const [targetWord] = pick(targetWords, 1)

  const distractors = pick(
    allSounds.filter(s => s.id !== targetSound.id),
    3
  )

  const options: Option[] = shuffle([
    { id: `s-${targetSound.id}`, label: targetSound.ipa, isCorrect: true },
    ...distractors.map(s => ({ id: `s-${s.id}`, label: s.ipa, isCorrect: false })),
  ])

  return {
    type: 'pick_sound',
    soundId: targetSound.id,
    ipa: targetSound.ipa,
    targetWord: targetWord?.word,
    options,
    correctIds: [`s-${targetSound.id}`],
  }
}

/**
 * minimal_pair: two words, one has the target sound — pick it.
 */
export function generateMinimalPair(
  targetSound: Sound,
  pairs: MinimalPair[]
): Exercise | null {
  const relevant = pairs.filter(
    p => p.contrast_sound_a_id === targetSound.id || p.contrast_sound_b_id === targetSound.id
  )
  if (relevant.length === 0) return null

  const pair = relevant[Math.floor(Math.random() * relevant.length)]
  const targetIsA = pair.contrast_sound_a_id === targetSound.id

  const options: Option[] = shuffle([
    { id: 'a', label: pair.word_a, isCorrect: targetIsA },
    { id: 'b', label: pair.word_b, isCorrect: !targetIsA },
  ])

  return {
    type: 'minimal_pair',
    soundId: targetSound.id,
    ipa: targetSound.ipa,
    targetWord: targetIsA ? pair.word_a : pair.word_b,
    options,
    correctIds: options.filter(o => o.isCorrect).map(o => o.id),
  }
}

/**
 * dictation: TTS plays a word, user types it.
 */
export function generateDictation(
  targetSound: Sound,
  targetWords: SoundWord[]
): Exercise {
  const [targetWord] = pick(targetWords, 1)

  return {
    type: 'dictation',
    soundId: targetSound.id,
    ipa: targetSound.ipa,
    targetWord: targetWord?.word,
    options: [],
    correctIds: [],
  }
}

/**
 * Build a session for a specific stage only.
 * recognition: 3 pick_word + 3 pick_sound (shuffled)
 * pairs: up to 6 minimal_pair exercises
 * dictation: 6 dictation exercises
 */
export function buildStageSession(
  stageId: StageId,
  targetSound: Sound,
  targetWords: SoundWord[],
  allSounds: Sound[],
  allWordsBySoundId: Map<number, SoundWord[]>,
  pairs: MinimalPair[]
): Exercise[] {
  switch (stageId) {
    case 'recognition': {
      const exs: Exercise[] = []
      for (let i = 0; i < 3; i++) exs.push(generatePickWord(targetSound, targetWords, allSounds, allWordsBySoundId))
      for (let i = 0; i < 3; i++) exs.push(generatePickSound(targetSound, targetWords, allSounds))
      return shuffle(exs)
    }
    case 'pairs': {
      const exs: Exercise[] = []
      for (let i = 0; i < 6; i++) {
        const ex = generateMinimalPair(targetSound, pairs)
        if (ex) exs.push(ex)
      }
      return exs.length > 0 ? exs : []
    }
    case 'dictation': {
      const exs: Exercise[] = []
      for (let i = 0; i < 6; i++) exs.push(generateDictation(targetSound, targetWords))
      return exs
    }
  }
}

/**
 * Build a full session: 2 pick_word + 2 pick_sound + 2 minimal_pair + 2 dictation.
 * Falls back to pick_word when minimal_pair has no data.
 */
export function buildSession(
  targetSound: Sound,
  targetWords: SoundWord[],
  allSounds: Sound[],
  allWordsBySoundId: Map<number, SoundWord[]>,
  pairs: MinimalPair[]
): Exercise[] {
  const exercises: Exercise[] = []

  for (let i = 0; i < 2; i++) {
    exercises.push(generatePickWord(targetSound, targetWords, allSounds, allWordsBySoundId))
  }
  for (let i = 0; i < 2; i++) {
    exercises.push(generatePickSound(targetSound, targetWords, allSounds))
  }
  for (let i = 0; i < 2; i++) {
    const ex = generateMinimalPair(targetSound, pairs)
    exercises.push(
      ex ?? generatePickWord(targetSound, targetWords, allSounds, allWordsBySoundId)
    )
  }
  for (let i = 0; i < 2; i++) {
    exercises.push(generateDictation(targetSound, targetWords))
  }

  return exercises
}
