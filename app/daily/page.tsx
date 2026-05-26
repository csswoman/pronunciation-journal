'use client'

// Planned structure:
// <DailyPage>
//   <DailyHeader />         (back button + title)
//   <PracticeSession />     (exercises rendered inline)
//   <DailySummary />        (shown on completion via onSessionComplete)
// </DailyPage>

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import PracticeSession from '@/components/practice/PracticeSession'
import PageLayout from '@/components/layout/PageLayout'
import Button from '@/components/ui/Button'
import { buildDailyPlan, EmptyWordBankError } from '@/lib/practice/daily-plan'
import type { PracticeExercise, SessionResult } from '@/lib/practice/types'

export default function DailyPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [exercises, setExercises] = useState<PracticeExercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [emptyWordBank, setEmptyWordBank] = useState(false)
  const [sessionKey, setSessionKey] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [finalResult, setFinalResult] = useState<SessionResult | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    setEmptyWordBank(false)
    try {
      const plan = await buildDailyPlan(user.id)
      setExercises(plan)
      setSessionKey(k => k + 1)
    } catch (err) {
      if (err instanceof EmptyWordBankError) {
        setEmptyWordBank(true)
      } else {
        setError('Failed to load today\'s plan. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  const handleSessionComplete = useCallback((result: SessionResult) => {
    setCompleted(true)
    setFinalResult(result)
  }, [])

  const sessionConfig = useMemo(() => {
    if (exercises.length === 0 || !user) return null
    return {
      context: 'daily' as const,
      exercises,
      sessionLength: exercises.length,
      onSessionComplete: handleSessionComplete,
      onExit: () => router.push('/daily'),
    }
  }, [exercises, handleSessionComplete, router, user])

  const header = (
    <header className="sticky top-0 z-10 border-b border-[var(--border-subtle)] bg-[var(--surface-base)]">
      <div className="flex items-center justify-between px-10 pt-6 pb-4">
        <button
          type="button"
          onClick={() => router.push('/daily')}
          className="border-none bg-transparent p-1 text-xl leading-none text-fg-subtle"
          aria-label="Back"
        >
          ←
        </button>
        <span className="text-sm font-semibold tracking-wide text-fg-subtle uppercase">
          Daily Practice
        </span>
        <div className="w-6" />
      </div>
    </header>
  )

  if (emptyWordBank) {
    return (
      <PageLayout variant="lesson" hero={header}>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-base text-fg-subtle">
            Your word bank is empty. Add words from the Lexicon to unlock daily practice.
          </p>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => router.push('/lexicon')}
          >
            Go to Lexicon
          </Button>
        </div>
      </PageLayout>
    )
  }

  if (error) {
    return (
      <PageLayout variant="lesson" hero={header}>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-error">{error}</p>
          <Button type="button" variant="primary" size="sm" onClick={load}>
            Retry
          </Button>
        </div>
      </PageLayout>
    )
  }

  if (loading || !sessionConfig) {
    return (
      <PageLayout variant="lesson" hero={header}>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="animate-pulse text-fg-subtle">Building today's plan…</div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout variant="lesson" hero={header}>
      <main className="animate-fadeIn flex w-full items-center justify-center px-10 py-10">
        <PracticeSession key={sessionKey} {...sessionConfig} />
      </main>
      {completed && finalResult && (
        <p className="pb-8 text-center text-xs text-fg-subtle">
          {finalResult.accuracy}% accuracy · {finalResult.results.length} exercises
        </p>
      )}
    </PageLayout>
  )
}
