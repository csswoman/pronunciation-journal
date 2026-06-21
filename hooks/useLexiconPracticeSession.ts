'use client'

import { useCallback, useEffect, useState } from 'react'
import { getAccessToken } from '@/lib/auth/session'
import { generateMatchPairsFromWordBank } from '@/lib/exercises/generators/match-pairs'
import { generateSentenceContextExercises } from '@/lib/lexicon/exercises'
import { fromGenericExercise } from '@/lib/practice/adapters'
import type { PracticeExercise } from '@/lib/practice/types'
import type { WordBankEntry } from '@/lib/word-bank/types'
import type { WordEntry } from '@/lib/lexicon/types'
import type { WordRating } from '@/lib/word-bank/lexicon-review-types'

type LoadState = 'idle' | 'loading' | 'ready' | 'error'
export type FlowPhase = 'review' | 'summary' | 'practice' | 'done'

const SESSION_SIZE = 10
const MIN_MATCH_PAIRS = 4
const MAX_MATCH_PAIRS = 6

interface PersistedState {
  categoryId: string
  lessonName: string
  allEntries: WordBankEntry[]
  sessionWordEntries: WordEntry[]
  posMapEntries: [string, string][]
  flowPhase: FlowPhase
  ratings: WordRating[]
  practiceExercises: PracticeExercise[]
  sessionKey: number
}

/** Interleave two arrays: [a0, b0, a1, b1, ...]. Remaining items appended. */
function interleave<T>(a: T[], b: T[]): T[] {
  const result: T[] = []
  const len = Math.max(a.length, b.length)
  for (let i = 0; i < len; i++) {
    if (i < a.length) result.push(a[i])
    if (i < b.length) result.push(b[i])
  }
  return result
}

function storageKey(categoryId: string) {
  return `lexicon-practice:${categoryId}`
}

function saveSession(state: PersistedState) {
  try {
    sessionStorage.setItem(storageKey(state.categoryId), JSON.stringify(state))
  } catch {
    // sessionStorage may be unavailable (private mode quota, etc.)
  }
}

function loadSession(categoryId: string): PersistedState | null {
  try {
    const raw = sessionStorage.getItem(storageKey(categoryId))
    if (!raw) return null
    return JSON.parse(raw) as PersistedState
  } catch {
    return null
  }
}

function clearSession(categoryId: string) {
  try {
    sessionStorage.removeItem(storageKey(categoryId))
  } catch {
    // ignore
  }
}

export function useLexiconPracticeSession(categoryId: string, userId: string | undefined) {
  const [lessonName, setLessonName] = useState('')
  const [allEntries, setAllEntries] = useState<WordBankEntry[]>([])
  const [posMap, setPosMap] = useState<Map<string, string>>(new Map())
  // WordEntry[] for the current session — kept in memory only (not sessionStorage).
  // Needed by handleReviewComplete to access exampleSentence for sentence_context generation.
  const [sessionWordEntries, setSessionWordEntries] = useState<WordEntry[]>([])
  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [flowPhase, setFlowPhaseRaw] = useState<FlowPhase>('review')
  const [ratings, setRatingsRaw] = useState<WordRating[]>([])
  const [practiceExercises, setPracticeExercisesRaw] = useState<PracticeExercise[]>([])
  const [sessionKey, setSessionKeyRaw] = useState(0)

  // Wrap setters to also persist after each state change.
  // We persist synchronously inside each setter so we always have the latest snapshot.
  function persist(patch: Partial<PersistedState>) {
    const base = loadSession(categoryId) ?? {} as PersistedState
    saveSession({ ...base, ...patch, categoryId })
  }

  const setFlowPhase = useCallback((phase: FlowPhase) => {
    setFlowPhaseRaw(phase)
    persist({ flowPhase: phase })
  }, [categoryId])

  const setRatings = useCallback((r: WordRating[]) => {
    setRatingsRaw(r)
    persist({ ratings: r })
  }, [categoryId])

  const setPracticeExercises = useCallback((ex: PracticeExercise[]) => {
    setPracticeExercisesRaw(ex)
    persist({ practiceExercises: ex })
  }, [categoryId])

  const bumpSessionKey = useCallback(() => {
    setSessionKeyRaw((k) => {
      const next = k + 1
      persist({ sessionKey: next })
      return next
    })
  }, [categoryId])

  const load = useCallback(async () => {
    if (!userId) return

    // Restore persisted session before fetching.
    const saved = loadSession(categoryId)
    if (saved && saved.categoryId === categoryId) {
      setLessonName(saved.lessonName)
      setAllEntries(saved.allEntries)
      setSessionWordEntries(saved.sessionWordEntries ?? [])
      setPosMap(new Map(saved.posMapEntries))
      setFlowPhaseRaw(saved.flowPhase)
      setRatingsRaw(saved.ratings)
      setPracticeExercisesRaw(saved.practiceExercises)
      setSessionKeyRaw(saved.sessionKey)
      setLoadState('ready')
      return
    }

    setLoadState('loading'); setError(null)
    try {
      const accessToken = await getAccessToken()
      const res = await fetch(`/api/lexicon/${categoryId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error ?? 'Failed to load lesson')
      }
      const { words, wordBankRows } = (await res.json()) as {
        words: WordEntry[]; wordBankRows: WordBankEntry[]
      }
      if (words.length === 0) throw new Error('No words available for this lesson')
      const bySourceRef = new Map(wordBankRows.map((r) => [r.source_ref, r]))
      const newPosMap = new Map(words.map((w) => [w.id, w.pos ?? '']))
      const allMapped: WordBankEntry[] = words.map((w) => {
        const real = bySourceRef.get(w.id)
        if (real) return real
        return {
          id: `lexicon:${w.id}`, user_id: userId, text: w.word, meaning: w.definition,
          example: w.example ?? null, difficulty: w.difficulty ?? 0, source: 'lexicon',
          source_ref: w.id, status: 'ready', srs_status: 'new', audio_url: null, ipa: null,
          context: null, created_at: '', updated_at: '', ease_factor: 2.5, interval_days: 0,
          repetitions: 0, review_count: 0, last_reviewed_at: null, next_review_at: null,
          error_reason: null, has_audio: null, audio_fetch_attempts: 0, image_prompt: null,
          synonyms: null, translation: null,
        } satisfies WordBankEntry
      })
      allMapped.sort((a, b) => {
        if (!a.next_review_at && !b.next_review_at) return 0
        if (!a.next_review_at) return -1
        if (!b.next_review_at) return 1
        return new Date(a.next_review_at).getTime() - new Date(b.next_review_at).getTime()
      })
      const sessionEntries = allMapped.slice(0, SESSION_SIZE)
      const sessionWordEntryIds = new Set(sessionEntries.map((e) => e.source_ref))
      const sessionWordEntriesSlice = words.filter((w) => sessionWordEntryIds.has(w.id))
      const name = categoryId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

      setLessonName(name)
      setPosMap(newPosMap)
      setAllEntries(sessionEntries)
      setSessionWordEntries(sessionWordEntriesSlice)
      setFlowPhaseRaw('review')
      setLoadState('ready')

      saveSession({
        categoryId,
        lessonName: name,
        allEntries: sessionEntries,
        sessionWordEntries: sessionWordEntriesSlice,
        posMapEntries: Array.from(newPosMap.entries()),
        flowPhase: 'review',
        ratings: [],
        practiceExercises: [],
        sessionKey: 0,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lesson')
      setLoadState('error')
    }
  }, [categoryId, userId])

  useEffect(() => {
    load()
  }, [load])

  const handleReviewComplete = useCallback((completedRatings: WordRating[]) => {
    setRatings(completedRatings)

    const forgotEntries = completedRatings.filter((r) => r.rating === 'forgot').map((r) => r.entry)

    if (forgotEntries.length === 0) {
      setFlowPhase('done')
      return
    }

    let pool = forgotEntries
    if (pool.length < MIN_MATCH_PAIRS) {
      const normalEntries = completedRatings.filter((r) => r.rating === 'normal').map((r) => r.entry)
      pool = [...pool, ...normalEntries.slice(0, MIN_MATCH_PAIRS - pool.length)]
    }

    const matchPairs = generateMatchPairsFromWordBank(pool, MAX_MATCH_PAIRS)
    const matchExercises: PracticeExercise[] = matchPairs.map((ex) => fromGenericExercise(ex, 'practice'))

    // Build sentence_context exercises for forgot/normal words that have exampleSentence.
    const practiceWordIds = new Set(pool.map((e) => e.source_ref))
    const candidateWordEntries = sessionWordEntries.filter((w) => practiceWordIds.has(w.id))
    const sentenceContextRaw = generateSentenceContextExercises(candidateWordEntries, sessionWordEntries)
    const sentenceContextExercises: PracticeExercise[] = sentenceContextRaw.map((ex) => fromGenericExercise(ex, 'practice'))

    // Interleave match_pairs and sentence_context for better retention.
    const exercises: PracticeExercise[] = interleave(matchExercises, sentenceContextExercises)

    if (exercises.length === 0) {
      setFlowPhase('done')
      return
    }

    setPracticeExercises(exercises)
    bumpSessionKey()
    setFlowPhase('summary')
  }, [setRatings, setFlowPhase, setPracticeExercises, bumpSessionKey, sessionWordEntries])

  function clear() {
    clearSession(categoryId)
  }

  return {
    lessonName,
    allEntries,
    posMap,
    loadState,
    error,
    flowPhase,
    ratings,
    practiceExercises,
    sessionKey,
    setFlowPhase,
    handleReviewComplete,
    reload: load,
    clear,
  }
}
