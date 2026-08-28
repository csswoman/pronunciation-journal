'use client'

// Planned structure:
// <LexiconPracticePage>
//   phase=review   → <LexiconReviewPhase />
//   phase=summary  → <LexiconReviewSummary />
//   phase=practice → <PracticeSession />
//   phase=done     → redirect to lexicon lesson
// </LexiconPracticePage>

import { useCallback, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import PracticeSession from '@/components/practice/PracticeSession'
import { LexiconReviewPhase } from '@/components/lexicon/practice/LexiconReviewPhase'
import { LexiconReviewSummary } from '@/components/lexicon/practice/LexiconReviewSummary'
import PageLayout from '@/components/layout/PageLayout'
import Button from '@/components/ui/Button'
import { useLexiconPracticeSession } from '@/hooks/useLexiconPracticeSession'

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

  const handleSessionComplete = useCallback(
    async () => {
      if (!user) return
      // Per-exercise SRS is handled in savePracticeAnswer with plan-062 attribution.
      // Do not invent group penalties from aggregate match_pairs scores.
      clear()
      setFlowPhase('done')
    },
    [user, clear, setFlowPhase],
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
          className="border-none bg-transparent p-1 text-h4 leading-none text-fg-subtle"
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
          <p className="text-error text-body-sm">{error}</p>
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
    const sessionLabel =
      lessonName.length > 22 ? `${lessonName.slice(0, 20).trim()}…` : lessonName

    const sessionConfig = {
      context: 'practice' as const,
      exercises: practiceExercises,
      sessionLength: Math.min(10, practiceExercises.length),
      sessionLabel,
      onSessionComplete: handleSessionComplete,
      onExit: () => {
        clear()
        router.push(`/lexicon/${categoryId}`)
      },
    }

    return <PracticeSession key={sessionKey} {...sessionConfig} />
  }

  return null
}
