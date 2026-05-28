'use client'

// Planned structure:
// <LexiconPracticePage>
//   phase=review   → <LexiconReviewPhase />
//   phase=summary  → <LexiconReviewSummary />
//   phase=practice → <PracticeSession />
//   phase=done     → redirect to lexicon lesson
// </LexiconPracticePage>

import { useCallback, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import PracticeSession from '@/components/practice/PracticeSession'
import { LexiconReviewPhase } from '@/components/lexicon/practice/LexiconReviewPhase'
import { LexiconReviewSummary } from '@/components/lexicon/practice/LexiconReviewSummary'
import PageLayout from '@/components/layout/PageLayout'
import Button from '@/components/ui/Button'
import { applyPhase2Penalty } from '@/lib/word-bank/srs-queries'
import { useLexiconPracticeSession } from '@/hooks/useLexiconPracticeSession'
import type { SessionResult } from '@/lib/practice/types'

export default function LexiconPracticePage() {
  const params = useParams()
  const categoryId = params.id as string
  const router = useRouter()
  const { user } = useAuth()

  const {
    lessonName, allEntries, posMap, loadState, error,
    flowPhase, ratings, practiceExercises, sessionKey,
    setFlowPhase, handleReviewComplete, reload, clear,
  } = useLexiconPracticeSession(categoryId, user?.id)

  const forgotEntryMap = useMemo(() => {
    return new Map(
      ratings.filter((r) => r.rating === 'forgot').map((r) => [r.entry.id, r.entry])
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
      clear()
      setFlowPhase('done')
    },
    [user, forgotEntryMap, clear, setFlowPhase],
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
          onClick={() => { clear(); router.push(`/lexicon/${categoryId}`) }}
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
          <Button type="button" onClick={reload} variant="primary" size="sm">Retry</Button>
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
          posMap={posMap}
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
            onFinish={() => { clear(); router.push(`/lexicon/${categoryId}`) }}
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
      onExit: () => { clear(); router.push(`/lexicon/${categoryId}`) },
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
