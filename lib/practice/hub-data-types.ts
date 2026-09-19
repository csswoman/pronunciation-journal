// Client-safe types + empty bundle for the free-practice hub. The server-only
// fetcher lives in `hub-data.ts` (which imports `server-only`); this module
// carries nothing that can't run in the browser so client components can share
// the shapes.

import type { CefrLevelId } from '@/lib/courses/types'
import type { AggregatedReviewSummary } from '@/lib/review/summary-types'

export interface PracticeHubRecommendedData {
  /** Words past their next-review date. */
  dueCount: number
  /** Due words that never graduated (repetitions === 0) — the urgent slice. */
  criticalCount: number
  /** 7-day answer accuracy, 0-100. null when there isn't enough history. */
  retentionPct: number | null
  /** Up to 3 ready words to preview on the card. */
  previewWords: string[]
}

export interface PracticeHubDecksData {
  deckCount: number
  cardCount: number
  /** Up to 3 deck names, newest first. */
  topDeckNames: string[]
  /** Card counts aligned with `topDeckNames`, when available. */
  topDeckCardCounts?: number[]
}

export interface PracticeHubCourseData {
  levelId: CefrLevelId
  /** e.g. "B1 · Intermedio". */
  levelLabel: string
  progressPct: number
  currentUnitTitle: string | null
  currentLessonTitle: string | null
}

/** A pronunciation focus backed by the learner's evaluated contrast attempts. */
export interface PracticeHubSoundData {
  ipa: string
  accuracy: number
  totalAttempts: number
}

export interface PracticeHubData {
  reviewSummary?: AggregatedReviewSummary | null
  recommended: PracticeHubRecommendedData
  decks: PracticeHubDecksData
  reader: { recentWordCount: number; recentWords: string[] }
  immersion: { totalCount: number }
  course: PracticeHubCourseData | null
  sound: PracticeHubSoundData | null
}

const EMPTY: PracticeHubData = {
  reviewSummary: null,
  recommended: { dueCount: 0, criticalCount: 0, retentionPct: null, previewWords: [] },
  decks: { deckCount: 0, cardCount: 0, topDeckNames: [] },
  reader: { recentWordCount: 0, recentWords: [] },
  immersion: { totalCount: 0 },
  course: null,
  sound: null,
}

/** Empty bundle for guests / total failure. */
export function emptyPracticeHubData(): PracticeHubData {
  return structuredClone(EMPTY)
}
