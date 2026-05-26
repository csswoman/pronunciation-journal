import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { generateFillBlankFromWordBank } from '@/lib/exercises/generators/fill-blank'
import { generateSentenceDictationFromWordBank } from '@/lib/exercises/generators/sentence-dictation'
import { generateReorderWordsFromWordBank } from '@/lib/exercises/generators/reorder-words'
import { getAllSounds, getAllWords, getMinimalPairs, getWordsBySound } from '@/lib/phoneme-practice/queries'
import { buildMixedSession } from '@/lib/phoneme-practice/mixed-session'
import { fromGenericExercise, fromMixedExercise } from './adapters'
import type { PracticeExercise } from './types'
import type { WordBankEntry } from '@/lib/word-bank/types'
import type { UserSoundProgressWithSound } from '@/lib/phoneme-practice/types'

// ── Composition constants (tweak without refactoring) ────────────────────────

/** Target total exercises in one daily session. */
export const DAILY_SESSION_LENGTH = 10

/** How many of those come from word_bank due/new entries. */
export const WORD_BANK_SLOT_COUNT = 7

/** Breakdown of word_bank slots by type. */
export const WORD_BANK_FILL_BLANK_COUNT = 3
export const WORD_BANK_SENTENCE_DICTATION_COUNT = 2
export const WORD_BANK_REORDER_WORDS_COUNT = 2

/** How many exercises come from the weakest phoneme. */
export const PHONEME_SLOT_COUNT = 3

// ── Errors ────────────────────────────────────────────────────────────────────

export class EmptyWordBankError extends Error {
  readonly code = 'EMPTY_WORD_BANK'
  constructor() {
    super('No words in your word bank yet. Add some words from the Lexicon to start practicing.')
  }
}

// ── Internal helpers ──────────────────────────────────────────────────────────

async function fetchDueWords(userId: string): Promise<WordBankEntry[]> {
  const supabase = getSupabaseBrowserClient()
  const today = new Date().toISOString()

  const { data, error } = await supabase
    .from('word_bank')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'ready')
    .or(`srs_status.eq.new,next_review_at.lte.${today}`)
    .order('next_review_at', { ascending: true, nullsFirst: true })
    .limit(WORD_BANK_SLOT_COUNT)

  if (error) throw error
  return (data ?? []) as WordBankEntry[]
}

async function fetchNewWords(userId: string, limit: number): Promise<WordBankEntry[]> {
  if (limit <= 0) return []
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase
    .from('word_bank')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'ready')
    .eq('srs_status', 'new')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as WordBankEntry[]
}

async function fetchWeakestSoundProgress(userId: string): Promise<UserSoundProgressWithSound | null> {
  const supabase = getSupabaseBrowserClient()

  // Fetch all practiced sounds (exclude locked; must have at least one attempt)
  const { data, error } = await supabase
    .from('user_sound_progress')
    .select('*, sounds(*)')
    .eq('user_id', userId)
    .neq('status', 'locked')
    .neq('status', 'mastered')
    .gt('total_attempts', 0)

  if (error) throw error
  if (!data || data.length === 0) return null

  // Weakest = lowest accuracy ratio; break ties by fewest attempts
  const ranked = (data as UserSoundProgressWithSound[]).sort((a, b) => {
    const accA = a.correct_answers / a.total_attempts
    const accB = b.correct_answers / b.total_attempts
    if (accA !== accB) return accA - accB
    return a.total_attempts - b.total_attempts
  })

  return ranked[0]
}

function dedupeByContentId(exercises: PracticeExercise[]): PracticeExercise[] {
  const seen = new Set<string>()
  return exercises.filter(ex => {
    if (seen.has(ex.contentId)) return false
    seen.add(ex.contentId)
    return true
  })
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Build a daily practice session for the given user.
 *
 * Composition (DAILY_SESSION_LENGTH = 10):
 *   • WORD_BANK_SLOT_COUNT  exercises from word_bank (due + new fill-blank, sentence-dictation, reorder)
 *   • PHONEME_SLOT_COUNT    exercises from the user's weakest phoneme sound
 *
 * Fallbacks:
 *   • Fewer due words → padded with `new` words from word_bank
 *   • No weak phoneme (new user with no sound progress) → extra word_bank exercises
 *   • word_bank empty → throws EmptyWordBankError (redirect to Lexicon)
 */
export async function buildDailyPlan(userId: string): Promise<PracticeExercise[]> {
  // ── 1. Fetch due words ────────────────────────────────────────────────────
  let dueWords = await fetchDueWords(userId)

  if (dueWords.length === 0) {
    // Pad attempt — try to get any new words at all
    dueWords = await fetchNewWords(userId, WORD_BANK_SLOT_COUNT)
  } else if (dueWords.length < WORD_BANK_SLOT_COUNT) {
    // Pad due words with additional new words
    const shortfall = WORD_BANK_SLOT_COUNT - dueWords.length
    const dueIds = new Set(dueWords.map(w => w.id))
    const extra = (await fetchNewWords(userId, shortfall * 2)).filter(w => !dueIds.has(w.id))
    dueWords = [...dueWords, ...extra.slice(0, shortfall)]
  }

  if (dueWords.length === 0) throw new EmptyWordBankError()

  // ── 2. Generate word_bank exercises ──────────────────────────────────────
  const fillBlanks = generateFillBlankFromWordBank(dueWords, WORD_BANK_FILL_BLANK_COUNT)
  const sentenceDictations = generateSentenceDictationFromWordBank(dueWords, WORD_BANK_SENTENCE_DICTATION_COUNT)
  const reorderWords = generateReorderWordsFromWordBank(dueWords, WORD_BANK_REORDER_WORDS_COUNT)

  const wordBankExercises: PracticeExercise[] = [
    ...fillBlanks.map(ex => fromGenericExercise(ex, 'daily')),
    ...sentenceDictations.map(ex => fromGenericExercise(ex, 'daily')),
    ...reorderWords.map(ex => fromGenericExercise(ex, 'daily')),
  ]

  // ── 3. Phoneme exercises from weakest sound ───────────────────────────────
  const phonemeExercises: PracticeExercise[] = []
  const weakest = await fetchWeakestSoundProgress(userId)

  if (weakest) {
    const [targetWords, allSounds, allWords, pairs] = await Promise.all([
      getWordsBySound(weakest.sound_id),
      getAllSounds(),
      getAllWords(),
      getMinimalPairs(weakest.sound_id),
    ])

    const allWordsBySoundId = new Map(
      allSounds.map(s => [s.id, allWords.filter(w => w.sound_id === s.id)])
    )

    const mixed = buildMixedSession(weakest.sounds, targetWords, allSounds, allWordsBySoundId, pairs)
    const converted = mixed.map(ex => fromMixedExercise(ex, 'daily'))
    phonemeExercises.push(...converted.slice(0, PHONEME_SLOT_COUNT))
  } else {
    // New user: fill phoneme slots with more word_bank exercises
    const extra = generateFillBlankFromWordBank(dueWords, PHONEME_SLOT_COUNT)
    phonemeExercises.push(...extra.map(ex => fromGenericExercise(ex, 'daily')))
  }

  // ── 4. Merge, dedupe, return ──────────────────────────────────────────────
  return dedupeByContentId([...wordBankExercises, ...phonemeExercises])
}
