'use client'

// Planned structure:
// <LexiconPracticePage>
//   phase=review   → <LexiconReviewPhase />
//   phase=summary  → <LexiconReviewSummary />
//   phase=practice → <PracticeSession />
//   phase=done     → redirect to words lesson
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
      clear()
      setFlowPhase('done')
    },
    [user, clear, setFlowPhase],
  )

  useEffect(() => {
    if (flowPhase === 'done') {
      router.push(`/words/${categoryId}`)
    }
  }, [flowPhase, categoryId, router])

  const header = (
    <header className="sticky top-0 z-10 border-b border-border-subtle bg-surface-base/90 backdrop-blur-md">
      <div className="flex items-center justify-between px-6 py-3.5 max-w-4xl mx-auto">
        <button
          type="button"
          onClick={() => { clear(); router.push('/words?mode=learn') }}
          aria-label="Volver a la pestaña de Aprender"
          className="inline-flex items-center gap-1.5 text-body-sm font-medium text-fg-muted hover:text-fg transition-colors focus-ring rounded-lg p-1"
        >
          <span aria-hidden>←</span>
          <span>Volver</span>
        </button>

        <div className="flex flex-col items-center text-center truncate max-w-xs">
          <span className="font-kicker text-fg-subtle">Léxico</span>
          <span className="text-body-sm font-bold text-fg truncate">{lessonName}</span>
        </div>

        <div className="w-16" />
      </div>
    </header>
  )

  if (loadState === 'error') {
    return (
      <PageLayout variant="lesson" hero={header}>
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center px-6">
          <p className="text-error text-body-sm font-medium">{error ?? 'No se pudo preparar la sesión'}</p>
          <Button type="button" onClick={reload} variant="primary" size="sm">Reintentar</Button>
        </div>
      </PageLayout>
    )
  }

  if (loadState !== 'ready') {
    return (
      <PageLayout variant="lesson" hero={header}>
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-fg-subtle text-body-sm animate-pulse">Preparando tarjetas de repaso…</span>
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
        <main className="flex w-full items-center justify-center px-6 py-10">
          <LexiconReviewSummary
            ratings={ratings}
            onStartExercises={() => setFlowPhase('practice')}
            onFinish={() => { clear(); router.push(`/words/${categoryId}`) }}
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
        router.push(`/words/${categoryId}`)
      },
    }

    return <PracticeSession key={sessionKey} {...sessionConfig} />
  }

  return null
}
