import type { Exercise, ExerciseOptions, Option, Sound, SoundWord, MinimalPair, AudioStimulus } from './types'
import { filterByCEFR, numericToCEFR } from './cefr'
import { pickConfusableIpas } from './phoneme-similarity'
import { IPA_EXTRA, type FinalConsonantPair } from '@/lib/pronunciation/ipa-data'

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
    exerciseType: { domain: 'pronunciation', mode: 'multiple_choice', variant: 'pick_word' },
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
    exerciseType: { domain: 'pronunciation', mode: 'multiple_choice', variant: 'pick_sound' },
    soundId: targetSound.id,
    ipa: targetSound.ipa,
    targetWord: targetWord?.word,
    options,
    correctIds: [`s-${targetSound.id}`],
    ...(level ? { level } : {}),
  }
}

type NormalizedPair = { wordA: string; wordB: string; targetIsA: boolean; synthetic: boolean }

function normalizeDbPair(pair: MinimalPair, targetSoundId: number): NormalizedPair {
  const targetIsA = pair.contrast_sound_a_id === targetSoundId
  return { wordA: pair.word_a, wordB: pair.word_b, targetIsA, synthetic: false }
}

function normalizeSynthPair(synth: { phonemeA: string; wordA: string; wordB: string }, targetIpa: string): NormalizedPair {
  return { wordA: synth.wordA, wordB: synth.wordB, targetIsA: synth.phonemeA === targetIpa, synthetic: true }
}

/**
 * minimal_pair: two words, one has the target sound — pick it.
 * Merges DB pairs and IPA_EXTRA pairs for a larger token pool.
 */
export function generateMinimalPair(
  targetSound: Sound,
  pairs: MinimalPair[]
): Exercise {
  const dbPairs = pairs
    .filter(p => p.contrast_sound_a_id === targetSound.id || p.contrast_sound_b_id === targetSound.id)
    .map(p => normalizeDbPair(p, targetSound.id))

  const extra = IPA_EXTRA[targetSound.ipa]
  const synthPairs = (extra?.minimalPairs ?? []).map(s => normalizeSynthPair(s, targetSound.ipa))

  // Prefer DB pairs but include synth pairs to widen the pool
  const pool = dbPairs.length > 0 ? [...dbPairs, ...synthPairs] : synthPairs

  if (pool.length === 0) {
    return {
      type: 'minimal_pair',
      exerciseType: { domain: 'pronunciation', mode: 'multiple_choice', variant: 'minimal_pair' },
      soundId: targetSound.id,
      ipa: targetSound.ipa,
      options: [],
      correctIds: [],
      synthetic: true,
    }
  }

  const chosen = pool[Math.floor(Math.random() * pool.length)]
  const options: Option[] = shuffle([
    { id: 'a', label: chosen.wordA, isCorrect: chosen.targetIsA },
    { id: 'b', label: chosen.wordB, isCorrect: !chosen.targetIsA },
  ])

  return {
    type: 'minimal_pair',
    exerciseType: { domain: 'pronunciation', mode: 'multiple_choice', variant: 'minimal_pair' },
    soundId: targetSound.id,
    ipa: targetSound.ipa,
    targetWord: chosen.targetIsA ? chosen.wordA : chosen.wordB,
    options,
    correctIds: options.filter(o => o.isCorrect).map(o => o.id),
    ...(chosen.synthetic ? { synthetic: true } : {}),
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
    exerciseType: { domain: 'pronunciation', mode: 'speak', variant: 'phoneme' },
    soundId: targetSound.id,
    ipa: targetSound.ipa,
    targetWord: targetWord?.word,
    options: [],
    correctIds: [],
    ...(level ? { level } : {}),
  }
}

/**
 * identify: hear a word, confirm whether it contains the target phoneme (yes/no).
 * Good for A1/A2 — minimal cognitive load.
 */
export function generateIdentify(
  targetSound: Sound,
  targetWords: SoundWord[],
  allSounds: Sound[],
  allWordsBySoundId: Map<number, SoundWord[]>,
  opts?: ExerciseOptions
): Exercise {
  const leveled = applyLevel(targetWords, opts)
  // 50% chance the test word actually has the target sound
  const useTarget = Math.random() < 0.5
  let testWord: SoundWord | undefined

  if (useTarget) {
    ;[testWord] = pick(leveled, 1)
  } else {
    const confusables = getConfusableSounds(targetSound, allSounds, 2)
    const pool: SoundWord[] = []
    for (const s of confusables) pool.push(...(allWordsBySoundId.get(s.id) ?? []))
    ;[testWord] = pick(pool.length > 0 ? pool : leveled, 1)
  }

  const isCorrect = useTarget
  const options: Option[] = [
    { id: 'yes', label: 'Sí', isCorrect },
    { id: 'no', label: 'No', isCorrect: !isCorrect },
  ]

  return {
    type: 'identify',
    exerciseType: { domain: 'pronunciation', mode: 'multiple_choice', variant: 'identify' },
    soundId: targetSound.id,
    ipa: targetSound.ipa,
    targetWord: testWord?.word,
    options,
    correctIds: [isCorrect ? 'yes' : 'no'],
  }
}

/**
 * ax_same_different: play A then X, decide if they share the target phoneme (same/different).
 * A1/A2 discrimination — 2-stimulus.
 */
export function generateAxSameDifferent(
  targetSound: Sound,
  targetWords: SoundWord[],
  allSounds: Sound[],
  allWordsBySoundId: Map<number, SoundWord[]>,
  opts?: ExerciseOptions
): Exercise {
  const leveled = applyLevel(targetWords, opts)
  const same = Math.random() < 0.5

  const [wordA] = pick(leveled, 1)
  let wordX: SoundWord | undefined

  if (same) {
    // Pick a different word with the same sound
    const others = leveled.filter(w => w.id !== wordA?.id)
    ;[wordX] = pick(others.length > 0 ? others : leveled, 1)
  } else {
    const confusables = getConfusableSounds(targetSound, allSounds, 2)
    const pool: SoundWord[] = []
    for (const s of confusables) pool.push(...(allWordsBySoundId.get(s.id) ?? []))
    ;[wordX] = pick(pool.length > 0 ? pool : leveled, 1)
  }

  const stimuli: AudioStimulus[] = [
    { word: wordA?.word ?? '', ipa: targetSound.ipa },
    { word: wordX?.word ?? '', ipa: same ? targetSound.ipa : (allSounds.find(s => allWordsBySoundId.get(s.id)?.some(w => w.id === wordX?.id))?.ipa ?? '') },
  ]

  const options: Option[] = [
    { id: 'same', label: 'Igual', isCorrect: same },
    { id: 'diff', label: 'Diferente', isCorrect: !same },
  ]

  return {
    type: 'ax_same_different',
    exerciseType: { domain: 'pronunciation', mode: 'multiple_choice', variant: 'ax_same_different' },
    soundId: targetSound.id,
    ipa: targetSound.ipa,
    stimuli,
    options,
    correctIds: [same ? 'same' : 'diff'],
  }
}

/**
 * odd_one_out: 4 words, 3 share the target phoneme, 1 is the odd one.
 * A1/A2 discrimination.
 */
export function generateOddOneOut(
  targetSound: Sound,
  targetWords: SoundWord[],
  allSounds: Sound[],
  allWordsBySoundId: Map<number, SoundWord[]>,
  opts?: ExerciseOptions
): Exercise {
  const leveled = applyLevel(targetWords, opts)
  const targetSample = pick(leveled, 3)

  const confusables = getConfusableSounds(targetSound, allSounds, 2)
  const pool: SoundWord[] = []
  for (const s of confusables) pool.push(...(allWordsBySoundId.get(s.id) ?? []))
  const [oddWord] = pick(pool.length > 0 ? pool : leveled, 1)

  const oddIndex = Math.floor(Math.random() * 4)
  const allWords = [...targetSample]
  allWords.splice(oddIndex, 0, oddWord!)

  const stimuli: AudioStimulus[] = allWords.map((w, i) => ({
    word: w?.word ?? '',
    ipa: i === oddIndex ? '' : targetSound.ipa,
  }))

  const options: Option[] = allWords.map((w, i) => ({
    id: String(i),
    label: w?.word ?? '',
    isCorrect: i === oddIndex,
  }))

  return {
    type: 'odd_one_out',
    exerciseType: { domain: 'pronunciation', mode: 'multiple_choice', variant: 'odd_one_out' },
    soundId: targetSound.id,
    ipa: targetSound.ipa,
    stimuli,
    options,
    correctIds: [String(oddIndex)],
    oddIndex,
  }
}

/**
 * abx: hear A, B, then X — decide if X matches A or B.
 * B1+ only (high working-memory load).
 */
export function generateAbx(
  targetSound: Sound,
  targetWords: SoundWord[],
  allSounds: Sound[],
  allWordsBySoundId: Map<number, SoundWord[]>,
  pairs: MinimalPair[],
  opts?: ExerciseOptions
): Exercise {
  const leveled = applyLevel(targetWords, opts)

  // Try to use a minimal pair for A/B
  const soundPairs = pairs.filter(
    p => p.contrast_sound_a_id === targetSound.id || p.contrast_sound_b_id === targetSound.id
  )

  let wordA: string
  let wordB: string
  let ipaB: string

  if (soundPairs.length > 0) {
    const chosen = soundPairs[Math.floor(Math.random() * soundPairs.length)]
    const targetIsA = chosen.contrast_sound_a_id === targetSound.id
    wordA = targetIsA ? chosen.word_a : chosen.word_b
    wordB = targetIsA ? chosen.word_b : chosen.word_a
    ipaB = targetIsA ? (chosen.contrast_ipa_b ?? '') : (chosen.contrast_ipa_a ?? '')
  } else {
    // Fallback: pick from confusables
    const confusables = getConfusableSounds(targetSound, allSounds, 1)
    const confusableWords = allWordsBySoundId.get(confusables[0]?.id ?? 0) ?? []
    const [wA] = pick(leveled, 1)
    const [wB] = pick(confusableWords.length > 0 ? confusableWords : leveled, 1)
    wordA = wA?.word ?? ''
    wordB = wB?.word ?? ''
    ipaB = confusables[0]?.ipa ?? ''
  }

  // X matches either A or B randomly
  const xMatchesA = Math.random() < 0.5
  const xText = xMatchesA ? wordA : wordB

  const stimuli: AudioStimulus[] = [
    { word: wordA, ipa: targetSound.ipa },
    { word: wordB, ipa: ipaB },
    { word: xText, ipa: xMatchesA ? targetSound.ipa : ipaB },
  ]

  const options: Option[] = [
    { id: 'a', label: 'A', isCorrect: xMatchesA },
    { id: 'b', label: 'B', isCorrect: !xMatchesA },
  ]

  return {
    type: 'abx',
    exerciseType: { domain: 'pronunciation', mode: 'multiple_choice', variant: 'abx' },
    soundId: targetSound.id,
    ipa: targetSound.ipa,
    stimuli,
    options,
    correctIds: [xMatchesA ? 'a' : 'b'],
    abxAnswer: xMatchesA ? 0 : 1,
  }
}

/**
 * Returns all final-consonant pairs for a sound, derived from IPA_EXTRA.
 * Never invents data — returns empty if no finalConsonantPairs defined.
 */
export function getFinalConsonantPairs(ipa: string): FinalConsonantPair[] {
  return IPA_EXTRA[ipa]?.finalConsonantPairs ?? []
}

/**
 * final_consonant_minimal_pair: two words differing only in the final voiced/voiceless
 * consonant — pick the one that ends with the target phoneme.
 * Directly addresses Spanish-speaker devoicing of final stops and fricatives.
 */
export function generateFinalConsonantMinimalPair(
  targetSound: Sound
): Exercise {
  const pairs = getFinalConsonantPairs(targetSound.ipa)

  if (pairs.length === 0) {
    return {
      type: 'minimal_pair',
      exerciseType: { domain: 'pronunciation', mode: 'multiple_choice', variant: 'minimal_pair' },
      soundId: targetSound.id,
      ipa: targetSound.ipa,
      options: [],
      correctIds: [],
      synthetic: true,
      syllablePosition: 'final',
    }
  }

  const chosen = pairs[Math.floor(Math.random() * pairs.length)]
  const targetIsVoiced = chosen.voicedIpa === targetSound.ipa
  const targetWord = targetIsVoiced ? chosen.wordVoiced : chosen.wordVoiceless
  const otherWord = targetIsVoiced ? chosen.wordVoiceless : chosen.wordVoiced

  const options: Option[] = shuffle([
    { id: 'target', label: targetWord, isCorrect: true },
    { id: 'other', label: otherWord, isCorrect: false },
  ])

  return {
    type: 'minimal_pair',
    exerciseType: { domain: 'pronunciation', mode: 'multiple_choice', variant: 'minimal_pair' },
    soundId: targetSound.id,
    ipa: targetSound.ipa,
    targetWord,
    options,
    correctIds: options.filter(o => o.isCorrect).map(o => o.id),
    syllablePosition: 'final',
  }
}

/**
 * final_consonant_ax: two words, decide if they end with the same consonant voicing.
 * Same/different discrimination focused on final position.
 */
export function generateFinalConsonantAx(
  targetSound: Sound
): Exercise {
  const pairs = getFinalConsonantPairs(targetSound.ipa)

  // Fallback to a same-same trial if no pairs
  if (pairs.length === 0) {
    const options: Option[] = [
      { id: 'same', label: 'Igual', isCorrect: true },
      { id: 'diff', label: 'Diferente', isCorrect: false },
    ]
    return {
      type: 'ax_same_different',
      exerciseType: { domain: 'pronunciation', mode: 'multiple_choice', variant: 'ax_same_different' },
      soundId: targetSound.id,
      ipa: targetSound.ipa,
      stimuli: [],
      options,
      correctIds: ['same'],
      synthetic: true,
      syllablePosition: 'final',
    }
  }

  const same = Math.random() < 0.5
  const chosen = pairs[Math.floor(Math.random() * pairs.length)]

  let wordA: string
  let wordX: string
  let ipaA: string
  let ipaX: string

  if (same) {
    // Both end with the target IPA
    const targetIsVoiced = chosen.voicedIpa === targetSound.ipa
    wordA = targetIsVoiced ? chosen.wordVoiced : chosen.wordVoiceless
    ipaA = targetSound.ipa
    // Pick a different pair if available, else same word
    const other = pairs.filter(p => p !== chosen)
    const alt = other.length > 0 ? other[Math.floor(Math.random() * other.length)] : chosen
    wordX = targetIsVoiced ? alt.wordVoiced : alt.wordVoiceless
    ipaX = targetSound.ipa
  } else {
    // A ends with target, X ends with contrast
    const targetIsVoiced = chosen.voicedIpa === targetSound.ipa
    wordA = targetIsVoiced ? chosen.wordVoiced : chosen.wordVoiceless
    ipaA = targetSound.ipa
    wordX = targetIsVoiced ? chosen.wordVoiceless : chosen.wordVoiced
    ipaX = targetIsVoiced ? chosen.voicelessIpa : chosen.voicedIpa
  }

  const stimuli: AudioStimulus[] = [
    { word: wordA, ipa: ipaA },
    { word: wordX, ipa: ipaX },
  ]

  const options: Option[] = [
    { id: 'same', label: 'Igual', isCorrect: same },
    { id: 'diff', label: 'Diferente', isCorrect: !same },
  ]

  return {
    type: 'ax_same_different',
    exerciseType: { domain: 'pronunciation', mode: 'multiple_choice', variant: 'ax_same_different' },
    soundId: targetSound.id,
    ipa: targetSound.ipa,
    stimuli,
    options,
    correctIds: [same ? 'same' : 'diff'],
    syllablePosition: 'final',
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
    exerciseType: { domain: 'pronunciation', mode: 'dictation', variant: 'phoneme' },
    soundId: targetSound.id,
    ipa: targetSound.ipa,
    targetWord: targetWord?.word,
    options: [],
    correctIds: [],
    ...(level ? { level } : {}),
  }
}
