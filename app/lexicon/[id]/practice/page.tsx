'use client'

// Planned structure:
// <LexiconPracticePage>
//   <PracticeHeader />          // back button + lesson title
//   <PracticeSession />         // ad-hoc session, no persistence
// </LexiconPracticePage>

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import PracticeSession from '@/components/practice/PracticeSession'
import PageLayout from '@/components/layout/PageLayout'
import Button from '@/components/ui/Button'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { generateMatchPairsFromWordBank } from '@/lib/exercises/generators/match-pairs'
import { fromGenericExercise } from '@/lib/practice/adapters'
import type { PracticeExercise, SessionResult } from '@/lib/practice/types'
import type { WordBankEntry } from '@/lib/word-bank/types'
import type { WordEntry } from '@/lib/lexicon/types'

type LoadState = 'idle' | 'loading' | 'ready' | 'error'

const MAX_MATCH_PAIRS = 6

export default function LexiconPracticePage() {
  const params = useParams()
  const categoryId = params.id as string
  const router = useRouter()
  const { user } = useAuth()

  const [lessonName, setLessonName] = useState('')
  const [exercises, setExercises] = useState<PracticeExercise[]>([])
  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [sessionKey, setSessionKey] = useState(0)

  const load = useCallback(async () => {
    if (!user) return
    setLoadState('loading')
    setError(null)

    try {
      // One request: get lexicon words + any existing word_bank rows.
      // No upsert — learned status is only set when the user explicitly marks a word.
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
        words: WordEntry[]
        wordBankRows: WordBankEntry[]
      }

      if (words.length === 0) throw new Error('No exercises available for this lesson')

      // Build a lookup of existing word_bank rows by their source_ref so we can
      // prefer real rows (with SRS data) when they exist.
      const bySourceRef = new Map(wordBankRows.map((r) => [r.source_ref, r]))

      // Shape every lexicon word into a WordBankEntry for the generators.
      // Words already in word_bank use their real row (SRS updates will fire).
      // Words not yet learned get a synthetic entry — source_ref points to the
      // lexicon id, but there's no matching word_bank row, so SRS is silently
      // skipped for them (correct: they haven't been marked learned).
      const entries: WordBankEntry[] = words.map((w) => {
        const real = bySourceRef.get(w.id)
        if (real) return real
        return {
          id: `lexicon:${w.id}`,
          user_id: '',
          text: w.word,
          meaning: w.definition,
          example: w.example ?? null,
          difficulty: w.difficulty ?? 0,
          source: 'lexicon',
          source_ref: w.id,
          status: 'ready',
          srs_status: 'new',
          audio_url: null,
          ipa: null,
          context: null,
          created_at: '',
          updated_at: '',
          ease_factor: 2.5,
          interval_days: 0,
          repetitions: 0,
          review_count: 0,
          last_reviewed_at: null,
          next_review_at: null,
          error_reason: null,
          has_audio: null,
          audio_fetch_attempts: 0,
          image_prompt: null,
          synonyms: null,
          translation: null,
        } satisfies WordBankEntry
      })

      // match_pairs works from word + definition alone — no example needed.
      // fill_blank / reorder_words are added when entries have example sentences.
      const matchPairs = generateMatchPairsFromWordBank(entries, MAX_MATCH_PAIRS)
      const allExercises: PracticeExercise[] = matchPairs.map((ex) =>
        fromGenericExercise(ex, 'practice')
      )

      if (allExercises.length === 0) throw new Error('Not enough words to build exercises (need at least 2)')

      // Derive lesson name from the first word's category (available in response later if needed).
      setLessonName(categoryId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
      setExercises(allExercises)
      setSessionKey((k) => k + 1)
      setLoadState('ready')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exercises')
      setLoadState('error')
    }
  }, [categoryId, user])

  useEffect(() => {
    load()
  }, [load])

  const sessionConfig = useMemo(() => {
    if (exercises.length === 0) return null
    return {
      context: 'practice' as const,
      exercises,
      sessionLength: Math.min(10, exercises.length),
      onSessionComplete: (_result: SessionResult) => {
        // No-op: session summary handles it inline.
      },
      onExit: () => router.push(`/lexicon/${categoryId}`),
    }
  }, [exercises, categoryId, router])

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

  if (loadState !== 'ready' || !sessionConfig) {
    return (
      <PageLayout variant="lesson" hero={header}>
        <div className="flex items-center justify-center py-20">
          <span className="animate-pulse text-fg-subtle">Preparing exercises…</span>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout variant="lesson" hero={header}>
      <main className="animate-fadeIn flex w-full items-center justify-center px-10 py-10">
        <PracticeSession key={sessionKey} {...sessionConfig} />
      </main>
    </PageLayout>
  )
}
