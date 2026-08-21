import type { Exercise, Sound, SoundWord, MinimalPair, UserContrastProgress } from './types'
import type { MatchPairsExercise, ReorderWordsExercise } from '@/lib/exercises/types'
import type { CEFRLevel } from '@/lib/exercises/cefr'
import {
  generatePickWord,
  generateMinimalPair,
  generateDictation,
  generateIdentify,
  generateAxSameDifferent,
  generateOddOneOut,
  generateAbx,
  generateSpeakWord,
  generateSpeakPhrase,
  generateFinalConsonantMinimalPair,
  generateFinalConsonantAx,
  getFinalConsonantPairs,
} from './exercises'
import { generateMatchPairsFromWordBank } from '@/lib/exercises/generators/match-pairs'
import { generateReorderFromSoundExample } from '@/lib/exercises/generators/reorder-words'
import { IPA_EXTRA } from '@/lib/pronunciation/ipa-data'
import { HARD_FOR_SPANISH_SPEAKERS } from '@/lib/pronunciation/ipa-data'
import { contrastKey, PHONEME_CONFUSION } from './phoneme-similarity'
import { isContrastMastered } from './mastery'
import { cefrToNumeric } from './cefr'
import type { WordBankEntry } from '@/lib/word-bank/types'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export type MixedExercise =
  | { kind: 'phoneme'; data: Exercise }
  | { kind: 'match_pairs'; data: MatchPairsExercise }
  | { kind: 'reorder_words'; data: ReorderWordsExercise }

/**
 * True when the user's level is B1 or above (gates ABX exercises).
 */
function isB1OrAbove(level: CEFRLevel | undefined): boolean {
  if (!level) return false
  return cefrToNumeric(level) >= cefrToNumeric('B1')
}

/**
 * Picks the weakest contrast for the target sound given user history.
 * Falls back to L1-difficulty ordering when there is no history.
 *
 * Returns the IPA of the contrast phoneme (the "other" side), or undefined.
 */
function weakestContrastIpa(
  targetIpa: string,
  progressByKey: Map<string, UserContrastProgress>
): string | undefined {
  const confusables = PHONEME_CONFUSION[targetIpa]
  if (!confusables || confusables.length === 0) return undefined

  // Sort: unmastered first, then by lowest accuracy
  const scored = [...confusables].sort((a, b) => {
    const keyA = contrastKey(targetIpa, a)
    const keyB = contrastKey(targetIpa, b)
    const pA = progressByKey.get(keyA)
    const pB = progressByKey.get(keyB)

    // No history = weakest (comes first)
    if (!pA && !pB) return 0
    if (!pA) return -1
    if (!pB) return 1

    if (isContrastMastered(pA) !== isContrastMastered(pB)) {
      return isContrastMastered(pA) ? 1 : -1
    }
    const accA = pA.total_attempts > 0 ? pA.correct_answers / pA.total_attempts : 0
    const accB = pB.total_attempts > 0 ? pB.correct_answers / pB.total_attempts : 0
    return accA - accB
  })

  return scored[0]
}

/**
 * Build a cold-start ordering for sounds with no user history.
 * Prioritises HARD_FOR_SPANISH_SPEAKERS, then IPA_EXTRA difficulty.
 */
export function coldStartOrder(sounds: Sound[]): Sound[] {
  const hardSet = new Set(HARD_FOR_SPANISH_SPEAKERS)

  return [...sounds].sort((a, b) => {
    const aHard = hardSet.has(a.ipa) ? 0 : 1
    const bHard = hardSet.has(b.ipa) ? 0 : 1
    if (aHard !== bHard) return aHard - bHard

    // Tie-break by IPA_EXTRA difficulty (hard > medium > easy)
    const diffOrder: Record<string, number> = { hard: 0, medium: 1, easy: 2 }
    const aDiff = diffOrder[IPA_EXTRA[a.ipa]?.difficulty ?? 'easy'] ?? 2
    const bDiff = diffOrder[IPA_EXTRA[b.ipa]?.difficulty ?? 'easy'] ?? 2
    return aDiff - bDiff
  })
}

export interface AdaptiveSessionOptions {
  /** User's CEFR level — gates ABX. */
  userLevel?: CEFRLevel
  /** All contrast progress rows for this user (used for adaptive ordering). */
  contrastProgress?: UserContrastProgress[]
  /**
   * Vocabulary entries for the optional aggregate matching activity.
   * Sound-word rows intentionally do not supply this exercise: matching a
   * spelling to its IPA is visual recognition, not pronunciation practice.
   */
  matchPairWords?: WordBankEntry[]
}

/**
 * Build an adaptive mixed session for a sound.
 *
 * Exercise mix:
 *   A1/A2: identify × 2, ax_same_different × 2, odd_one_out × 1,
 *          pick_word × 1, minimal_pair × 1, dictation × 1
 *   B1+:   same as A1/A2 + abx × 2 replacing two identify slots
 *
 * The weakest contrast drives odd_one_out / ax_same_different stimulus selection.
 */
export function buildAdaptiveSession(
  sound: Sound,
  targetWords: SoundWord[],
  allSounds: Sound[],
  allWordsBySoundId: Map<number, SoundWord[]>,
  pairs: MinimalPair[],
  opts: AdaptiveSessionOptions = {}
): MixedExercise[] {
  if (targetWords.length === 0) return []

  const { userLevel, contrastProgress = [] } = opts
  const progressMap = new Map(contrastProgress.map(p => [p.contrast_id, p]))
  const weakOther = weakestContrastIpa(sound.ipa, progressMap)
  const focusContrastId = weakOther ? contrastKey(sound.ipa, weakOther) : undefined
  const canUseAbx = isB1OrAbove(userLevel)
  const focusProgress = focusContrastId ? progressMap.get(focusContrastId) : undefined

  const stampContrast = (data: Exercise): Exercise =>
    focusContrastId ? { ...data, contrastId: focusContrastId } : data
  const stage1: MixedExercise[] = []
  const stage2: MixedExercise[] = []
  const stage3: MixedExercise[] = []
  const stage4: MixedExercise[] = []
  const stage5: MixedExercise[] = []

  const addStage1 = (data: Exercise, isContrast = false) => {
    if (data.options.length === 0) return
    stage1.push({ kind: 'phoneme', data: isContrast ? stampContrast(data) : data })
  }

  const addStage2 = (data: Exercise, isContrast = false) => {
    if (data.options.length === 0) return
    stage2.push({ kind: 'phoneme', data: isContrast ? stampContrast(data) : data })
  }

  // ── Stage 1: Discrimination & Contrast Perception (identify / abx, ax_same_different, odd_one_out) ──
  if (canUseAbx) {
    // B1+: 2 ABX in place of 2 identify (contrast exercise)
    for (let i = 0; i < 2; i++) {
      addStage1(generateAbx(sound, targetWords, allSounds, allWordsBySoundId, pairs), true)
    }
  } else {
    // A1/A2: 2 identify (single-sound exercise)
    for (let i = 0; i < 2; i++) {
      addStage1(generateIdentify(sound, targetWords, allSounds, allWordsBySoundId), false)
    }
  }

  // AX same/different × 2 (contrast exercise)
  for (let i = 0; i < 2; i++) {
    addStage1(generateAxSameDifferent(sound, targetWords, allSounds, allWordsBySoundId), true)
  }

  // odd_one_out × 1 (contrast exercise)
  addStage1(generateOddOneOut(sound, targetWords, allSounds, allWordsBySoundId), true)

  // ── Stage 2: Lexical Association & Minimal Pair Recognition ──
  // pick_word × 1 (single-sound exercise)
  addStage2(generatePickWord(sound, targetWords, allSounds, allWordsBySoundId), false)

  // minimal_pair × 1 (contrast exercise, fallback pick_word if no pairs)
  const mp = generateMinimalPair(sound, pairs)
  if (mp.options.length > 0) {
    addStage2(mp, true)
  } else {
    addStage2(generatePickWord(sound, targetWords, allSounds, allWordsBySoundId), false)
  }

  // ── Stage 3: Listening / Dictation ──
  // dictation × 1 — listening of the target sound (single-sound drill)
  const dictation = generateDictation(sound, targetWords)
  if (dictation.targetWord) stage3.push({ kind: 'phoneme', data: dictation })

  // ── Stage 4: Production (Ordered: Word then Phrase) ──
  // Production: word, then a short carrier-phrase production — scheduled
  // specifically when prior evidence for the focus contrast exists.
  if (focusContrastId && focusProgress && !isContrastMastered(focusProgress)) {
    const speakWord = generateSpeakWord(sound, targetWords, { maxLevel: userLevel })
    if (speakWord.targetWord) stage4.push({ kind: 'phoneme', data: stampContrast(speakWord) })
    const speakPhrase = generateSpeakPhrase(sound, targetWords, { maxLevel: userLevel })
    if (speakPhrase.targetWord) stage4.push({ kind: 'phoneme', data: stampContrast(speakPhrase) })
  }

  // ── Stage 5: Consolidation & Transfer ──
  // Optional aggregate vocabulary retrieval plus a sound-specific example drill.
  // The matching pairs come from Essential Words (or another vocabulary source),
  // never from the Sound Lab word → IPA dataset.
  const matchGroups = opts.matchPairWords
    ? generateMatchPairsFromWordBank(opts.matchPairWords, 1)
    : []
  if (matchGroups.length > 0) stage5.push({ kind: 'match_pairs', data: matchGroups[0] })
  const reorder = generateReorderFromSoundExample(sound)
  if (reorder) stage5.push({ kind: 'reorder_words', data: reorder })

  // Shuffle within each stage to preserve pedagogical staging (Perception -> Lexicon -> Dictation -> Production -> Transfer)
  return [
    ...shuffle(stage1),
    ...shuffle(stage2),
    ...shuffle(stage3),
    ...stage4,
    ...shuffle(stage5),
  ]
}

/**
 * Build a focused session on final-consonant devoicing/elision.
 *
 * Targets Spanish-speaker errors: /b/→/p/, /d/→/t/, /g/→/k/, /v/→/f/, /z/→/s/.
 * Only builds exercises when IPA_EXTRA has finalConsonantPairs for the sound.
 * Returns empty when no final-consonant data exists — caller should fall back to
 * buildAdaptiveSession.
 *
 * Mix: ax_same_different × 3, minimal_pair × 3.
 */
export function buildFinalConsonantSession(
  sound: Sound,
): MixedExercise[] {
  const hasPairs = getFinalConsonantPairs(sound.ipa).length > 0
  if (!hasPairs) return []

  const ex: MixedExercise[] = []

  // Same contract as buildAdaptiveSession: drop trials with no playable stimuli.
  for (let i = 0; i < 3; i++) {
    const ax = generateFinalConsonantAx(sound)
    if ((ax.stimuli?.length ?? 0) > 0) ex.push({ kind: 'phoneme', data: ax })
  }
  for (let i = 0; i < 3; i++) {
    const mp = generateFinalConsonantMinimalPair(sound)
    if (mp.options.length > 0) ex.push({ kind: 'phoneme', data: mp })
  }

  return shuffle(ex)
}

/**
 * Legacy non-adaptive session (kept for backward compatibility with existing call sites).
 * Prefer buildAdaptiveSession for new code.
 */
export function buildMixedSession(
  sound: Sound,
  targetWords: SoundWord[],
  allSounds: Sound[],
  allWordsBySoundId: Map<number, SoundWord[]>,
  pairs: MinimalPair[],
  opts: AdaptiveSessionOptions = {},
): MixedExercise[] {
  return buildAdaptiveSession(sound, targetWords, allSounds, allWordsBySoundId, pairs, opts)
}
