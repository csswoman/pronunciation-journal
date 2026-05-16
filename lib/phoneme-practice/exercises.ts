import type { Exercise, ExerciseOptions, Option, Sound, SoundWord, MinimalPair } from './types'
import type { StageId } from './stages'
import { filterByCEFR, numericToCEFR } from './cefr'
import { pickConfusableIpas } from './phoneme-similarity'
import { IPA_EXTRA } from '@/lib/ipa-data'

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

function applyLevel<T extends { difficulty: number | null }>(
  words: T[],
  opts?: ExerciseOptions
): T[] {
  if (!opts?.maxLevel) return words
  const filtered = filterByCEFR(words, opts.maxLevel)
  return filtered.length > 0 ? filtered : words
}

function getConfusableSounds(
  targetSound: Sound,
  allSounds: Sound[],
  count: number
): Sound[] {
  const byIpa = new Map(allSounds.map(s => [s.ipa, s]))
  const ipas = allSounds.map(s => s.ipa)
  const picked = pickConfusableIpas(targetSound.ipa, ipas, count)
  return picked.map(ipa => byIpa.get(ipa)).filter((s): s is Sound => Boolean(s))
}

/**
 * pick_word: show the IPA symbol, choose which words contain that sound.
 * Distractor words come from phonetically similar sounds (e.g. /ɪ/ vs /iː/).
 */
export function generatePickWord(
  targetSound: Sound,
  targetWords: SoundWord[],
  allSounds: Sound[],
  allWordsBySoundId: Map<number, SoundWord[]>,
  opts?: ExerciseOptions
): Exercise {
  const correctCount = opts?.correctCount ?? 2
  const distractorCount = opts?.distractorCount ?? 2
  const leveled = applyLevel(targetWords, opts)
  const correctWords = pick(leveled, correctCount)

  const confusables = getConfusableSounds(targetSound, allSounds, 3)
  const distractorPool: SoundWord[] = []
  for (const sound of confusables) {
    const words = applyLevel(allWordsBySoundId.get(sound.id) ?? [], opts)
    distractorPool.push(...words)
  }
  // Backfill if confusable pool is too thin
  if (distractorPool.length < distractorCount) {
    const others = allSounds.filter(s => s.id !== targetSound.id)
    for (const sound of pick(others, 3)) {
      const words = applyLevel(allWordsBySoundId.get(sound.id) ?? [], opts)
      distractorPool.push(...words)
    }
  }
  const distractorWords = pick(distractorPool, distractorCount)

  const options: Option[] = shuffle([
    ...correctWords.map(w => ({ id: `c-${w.id}`, label: w.word, isCorrect: true })),
    ...distractorWords.map(w => ({ id: `d-${w.id}`, label: w.word, isCorrect: false })),
  ])

  const primaryLevel = numericToCEFR(correctWords[0]?.difficulty ?? null)

  return {
    type: 'pick_word',
    soundId: targetSound.id,
    ipa: targetSound.ipa,
    options,
    correctIds: options.filter(o => o.isCorrect).map(o => o.id),
    ...(primaryLevel ? { level: primaryLevel } : {}),
  }
}

/**
 * pick_sound: show/play a word, choose which IPA symbol it contains.
 * Distractor IPAs come from phonetically similar phonemes.
 */
export function generatePickSound(
  targetSound: Sound,
  targetWords: SoundWord[],
  allSounds: Sound[],
  opts?: ExerciseOptions
): Exercise {
  const distractorCount = opts?.distractorCount ?? 3
  const leveled = applyLevel(targetWords, opts)
  const [targetWord] = pick(leveled, 1)

  const distractors = getConfusableSounds(targetSound, allSounds, distractorCount)
  if (distractors.length < distractorCount) {
    const others = allSounds.filter(
      s => s.id !== targetSound.id && !distractors.some(d => d.id === s.id)
    )
    distractors.push(...pick(others, distractorCount - distractors.length))
  }

  const options: Option[] = shuffle([
    { id: `s-${targetSound.id}`, label: targetSound.ipa, isCorrect: true },
    ...distractors.map(s => ({ id: `s-${s.id}`, label: s.ipa, isCorrect: false })),
  ])

  const level = numericToCEFR(targetWord?.difficulty ?? null)

  return {
    type: 'pick_sound',
    soundId: targetSound.id,
    ipa: targetSound.ipa,
    targetWord: targetWord?.word,
    options,
    correctIds: [`s-${targetSound.id}`],
    ...(level ? { level } : {}),
  }
}

/**
 * minimal_pair: two words, one has the target sound — pick it.
 * Falls back to a synthetic pair from IPA_EXTRA when no DB pair exists.
 */
export function generateMinimalPair(
  targetSound: Sound,
  pairs: MinimalPair[]
): Exercise {
  const relevant = pairs.filter(
    p => p.contrast_sound_a_id === targetSound.id || p.contrast_sound_b_id === targetSound.id
  )

  if (relevant.length > 0) {
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

  // Fallback: synthesize from local IPA_EXTRA data
  const extra = IPA_EXTRA[targetSound.ipa]
  const synthPairs = extra?.minimalPairs ?? []
  if (synthPairs.length === 0) {
    // Last-resort placeholder so the caller never receives null
    return {
      type: 'minimal_pair',
      soundId: targetSound.id,
      ipa: targetSound.ipa,
      options: [],
      correctIds: [],
      synthetic: true,
    }
  }

  const synth = synthPairs[Math.floor(Math.random() * synthPairs.length)]
  const targetIsA = synth.phonemeA === targetSound.ipa
  const options: Option[] = shuffle([
    { id: 'a', label: synth.wordA, isCorrect: targetIsA },
    { id: 'b', label: synth.wordB, isCorrect: !targetIsA },
  ])

  return {
    type: 'minimal_pair',
    soundId: targetSound.id,
    ipa: targetSound.ipa,
    targetWord: targetIsA ? synth.wordA : synth.wordB,
    options,
    correctIds: options.filter(o => o.isCorrect).map(o => o.id),
    synthetic: true,
  }
}

/**
 * speak_word: TTS plays the target word, then user speaks it.
 * Evaluation is done client-side via SpeechRecognition.
 */
export function generateSpeakWord(
  targetSound: Sound,
  targetWords: SoundWord[],
  opts?: ExerciseOptions
): Exercise {
  const leveled = applyLevel(targetWords, opts)
  const [targetWord] = pick(leveled, 1)
  const level = numericToCEFR(targetWord?.difficulty ?? null)

  return {
    type: 'speak_word',
    soundId: targetSound.id,
    ipa: targetSound.ipa,
    targetWord: targetWord?.word,
    options: [],
    correctIds: [],
    ...(level ? { level } : {}),
  }
}

/**
 * dictation: TTS plays a word, user types it.
 */
export function generateDictation(
  targetSound: Sound,
  targetWords: SoundWord[],
  opts?: ExerciseOptions
): Exercise {
  const leveled = applyLevel(targetWords, opts)
  const [targetWord] = pick(leveled, 1)
  const level = numericToCEFR(targetWord?.difficulty ?? null)

  return {
    type: 'dictation',
    soundId: targetSound.id,
    ipa: targetSound.ipa,
    targetWord: targetWord?.word,
    options: [],
    correctIds: [],
    ...(level ? { level } : {}),
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
  pairs: MinimalPair[],
  opts?: ExerciseOptions
): Exercise[] {
  switch (stageId) {
    case 'speaking': {
      const exs: Exercise[] = []
      for (let i = 0; i < 6; i++) exs.push(generateSpeakWord(targetSound, targetWords, opts))
      return exs
    }
    case 'recognition': {
      const exs: Exercise[] = []
      for (let i = 0; i < 3; i++) exs.push(generatePickWord(targetSound, targetWords, allSounds, allWordsBySoundId, opts))
      for (let i = 0; i < 3; i++) exs.push(generatePickSound(targetSound, targetWords, allSounds, opts))
      return shuffle(exs)
    }
    case 'pairs': {
      const exs: Exercise[] = []
      for (let i = 0; i < 6; i++) {
        const ex = generateMinimalPair(targetSound, pairs)
        if (ex.options.length > 0) exs.push(ex)
      }
      return exs
    }
    case 'dictation': {
      const exs: Exercise[] = []
      for (let i = 0; i < 6; i++) exs.push(generateDictation(targetSound, targetWords, opts))
      return exs
    }
  }
}

/**
 * Build a full session: 2 pick_word + 2 pick_sound + 2 minimal_pair + 2 dictation.
 * Falls back to pick_word when minimal_pair has no data even after synthesis.
 */
export function buildSession(
  targetSound: Sound,
  targetWords: SoundWord[],
  allSounds: Sound[],
  allWordsBySoundId: Map<number, SoundWord[]>,
  pairs: MinimalPair[],
  opts?: ExerciseOptions
): Exercise[] {
  const exercises: Exercise[] = []

  for (let i = 0; i < 2; i++) {
    exercises.push(generatePickWord(targetSound, targetWords, allSounds, allWordsBySoundId, opts))
  }
  for (let i = 0; i < 2; i++) {
    exercises.push(generatePickSound(targetSound, targetWords, allSounds, opts))
  }
  for (let i = 0; i < 2; i++) {
    const ex = generateMinimalPair(targetSound, pairs)
    exercises.push(
      ex.options.length > 0
        ? ex
        : generatePickWord(targetSound, targetWords, allSounds, allWordsBySoundId, opts)
    )
  }
  for (let i = 0; i < 2; i++) {
    exercises.push(generateDictation(targetSound, targetWords, opts))
  }

  return exercises
}
