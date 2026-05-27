'use client'

// Planned structure:
// <LexiconPracticePage>
//   phase=review   → <LexiconReviewPhase />
//   phase=summary  → <LexiconReviewSummary />
//   phase=practice → <PracticeSession />
//   phase=done     → redirect to lexicon lesson
// </LexiconPracticePage>

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import PracticeSession from '@/components/practice/PracticeSession'
import { LexiconReviewPhase } from '@/components/lexicon/practice/LexiconReviewPhase'
import { LexiconReviewSummary } from '@/components/lexicon/practice/LexiconReviewSummary'
import PageLayout from '@/components/layout/PageLayout'
import Button from '@/components/ui/Button'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { generateMatchPairsFromWordBank } from '@/lib/exercises/generators/match-pairs'
import { fromGenericExercise } from '@/lib/practice/adapters'
import { applyPhase2Penalty } from '@/lib/word-bank/srs-queries'
import type { PracticeExercise, SessionResult } from '@/lib/practice/types'
import type { WordBankEntry } from '@/lib/word-bank/types'
import type { WordEntry } from '@/lib/lexicon/types'
import type { WordRating } from '@/lib/word-bank/lexicon-review-types'

type LoadState = 'idle' | 'loading' | 'ready' | 'error'
type FlowPhase = 'review' | 'summary' | 'practice' | 'done'

const MIN_MATCH_PAIRS = 4
const MAX_MATCH_PAIRS = 6

export default function LexiconPracticePage() {
  const params = useParams()
  const categoryId = params.id as string
  const router = useRouter()
  const { user } = useAuth()

  const [lessonName, setLessonName] = useState('')
  const [allEntries, setAllEntries] = useState<WordBankEntry[]>([])
  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [error, setError] = useState<string | null>(null)

  const [flowPhase, setFlowPhase] = useState<FlowPhase>('review')
  const [ratings, setRatings] = useState<WordRating[]>([])
  const [practiceExercises, setPracticeExercises] = useState<PracticeExercise[]>([])
  const [sessionKey, setSessionKey] = useState(0)

  const load = useCallback(async () => {
    if (!user) return
    setLoadState('loading'); setError(null)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')
      const res = await fetch(`/api/lexicon/${categoryId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
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
      const entries: WordBankEntry[] = words.map((w) => {
        const real = bySourceRef.get(w.id)
        if (real) return real
        return {
          id: `lexicon:${w.id}`, user_id: user.id, text: w.word, meaning: w.definition,
          example: w.example ?? null, difficulty: w.difficulty ?? 0, source: 'lexicon',
          source_ref: w.id, status: 'ready', srs_status: 'new', audio_url: null, ipa: null,
          context: null, created_at: '', updated_at: '', ease_factor: 2.5, interval_days: 0,
          repetitions: 0, review_count: 0, last_reviewed_at: null, next_review_at: null,
          error_reason: null, has_audio: null, audio_fetch_attempts: 0, image_prompt: null,
          synonyms: null, translation: null,
        } satisfies WordBankEntry
      })
      setLessonName(categoryId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
      setAllEntries(entries); setFlowPhase('review'); setLoadState('ready')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lesson')
      setLoadState('error')
    }
  }, [categoryId, user])

  useEffect(() => {
    load()
  }, [load])

  const handleReviewComplete = useCallback((completedRatings: WordRating[]) => {
    setRatings(completedRatings)

    const forgotEntries = completedRatings
      .filter((r) => r.rating === 'forgot')
      .map((r) => r.entry)

    if (forgotEntries.length === 0) {
      setFlowPhase('done')
      return
    }

    let pool = forgotEntries
    if (pool.length < MIN_MATCH_PAIRS) {
      const normalEntries = completedRatings
        .filter((r) => r.rating === 'normal')
        .map((r) => r.entry)
      const needed = MIN_MATCH_PAIRS - pool.length
      pool = [...pool, ...normalEntries.slice(0, needed)]
    }

    const matchPairs = generateMatchPairsFromWordBank(pool, MAX_MATCH_PAIRS)
    const exercises: PracticeExercise[] = matchPairs.map((ex) =>
      fromGenericExercise(ex, 'practice')
    )

    if (exercises.length === 0) {
      setFlowPhase('done')
      return
    }

    setPracticeExercises(exercises)
    setSessionKey((k) => k + 1)
    setFlowPhase('summary')
  }, [])

  // Keyed by word bank entry id — only "forgot"-rated entries are penalized.
  const forgotEntryMap = useMemo(() => {
    return new Map(
      ratings
        .filter((r) => r.rating === 'forgot')
        .map((r) => [r.entry.id, r.entry])
    )
  }, [ratings])

  const handleSessionComplete = useCallback(
    (result: SessionResult) => {
      if (!user) return
      // match_pairs grades a group of 4 — there's no per-word result. If any exercise is
      // answered incorrectly, penalize all "forgot" entries since they were part of the pool.
      const anyIncorrect = result.results.some((r) => !r.isCorrect)
      if (anyIncorrect && forgotEntryMap.size > 0) {
        const penalties = Array.from(forgotEntryMap.values()).map((entry) =>
          applyPhase2Penalty(user.id, entry.id, entry.ease_factor ?? 2.5)
        )
        void Promise.allSettled(penalties)
      }
      setFlowPhase('done')
    },
    [user, forgotEntryMap],
  )

  useEffect(() => {
    if (flowPhase === 'done') {
      router.push(`/lexicon/${categoryId}`)
    }
  }, [flowPhase, categoryId, router])

  const header = (
    <header className="sticky top-0 z-10 border-b border-[var(--border-subtle)] bg-[var(--surface-base)]">
      <div className="flex items-center justify-between px-10 pt-6 pb-4">
        <button
          type="button"
          onClick={() => router.push(`/lexicon/${categoryId}`)}
          className="border-none bg-transparent p-1 text-xl leading-none text-fg-subtle"
        >
          ←
        </button>
        <span className="text-base font-semibold text-fg truncate max-w-xs">{lessonName}</span>
        <div className="w-6" />
      </div>
    </header>
  )

  if (loadState === 'error') {
    return (
      <PageLayout variant="lesson" hero={header}>
        <div className="flex flex-col items-center gap-4 py-20 text-center px-6">
          <p className="text-error text-sm">{error}</p>
          <Button type="button" onClick={load} variant="primary" size="sm">Retry</Button>
        </div>
      </PageLayout>
    )
  }

  if (loadState !== 'ready') {
    return (
      <PageLayout variant="lesson" hero={header}>
        <div className="flex items-center justify-center py-20">
          <span className="animate-pulse text-fg-subtle">Preparing review…</span>
        </div>
      </PageLayout>
    )
  }

  if (flowPhase === 'review') {
    return (
      <PageLayout variant="lesson" hero={header}>
        <LexiconReviewPhase
          entries={allEntries}
          userId={user?.id ?? ''}
          onComplete={handleReviewComplete}
        />
      </PageLayout>
    )
  }

  if (flowPhase === 'summary') {
    return (
      <PageLayout variant="lesson" hero={header}>
        <main className="flex w-full items-center justify-center px-10 py-10">
          <LexiconReviewSummary
            ratings={ratings}
            onStartExercises={() => setFlowPhase('practice')}
            onFinish={() => router.push(`/lexicon/${categoryId}`)}
          />
        </main>
      </PageLayout>
    )
  }

  if (flowPhase === 'practice') {
    const sessionConfig = {
      context: 'practice' as const,
      exercises: practiceExercises,
      sessionLength: Math.min(10, practiceExercises.length),
      onSessionComplete: handleSessionComplete,
      onExit: () => router.push(`/lexicon/${categoryId}`),
    }
    return (
      <PageLayout variant="lesson" hero={header}>
        <main className="animate-fadeIn flex w-full items-center justify-center px-10 py-10">
          <PracticeSession key={sessionKey} {...sessionConfig} />
        </main>
      </PageLayout>
    )
  }

  return null
}
