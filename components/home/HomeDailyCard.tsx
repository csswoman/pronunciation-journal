'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Flame } from "@/components/icons"
import Button from '@/components/ui/Button'
import DailyStepList, { readInProgressStepId } from '@/components/daily/DailyStepList'
import { useDailyPlan, type ConceptLesson, type DailyStep } from '@/hooks/useDailyPlan'
import { useAuth } from '@/components/auth/AuthProvider'

interface HomeDailyCardProps {
  conceptLesson: ConceptLesson | null
}

export default function HomeDailyCard({ conceptLesson }: HomeDailyCardProps) {
  const { user } = useAuth()
  const router = useRouter()
  const { status, steps, getStepStatus, completedCount, allDone, load, celebrate } = useDailyPlan({
    conceptLesson,
    autoLoad: false,
  })
  const [inProgressStepId, setInProgressStepId] = useState<string | null>(null)

  useEffect(() => {
    if (user && status === 'idle') void load()
  }, [user, status, load])

  useEffect(() => {
    if (allDone) celebrate()
  }, [allDone, celebrate])

  useEffect(() => {
    setInProgressStepId(readInProgressStepId())
  }, [status, steps])

  const handleStartStep = useCallback((step: DailyStep) => {
    if (step.kind === 'concept') return
    try {
      sessionStorage.setItem('daily:step', JSON.stringify({ stepId: step.id, exerciseIndex: 0 }))
    } catch { /* quota errors: ignore */ }
    router.push(`/daily?step=${step.id}`)
  }, [router])

  const remainingMinutes = useMemo(() => {
    return steps.reduce((sum, s) => {
      const st = getStepStatus(s.id)
      if (st === 'done' || st === 'resolved') return sum
      return sum + (s.estMinutes || 0)
    }, 0)
  }, [steps, getStepStatus])

  const progressLabel = useMemo(() => {
    if (steps.length === 0) return ''
    // Never show "0 de N" — demotivating at start of day (home hierarchy spec).
    if (completedCount === 0) {
      const parts = [
        `${steps.length} ${steps.length === 1 ? 'paso' : 'pasos'}`,
      ]
      if (inProgressStepId) parts.push('en curso')
      if (remainingMinutes > 0) parts.push(`≈${remainingMinutes} min`)
      return parts.join(' · ')
    }
    const parts = [`${completedCount} de ${steps.length}`]
    if (inProgressStepId) parts.push('en curso')
    if (remainingMinutes > 0) parts.push(`≈${remainingMinutes} min restantes`)
    return parts.join(' · ')
  }, [steps.length, completedCount, inProgressStepId, remainingMinutes])

  return (
    <section>
      <div className="flex flex-col rounded-xl border border-border-default bg-daily-card px-6 pb-6 pt-5 shadow-sm">
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {status === 'ready' && !allDone && `Plan de hoy listo, ${steps.length} pasos`}
          {status === 'ready' && allDone && 'Plan diario completo'}
        </div>

        {(status === 'loading' || status === 'idle') && (
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-3 w-6 shrink-0 animate-pulse rounded bg-surface-sunken" />
                <div
                  className="h-4 flex-1 animate-pulse rounded-md bg-surface-sunken"
                  style={{ width: `${70 + (i % 3) * 10}%` }}
                />
              </div>
            ))}
            <p className="font-body-sm mt-2 animate-pulse text-center text-fg-muted">
              Preparando tu plan…
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="animate-state-in flex flex-col items-center gap-3 py-8 text-center">
            <p className="font-body-sm text-error">No se pudo preparar tu plan.</p>
            <Button type="button" variant="primary" size="md" onClick={() => void load()}>
              Reintentar
            </Button>
          </div>
        )}

        {status === 'ready' && !allDone && steps.length === 0 && (
          <div className="animate-state-in flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex flex-col gap-1.5">
              <p className="font-label font-semibold text-fg">
                Tu plan está vacío hoy.
              </p>
              <p className="font-body-sm max-w-[28ch] text-fg-muted">
                Se arma cuando empiezas un curso o practicas sonidos.
              </p>
            </div>
            <Link href="/courses">
              <Button variant="primary" size="md" icon={<ArrowRight size={18} />} iconPosition="right">
                Explorar cursos
              </Button>
            </Link>
          </div>
        )}

        {status === 'ready' &&
          (allDone ? (
            <div className="animate-state-in flex flex-col items-center gap-3 py-6 text-center">
              <div className="animate-step-done grid h-12 w-12 place-items-center rounded-full bg-success-soft text-success">
                <Flame size={24} />
              </div>
              <p className="font-label font-semibold text-fg">¡Plan completo!</p>
              <p className="font-body-sm max-w-xs text-fg-muted">
                Terminaste los {steps.length} pasos de hoy.
              </p>
              <Link href="/practice/sounds">
                <Button variant="secondary" size="md" icon={<ArrowRight size={18} />} iconPosition="right">
                  Práctica libre
                </Button>
              </Link>
            </div>
          ) : steps.length > 0 ? (
            <div className="animate-state-in">
              <div className="mb-4 flex items-center gap-2.5">
                <span className="font-label shrink-0 text-fg">Plan de hoy</span>
                <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-primary-soft">
                  <div
                    className="progress-fill progress-fill-mount h-full w-full rounded-full bg-primary"
                    style={{ transform: `scaleX(${steps.length ? completedCount / steps.length : 0})` }}
                  />
                </div>
                <span className="font-caption shrink-0 tabular-nums text-fg-muted">
                  {progressLabel}
                </span>
              </div>
              <DailyStepList
                steps={steps}
                getStepStatus={getStepStatus}
                onStartStep={handleStartStep}
                inProgressStepId={inProgressStepId}
              />
            </div>
          ) : null)}
      </div>
    </section>
  )
}
