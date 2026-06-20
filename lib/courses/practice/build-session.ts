'use client'

import { fetchFragmentsForDeck } from '@/lib/exercises/generators/reorder-from-fragments'
import { generateMixedFromFragments } from '@/lib/exercises/generators/mixed-from-fragments'
import { fetchCoreWords } from '@/lib/core-1000/client'
import { fromGenericExercise } from '@/lib/practice/adapters'
import type { PracticeExercise } from '@/lib/practice/types'
import type { CefrLevel } from '@/lib/core-1000/types'
import { selectNewWordsForLevel } from './vocab-selector'
import { buildWordExercises } from './word-exercise-builder'
import { db } from '@/lib/db'

const TARGET_SIZE = 10
const FRAGMENT_SLOTS = 5
const VOCAB_SLOTS = 4

export interface BuildCourseSessionOptions {
  deckSlug: string
  cefrLevel: CefrLevel
}

/**
 * Assembles a mixed PracticeExercise[] for a grammar deck lesson.
 * Sources: sentence fragments (reorder/dictation/fill-blank), new Core 1000
 * vocabulary for the CEFR level.
 * Returns [] when all sources are empty — caller should hide the practice button.
 */
export async function buildCoursePracticeSession({
  deckSlug,
  cefrLevel,
}: BuildCourseSessionOptions): Promise<PracticeExercise[]> {
  // ── Source 1: sentence fragments ──────────────────────────────────────────
  const fragmentExercises = await (async () => {
    try {
      const fragments = await fetchFragmentsForDeck(deckSlug, 30)
      return generateMixedFromFragments(fragments, FRAGMENT_SLOTS).map((ex) =>
        fromGenericExercise(ex, 'courses'),
      )
    } catch {
      return []
    }
  })()

  // ── Source 2: new Core 1000 words for this CEFR level ────────────────────
  const vocabExercises = await (async () => {
    try {
      const [allWords, seenEntries] = await Promise.all([
        fetchCoreWords(),
        db.srsData.where('wordId').startsWith('c1k:').toArray(),
      ])
      const seenIds = new Set(seenEntries.map((e) => e.wordId))
      const newWords = selectNewWordsForLevel(allWords, cefrLevel, seenIds, VOCAB_SLOTS)
      return buildWordExercises(newWords).map((ex) => fromGenericExercise(ex, 'courses'))
    } catch {
      return []
    }
  })()

  // ── Interleave: fragment, vocab, fragment, vocab… ─────────────────────────
  const interleaved: PracticeExercise[] = []
  const fq = [...fragmentExercises]
  const vq = [...vocabExercises]
  while (interleaved.length < TARGET_SIZE && (fq.length > 0 || vq.length > 0)) {
    if (fq.length > 0) interleaved.push(fq.shift()!)
    if (interleaved.length < TARGET_SIZE && vq.length > 0) interleaved.push(vq.shift()!)
  }

  return interleaved
}
