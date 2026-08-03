import type { Exercise, ExerciseOptions, Option, Sound, SoundWord, MinimalPair, AudioStimulus } from './types'
import type { ExerciseVariant } from '@/lib/exercises/taxonomy'
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
 * Words whose sound differs from the target — the only safe source of
 * "not the target phoneme" material.
 *
 * Discrimination exercises (identify / AX / odd-one-out / ABX) score the
 * learner against the *claim* that a word lacks the target sound. Falling back
 * to target words when the confusable pool is empty produces an exercise whose
 * answer key is wrong, so this returns an empty array instead and callers
 * decline. Excludes words whose spelling collides with a target word, since an
 * identical surface form gives the learner no decidable question.
 */
function getContrastWords(
  targetSound: Sound,
  targetWords: SoundWord[],
  allSounds: Sound[],
  allWordsBySoundId: Map<number, SoundWord[]>,
  opts?: ExerciseOptions
): SoundWord[] {
  const targetSpellings = new Set(targetWords.map(w => w.word.toLowerCase()))
  const confusables = getConfusableSounds(targetSound, allSounds, 3)
  const ordered = [
    ...confusables,
    ...allSounds.filter(s => s.id !== targetSound.id && !confusables.some(c => c.id === s.id)),
  ]

  const pool: SoundWord[] = []
  for (const sound of ordered) {
    if (sound.id === targetSound.id) continue
    for (const w of applyLevel(allWordsBySoundId.get(sound.id) ?? [], opts)) {
      if (w.sound_id === targetSound.id) continue
      if (targetSpellings.has(w.word.toLowerCase())) continue
      pool.push(w)
    }
  }
  return pool
}

/** IPA of the sound a word belongs to, for stimulus labelling. */
function ipaForWord(word: SoundWord | undefined, allSounds: Sound[]): string {
  if (!word) return ''
  return allSounds.find(s => s.id === word.sound_id)?.ipa ?? ''
}

/** Distinct-by-spelling, preserving order. */
function uniqueByWord(words: SoundWord[]): SoundWord[] {
  const seen = new Set<string>()
  return words.filter(w => {
    const key = w.word.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/** An exercise carrying no options — the caller should skip it. */
function declined(
  type: Exercise['type'],
  variant: ExerciseVariant,
  targetSound: Sound,
  extra: Partial<Exercise> = {}
): Exercise {
  return {
    type,
    exerciseType: { domain: 'pronunciation', mode: 'multiple_choice', variant },
    soundId: targetSound.id,
    ipa: targetSound.ipa,
    options: [],
    correctIds: [],
    ...extra,
  }
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
  // Distinct spellings only: two rows sharing a spelling would render as
  // duplicate options, one of which is scored wrong.
  const correctWords = pick(uniqueByWord(leveled), correctCount)
  if (correctWords.length === 0) return declined('pick_word', 'pick_word', targetSound)

  // Contrast words only — a distractor that also contains the target sound
  // would be marked wrong despite being a valid answer.
  const distractorPool = uniqueByWord(
    getContrastWords(targetSound, correctWords, allSounds, allWordsBySoundId, opts)
  )
  const distractorWords = pick(distractorPool, distractorCount)
  if (distractorWords.length === 0) return declined('pick_word', 'pick_word', targetSound)

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
  // Without a word to present there is no question to ask.
  if (!targetWord) return declined('pick_sound', 'pick_sound', targetSound)

  const confusables = getConfusableSounds(targetSound, allSounds, distractorCount)
  const backfill = allSounds.filter(
    s => s.id !== targetSound.id && !confusables.some(d => d.id === s.id)
  )
  // Dedupe by IPA: distinct sound rows can share a symbol, which would render
  // the same label twice with only one marked correct.
  const seenIpa = new Set([targetSound.ipa])
  const distractors: Sound[] = []
  for (const s of [...confusables, ...shuffle(backfill)]) {
    if (distractors.length >= distractorCount) break
    if (seenIpa.has(s.ipa)) continue
    seenIpa.add(s.ipa)
    distractors.push(s)
  }
  if (distractors.length === 0) return declined('pick_sound', 'pick_sound', targetSound)

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

  // Prefer DB pairs but include synth pairs to widen the pool.
  // A pair whose two sides share a spelling is not a minimal pair — it renders
  // as the same word twice with one side arbitrarily marked wrong.
  const pool = (dbPairs.length > 0 ? [...dbPairs, ...synthPairs] : synthPairs).filter(
    p => p.wordA.toLowerCase() !== p.wordB.toLowerCase()
  )

  if (pool.length === 0) {
    return declined('minimal_pair', 'minimal_pair', targetSound, { synthetic: true })
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
 * Fixed carrier phrases for controlled phrase-level production — a standard
 * phonetics technique: wrap a target word in a short, always-grammatical
 * frame so the learner produces a real (if generic) phrase, not just an
 * isolated word. There is no per-contrast example-sentence content in the
 * DB today, so a carrier phrase avoids either fabricating a possibly
 * nonsensical sentence from two random words or blocking phrase production
 * entirely on missing content.
 */
const CARRIER_PHRASES = [
  (word: string) => `Say ${word} again.`,
  (word: string) => `I said ${word}.`,
  (word: string) => `Can you hear the word ${word}?`,
] as const

/**
 * speak_word (phrase variant): TTS plays a short carrier phrase built around
 * the target word, then the user speaks the whole phrase. Reuses the
 * speak_word type/renderer — SpeakScoredExercise compares against whatever
 * text is in targetWord, whether that's one word or a short phrase.
 */
export function generateSpeakPhrase(
  targetSound: Sound,
  targetWords: SoundWord[],
  opts?: ExerciseOptions
): Exercise {
  const leveled = applyLevel(targetWords, opts)
  const [targetWord] = pick(leveled, 1)
  const level = numericToCEFR(targetWord?.difficulty ?? null)
  const [carrier] = pick([...CARRIER_PHRASES], 1)

  return {
    type: 'speak_word',
    exerciseType: { domain: 'pronunciation', mode: 'speak', variant: 'sentence' },
    soundId: targetSound.id,
    ipa: targetSound.ipa,
    targetWord: targetWord ? carrier(targetWord.word) : undefined,
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
  const contrastPool = getContrastWords(targetSound, leveled, allSounds, allWordsBySoundId, opts)

  // 50% chance the test word actually has the target sound. When no contrast
  // word exists we must ask a "yes" trial rather than mislabel a target word
  // as "no" — the previous fallback did exactly that.
  const useTarget = contrastPool.length === 0 ? true : Math.random() < 0.5
  const [testWord] = useTarget ? pick(leveled, 1) : pick(contrastPool, 1)
  if (!testWord) return declined('identify', 'identify', targetSound)

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
  const [wordA] = pick(leveled, 1)
  if (!wordA) return declined('ax_same_different', 'ax_same_different', targetSound)

  const contrastPool = getContrastWords(targetSound, leveled, allSounds, allWordsBySoundId, opts)
  // A "same" trial needs a second target word; a "different" trial needs a
  // contrast word. Only offer the trial types the data can actually support,
  // instead of silently reusing wordA and mislabelling the result.
  const sameOthers = leveled.filter(w => w.word.toLowerCase() !== wordA.word.toLowerCase())
  const canSame = sameOthers.length > 0
  const canDiff = contrastPool.length > 0
  if (!canSame && !canDiff) {
    return declined('ax_same_different', 'ax_same_different', targetSound)
  }
  const same = canSame && canDiff ? Math.random() < 0.5 : canSame

  const [wordX] = same ? pick(sameOthers, 1) : pick(contrastPool, 1)
  if (!wordX) return declined('ax_same_different', 'ax_same_different', targetSound)

  const stimuli: AudioStimulus[] = [
    { word: wordA.word, ipa: targetSound.ipa },
    { word: wordX.word, ipa: same ? targetSound.ipa : ipaForWord(wordX, allSounds) },
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
  const targetSample = pick(uniqueByWord(leveled), 3)

  const contrastPool = getContrastWords(targetSound, leveled, allSounds, allWordsBySoundId, opts)
  const [oddWord] = pick(uniqueByWord(contrastPool), 1)
  // The odd one must genuinely differ; reusing a target word made every option
  // correct-by-accident. Needs at least two same-sound words to be a real set.
  if (!oddWord || targetSample.length < 2) {
    return declined('odd_one_out', 'odd_one_out', targetSound)
  }

  // Insert within bounds: a thin targetSample previously let oddIndex point
  // past the end, so the marked answer was not the odd word.
  const oddIndex = Math.floor(Math.random() * (targetSample.length + 1))
  const allWords = [...targetSample]
  allWords.splice(oddIndex, 0, oddWord)

  const stimuli: AudioStimulus[] = allWords.map((w, i) => ({
    word: w.word,
    ipa: i === oddIndex ? ipaForWord(oddWord, allSounds) : targetSound.ipa,
  }))

  const options: Option[] = allWords.map((w, i) => ({
    id: String(i),
    label: w.word,
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

  // Only usable pairs: A and B must be audibly distinct for X to be decidable.
  const usablePairs = soundPairs.filter(p => p.word_a.toLowerCase() !== p.word_b.toLowerCase())

  if (usablePairs.length > 0) {
    const chosen = usablePairs[Math.floor(Math.random() * usablePairs.length)]
    const targetIsA = chosen.contrast_sound_a_id === targetSound.id
    wordA = targetIsA ? chosen.word_a : chosen.word_b
    wordB = targetIsA ? chosen.word_b : chosen.word_a
    ipaB = targetIsA ? (chosen.contrast_ipa_b ?? '') : (chosen.contrast_ipa_a ?? '')
  } else {
    // Fallback: contrast words only. Reusing a target word for B produced a
    // trial where both candidates were identical.
    const contrastPool = getContrastWords(targetSound, leveled, allSounds, allWordsBySoundId, opts)
    const [wA] = pick(leveled, 1)
    const [wB] = pick(contrastPool, 1)
    if (!wA || !wB) return declined('abx', 'abx', targetSound)
    wordA = wA.word
    wordB = wB.word
    ipaB = ipaForWord(wB, allSounds)
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
