'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Flame, Sparkles } from 'lucide-react'
import PageLayout from '@/components/layout/PageLayout'
import DailyStepSession from './DailyStepSession'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import DailyStepList from './DailyStepList'
import { useDailyPlan, type ConceptLesson, type DailyStep } from '@/hooks/useDailyPlan'

export type { ConceptLesson }

// ── sessionStorage helpers ──────────────────────────────────────────────────

const STORAGE_KEY = 'daily:step'

function readStepStorage(): { stepId: string; exerciseIndex: number } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as { stepId: string; exerciseIndex: number }
  } catch {
    return null
  }
}

function writeStepStorage(stepId: string, exerciseIndex: number): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ stepId, exerciseIndex }))
  } catch { /* quota errors: ignore */ }
}

function clearStepStorage(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch { /* ignore */ }
}

// ── Types ───────────────────────────────────────────────────────────────────

interface DailyChecklistProps {
  conceptLesson: ConceptLesson | null
  initialStepId?: string
}

type View =
  | { mode: 'checklist' }
  | { mode: 'step'; step: DailyStep; exerciseIndex: number }
  | { mode: 'done' }

// ── Component ───────────────────────────────────────────────────────────────

export default function DailyChecklist({ conceptLesson, initialStepId }: DailyChecklistProps) {
  const router = useRouter()
  const { status, steps, getStepStatus, completedCount, allDone, load, markDone, celebrate } = useDailyPlan({
    conceptLesson,
    autoLoad: true,
  })

  const [view, setView] = useState<View>({ mode: 'checklist' })
  const [sessionKey, setSessionKey] = useState(0)
  // Prevents double-triggering the initialStepId auto-start.
  const autoStartedRef = useRef(false)

  // Auto-start: when plan is ready and we have a step from the URL.
  useEffect(() => {
    if (status !== 'ready' || !initialStepId || autoStartedRef.current) return
    const step = steps.find((s) => s.id === initialStepId)
    if (!step || step.kind === 'concept') return
    autoStartedRef.current = true
    const stored = readStepStorage()
    const exerciseIndex = stored?.stepId === initialStepId ? (stored.exerciseIndex ?? 0) : 0
    setSessionKey((k) => k + 1)
    setView({ mode: 'step', step, exerciseIndex })
  }, [status, steps, initialStepId])

  // Celebrate once when all steps are complete.
  useEffect(() => {
    if (allDone && view.mode === 'checklist') {
      setView({ mode: 'done' })
      celebrate()
    }
  }, [allDone, view.mode, celebrate])

  const handleStartStep = useCallback((step: DailyStep) => {
    if (step.kind === 'concept') return
    writeStepStorage(step.id, 0)
    setSessionKey((k) => k + 1)
    setView({ mode: 'step', step, exerciseIndex: 0 })
    router.replace(`/daily?step=${step.id}`)
  }, [router])

  const handleComplete = useCallback((stepId: string) => {
    clearStepStorage()
    markDone(stepId)
    router.replace('/daily')
    setView({ mode: 'checklist' })
  }, [markDone, router])

  const handleExit = useCallback(() => {
    clearStepStorage()
    router.replace('/daily')
    setView({ mode: 'checklist' })
  }, [router])

  // ── Render: estados de carga / error ──────────────────────────────────────
  if (status === 'loading' || status === 'idle') {
    return (
      <div className="phoneme-focus fixed inset-0 z-40 flex items-center justify-center">
        <div className="animate-pulse text-fg-subtle">Preparing your plan…</div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="phoneme-focus fixed inset-0 z-40 flex items-center justify-center p-6">
        <div className="space-y-3 text-center">
          <p className="text-error">Couldn't prepare your plan. Please try again.</p>
          <Button type="button" variant="primary" size="sm" onClick={load}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  // ── Render: sesión de un paso ──────────────────────────────────────────────
  if (view.mode === 'step') {
    const { step, exerciseIndex } = view
    return (
      <DailyStepSession
        step={step}
        sessionKey={sessionKey}
        initialExerciseIndex={exerciseIndex}
        onComplete={() => handleComplete(step.id)}
        onExit={handleExit}
      />
    )
  }

  // ── Render: pantalla "diaria cumplida" ─────────────────────────────────────
  if (view.mode === 'done') {
    return (
      <PageLayout className="mx-auto max-w-[640px]">
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-[var(--hue-icon-bg)] text-[var(--primary)]">
            <Flame size={30} />
          </div>
          <h1 className="text-3xl font-medium text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display), serif' }}>
            Daily complete!
          </h1>
          <p className="max-w-sm text-[15px] text-[var(--text-secondary)]">
            You completed all {steps.length} steps today. Your streak is alive — come back tomorrow.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link href="/">
              <Button variant="primary" size="md">
                Go back home
              </Button>
            </Link>
            <Link href="/practice/sounds">
              <Button variant="secondary" size="md" icon={<ArrowRight size={15} />} iconPosition="right">
                Free practice
              </Button>
            </Link>
          </div>
        </div>
      </PageLayout>
    )
  }

  // ── Render: checklist ──────────────────────────────────────────────────────
  return (
    <PageLayout className="mx-auto max-w-[680px]">
      <header className="mb-6">
        <Badge label="Today's plan" variant="default" className="mb-3" />
        <h1 className="text-3xl font-medium text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display), serif' }}>
          Your daily
        </h1>
        <p className="mt-1 text-[15px] text-[var(--text-secondary)]">
          {completedCount} of {steps.length} steps · complete all {steps.length} to keep your streak.
        </p>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
          <div
            className="h-full w-full rounded-full bg-[var(--primary)] origin-left transition-transform duration-300 ease-out"
            style={{ transform: `scaleX(${steps.length ? completedCount / steps.length : 0})` }}
          />
        </div>
      </header>

      <DailyStepList
        steps={steps}
        getStepStatus={getStepStatus}
        onStartStep={handleStartStep}
        onMarkDone={markDone}
      />

      <div className="mt-8 flex flex-col items-center gap-2 text-center">
        <Link href="/practice/sounds" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">
          <Sparkles size={14} />
          Want free practice? Choose what to work on.
        </Link>
      </div>
    </PageLayout>
  )
}
