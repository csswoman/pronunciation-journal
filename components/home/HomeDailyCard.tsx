'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Flame } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import PracticeSession from '@/components/practice/PracticeSession'
import DailyStepList from '@/components/daily/DailyStepList'
import { useDailyPlan, type ConceptLesson, type DailyStep } from '@/hooks/useDailyPlan'
import { useAuth } from '@/components/auth/AuthProvider'
import type { DailyStreakResult } from '@/lib/daily/streak'

interface HomeDailyCardProps {
  streak?: DailyStreakResult
  conceptLesson: ConceptLesson | null
}

const CARD_STYLE = {
  background:
    'linear-gradient(150deg, color-mix(in oklch, var(--primary) 12%, transparent), var(--surface-raised) 65%)',
}
export default function HomeDailyCard({ streak, conceptLesson }: HomeDailyCardProps) {
  const { user } = useAuth()
  const { status, steps, doneIds, completedCount, allDone, load, markDone, celebrate } = useDailyPlan({
    conceptLesson,
    autoLoad: false,
  })

  const [activeStep, setActiveStep] = useState<DailyStep | null>(null)
  const [sessionKey, setSessionKey] = useState(0)

  // Carga el plan en cuanto el usuario esté disponible, una vez por día.
  useEffect(() => {
    if (user && (status === 'idle' || status === 'error')) void load()
  }, [user, status, load])

  // Celebra una vez cuando todos los pasos quedan hechos.
  useEffect(() => {
    if (allDone && !activeStep) celebrate()
  }, [allDone, activeStep, celebrate])

  const handleStartStep = useCallback((step: DailyStep) => {
    if (step.kind === 'concept') return
    setSessionKey((k) => k + 1)
    setActiveStep(step)
  }, [])

  // ── Overlay de sesión a pantalla completa ──────────────────────────────────
  if (activeStep) {
    return (
      <div className="fixed inset-0 z-50 bg-[var(--surface-base)]">
        <PracticeSession
          key={sessionKey}
          context="daily"
          exercises={activeStep.exercises}
          sessionLength={activeStep.exercises.length}
          sessionLabel={activeStep.title}
          onSessionComplete={() => markDone(activeStep.id)}
          onExit={() => setActiveStep(null)}
        />
      </div>
    )
  }

  // ── Checklist embebido (único estado) ─────────────────────────────────────
  return (
    <div className="flex flex-col rounded-[var(--radius-xl)] border border-border-subtle p-6" style={CARD_STYLE}>
      {(status === 'loading' || status === 'idle') && (
        <div className="flex flex-col gap-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-7 w-7 shrink-0 rounded-md bg-surface-sunken animate-pulse" />
              <div className="h-4 flex-1 rounded-md bg-surface-sunken animate-pulse" style={{ width: `${70 + (i % 3) * 10}%` }} />
            </div>
          ))}
          <p className="mt-2 text-center text-xs text-[var(--text-tertiary)] animate-pulse">
            Preparing your plan…
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-error">Couldn't prepare your plan.</p>
          <Button type="button" variant="primary" size="sm" onClick={() => void load()}>
            Retry
          </Button>
        </div>
      )}

      {status === 'ready' &&
        (allDone ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--hue-icon-bg)] text-[var(--primary)]">
              <Flame size={24} />
            </div>
            <p className="text-base font-semibold text-[var(--text-primary)]">Daily complete!</p>
            <p className="max-w-xs text-xs text-[var(--text-secondary)]">
              You completed all {steps.length} steps today. Your streak is alive.
            </p>
            <Link href="/practice/sounds">
              <Button variant="secondary" size="sm" icon={<ArrowRight size={14} />} iconPosition="right">
                Free practice
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-3">
              <Badge label="Today's plan" variant="default" className="shrink-0" />
              <div className="flex-1 overflow-hidden rounded-full bg-surface-sunken h-1.5">
                <div
                  className="h-full rounded-full bg-[var(--primary)] origin-left transition-transform duration-300 ease-out"
                  style={{ transform: `scaleX(${steps.length ? completedCount / steps.length : 0})` }}
                />
              </div>
              <span className="shrink-0 text-xs text-[var(--text-tertiary)]">
                {completedCount} of {steps.length}
              </span>
            </div>
            <DailyStepList
              steps={steps}
              doneIds={doneIds}
              onStartStep={handleStartStep}
              onMarkDone={markDone}
            />
          </>
        ))}
    </div>
  )
}
