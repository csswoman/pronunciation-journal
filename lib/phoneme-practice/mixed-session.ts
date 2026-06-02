import type { Exercise, Sound, SoundWord, MinimalPair, UserContrastProgress } from './types'
import type { MatchPairsExercise, ReorderWordsExercise } from '@/lib/exercises/types'
import type { CEFRLevel } from '@/lib/exercises/cefr'
import {
  generatePickWord,
  generatePickSound,
  generateMinimalPair,
  generateDictation,
  generateIdentify,
  generateAxSameDifferent,
  generateOddOneOut,
  generateAbx,
} from './exercises'
import { generateMatchPairsFromSoundWords } from '@/lib/exercises/generators/match-pairs'
import { generateReorderFromSoundExample } from '@/lib/exercises/generators/reorder-words'
import { IPA_EXTRA } from '@/lib/pronunciation/ipa-data'
import { HARD_FOR_SPANISH_SPEAKERS } from '@/lib/pronunciation/ipa-data'
import { contrastKey, PHONEME_CONFUSION } from './phoneme-similarity'
import { isContrastMastered } from './mastery'
import { cefrToNumeric } from './cefr'

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
  const contrastIpa = weakestContrastIpa(sound.ipa, progressMap)
  const canUseAbx = isB1OrAbove(userLevel)

  const ex: MixedExercise[] = []

  if (canUseAbx) {
    // B1+: 2 ABX in place of 2 identify
    for (let i = 0; i < 2; i++) {
      ex.push({ kind: 'phoneme', data: generateAbx(sound, targetWords, allSounds, allWordsBySoundId, pairs) })
    }
  } else {
    // A1/A2: 2 identify
    for (let i = 0; i < 2; i++) {
      ex.push({ kind: 'phoneme', data: generateIdentify(sound, targetWords, allSounds, allWordsBySoundId) })
    }
  }

  // AX same/different × 2
  for (let i = 0; i < 2; i++) {
    ex.push({ kind: 'phoneme', data: generateAxSameDifferent(sound, targetWords, allSounds, allWordsBySoundId) })
  }

  // odd_one_out × 1
  ex.push({ kind: 'phoneme', data: generateOddOneOut(sound, targetWords, allSounds, allWordsBySoundId) })

  // pick_word × 1
  ex.push({ kind: 'phoneme', data: generatePickWord(sound, targetWords, allSounds, allWordsBySoundId) })

  // minimal_pair × 1 (fallback pick_word if no pairs)
  const mp = generateMinimalPair(sound, pairs)
  ex.push({
    kind: 'phoneme',
    data: mp.options.length > 0 ? mp : generatePickWord(sound, targetWords, allSounds, allWordsBySoundId),
  })

  // dictation × 1
  ex.push({ kind: 'phoneme', data: generateDictation(sound, targetWords) })

  // Optional: match_pairs + reorder
  const matchGroups = generateMatchPairsFromSoundWords(targetWords)
  if (matchGroups.length > 0) ex.push({ kind: 'match_pairs', data: matchGroups[0] })
  const reorder = generateReorderFromSoundExample(sound)
  if (reorder) ex.push({ kind: 'reorder_words', data: reorder })

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
  pairs: MinimalPair[]
): MixedExercise[] {
  return buildAdaptiveSession(sound, targetWords, allSounds, allWordsBySoundId, pairs)
}
