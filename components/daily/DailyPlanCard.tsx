'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight } from '@/components/icons'
import Button from '@/components/ui/Button'
import DailyStepList, { readInProgressStepId } from '@/components/daily/DailyStepList'
import { PlanSegmentProgress } from '@/components/home/PlanSegmentProgress'
import type {
  DailyPlanStatus,
  DailyStep,
  DailyStepStatus,
} from '@/hooks/useDailyPlan'

// Planned structure:
// <DailyPlanCard>
//   <loading | error | empty | ready list>
//   <PlanSegmentProgress />
//   {listPrefix}
//   <DailyStepList collapseFutureSteps />
// </DailyPlanCard>

export interface DailyPlanCardProps {
  status: DailyPlanStatus
  steps: DailyStep[]
  getStepStatus: (stepId: string) => DailyStepStatus
  completedCount: number
  allDone: boolean
  onStartStep: (step: DailyStep) => void
  onRetry?: () => void
  collapseFutureSteps?: boolean
  reviewDue?: boolean
  isNewLearner?: boolean
  demoteEntryHighlight?: boolean
  inProgressStepId?: string | null
  listPrefix?: ReactNode
}

export default function DailyPlanCard({
  status,
  steps,
  getStepStatus,
  completedCount,
  allDone,
  onStartStep,
  onRetry,
  collapseFutureSteps = false,
  reviewDue = false,
  isNewLearner = false,
  demoteEntryHighlight = false,
  inProgressStepId: inProgressStepIdProp,
  listPrefix,
}: DailyPlanCardProps) {
  const [inProgressStepId, setInProgressStepId] = useState<string | null>(null)

  useEffect(() => {
    if (inProgressStepIdProp !== undefined) {
      setInProgressStepId(inProgressStepIdProp)
      return
    }
    setInProgressStepId(readInProgressStepId())
  }, [status, steps, inProgressStepIdProp])

  const entryStep = useMemo(() => {
    return steps.find((s) => {
      const st = getStepStatus(s.id)
      return st !== 'done' && st !== 'resolved'
    })
  }, [steps, getStepStatus])

  const remainingMinutes = useMemo(() => {
    return steps.reduce((sum, s) => {
      const st = getStepStatus(s.id)
      if (st === 'done' || st === 'resolved') return sum
      return sum + (s.estMinutes || 0)
    }, 0)
  }, [steps, getStepStatus])

  const progressLabel = useMemo(() => {
    if (steps.length === 0) return ''
    if (completedCount === 0) {
      const parts = [`${steps.length} ${steps.length === 1 ? 'paso' : 'pasos'}`]
      if (inProgressStepId) parts.push('en curso')
      if (remainingMinutes > 0) parts.push(`${remainingMinutes} min`)
      return parts.join(' · ')
    }
    const parts = [`${completedCount} de ${steps.length}`]
    if (inProgressStepId) parts.push('en curso')
    if (remainingMinutes > 0) parts.push(`${remainingMinutes} min restantes`)
    return parts.join(' · ')
  }, [steps.length, completedCount, inProgressStepId, remainingMinutes])

  return (
    <section aria-label="Plan de hoy">
      <div className="flex flex-col rounded-xl border border-border-default bg-daily-card px-[var(--layout-card-pad)] pb-[var(--layout-card-pad)] pt-5 shadow-sm motion-reduce:shadow-none">
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {status === 'ready' && !allDone && `Plan de hoy listo, ${steps.length} pasos`}
          {status === 'ready' && allDone && 'Plan diario completo'}
        </div>

        {(status === 'loading' || status === 'idle') && (
          <div className="flex flex-col gap-5" aria-hidden>
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-3">
                <div className="h-5 w-28 animate-pulse rounded-md bg-surface-sunken" />
                <div className="h-4 w-24 animate-pulse rounded-md bg-surface-sunken" />
              </div>
              <div className="flex min-w-0 flex-1 gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-2.5 min-w-0 flex-1 animate-pulse rounded-full bg-surface-sunken" />
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              {(['w-4/5', 'w-3/4', 'w-11/12', 'w-2/3', 'w-5/6'] as const).map((widthClass, i) => (
                <div
                  key={i}
                  className="flex min-h-11 w-full flex-col gap-2 rounded-[var(--radius-md)] border border-transparent px-3.5 py-3.5"
                >
                  <div className="flex w-full items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className={`h-4 animate-pulse rounded-md bg-surface-sunken ${widthClass}`} />
                      <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-surface-sunken" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="sr-only">Preparando tu plan…</p>
          </div>
        )}

        {status === 'error' && (
          <div className="animate-state-in flex flex-col items-center gap-3 py-[var(--layout-section-gap)] text-center">
            <p className="font-body-sm text-error">No se pudo preparar tu plan.</p>
            {onRetry ? (
              <Button type="button" variant="primary" size="md" onClick={() => void onRetry()}>
                Reintentar
              </Button>
            ) : null}
          </div>
        )}

        {status === 'ready' && !allDone && steps.length === 0 && (
          <div className="animate-state-in flex flex-col items-center gap-4 py-[var(--layout-section-gap)] text-center">
            <div className="flex flex-col gap-1.5">
              <p className="font-label font-semibold text-fg">
                {reviewDue
                  ? 'Después del repaso, arma tu plan.'
                  : isNewLearner
                    ? 'Aquí verás tu plan del día'
                    : 'Tu plan está vacío hoy.'}
              </p>
              <p className="font-body-sm max-w-[36ch] text-pretty text-fg-muted">
                {isNewLearner && !reviewDue
                  ? 'Cuando practiques sonidos o un curso, aparecen pasos claros para hoy.'
                  : 'Se arma cuando empiezas un curso o practicas sonidos.'}
              </p>
            </div>
            {!isNewLearner || reviewDue ? (
              <Link href="/courses">
                <Button
                  variant={reviewDue ? 'secondary' : 'primary'}
                  size="md"
                  icon={<ArrowRight size={18} />}
                  iconPosition="right"
                >
                  Explorar cursos
                </Button>
              </Link>
            ) : null}
          </div>
        )}

        {status === 'ready' && allDone ? (
          <p className="sr-only">Plan diario completo</p>
        ) : null}

        {status === 'ready' && !allDone && steps.length > 0 ? (
          <div className="animate-state-in flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-h4 shrink-0 text-fg">Plan de hoy</h2>
                <span className="font-caption shrink-0 tabular-nums text-fg-muted">
                  {completedCount > 0 ? (
                    <>
                      <span className="font-semibold text-primary">{completedCount}</span>
                      {` de ${steps.length}`}
                      {inProgressStepId ? ' · en curso' : ''}
                      {remainingMinutes > 0 ? ` · ${remainingMinutes} min restantes` : ''}
                    </>
                  ) : (
                    progressLabel
                  )}
                </span>
              </div>
              <PlanSegmentProgress
                stepIds={steps.map((s) => s.id)}
                completedCount={completedCount}
                getStepStatus={getStepStatus}
                activeStepId={inProgressStepId}
                entryStepId={entryStep?.id ?? null}
              />
            </div>
            {listPrefix}
            <DailyStepList
              steps={steps}
              getStepStatus={getStepStatus}
              onStartStep={onStartStep}
              inProgressStepId={inProgressStepId}
              demoteEntryHighlight={demoteEntryHighlight}
              collapseFutureSteps={collapseFutureSteps}
            />
          </div>
        ) : null}
      </div>
    </section>
  )
}
