'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight } from '@/components/icons'
import Button from '@/components/ui/Button'
import DailyStepList, { readInProgressStepId } from '@/components/daily/DailyStepList'
import HomeFirstSessionHint from '@/components/home/HomeFirstSessionHint'
import { PlanSegmentProgress } from '@/components/home/PlanSegmentProgress'
import { useDailyPlan, type ConceptLesson, type DailyStep } from '@/hooks/useDailyPlan'
import { useAuth } from '@/components/auth/AuthProvider'
import type { SessionArc } from '@/lib/practice/types'

/** Review kinds already surfaced as plan step 01 — banner would duplicate the CTA. */
const REVIEW_ENTRY_KINDS = new Set(['word_review', 'word_intro'])

export interface HomePlanStatus {
  empty: boolean
  settled: boolean
  reviewIsEntry: boolean
  conceptSlug: string | null
  allDone: boolean
  arc: SessionArc | undefined
  stepCount: number
}

interface HomeDailyCardProps {
  conceptLesson: ConceptLesson | null
  reviewDue?: boolean
  isNewLearner?: boolean
  showFirstSessionHint?: boolean
  onPlanStatusChange?: (status: HomePlanStatus) => void
}

function isReviewEntryStep(step: DailyStep | undefined): boolean {
  if (!step) return false
  if (REVIEW_ENTRY_KINDS.has(step.kind)) return true
  return step.id.startsWith('review_sound:') || step.id === 'failed_sentences'
}

export default function HomeDailyCard({
  conceptLesson,
  reviewDue = false,
  isNewLearner = false,
  showFirstSessionHint = false,
  onPlanStatusChange,
}: HomeDailyCardProps) {
  const { user } = useAuth()
  const router = useRouter()
  const { status, steps, getStepStatus, completedCount, allDone, arc, load, celebrate } = useDailyPlan({
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

  const entryStep = useMemo(() => {
    return steps.find((s) => {
      const st = getStepStatus(s.id)
      return st !== 'done' && st !== 'resolved'
    })
  }, [steps, getStepStatus])

  const reviewIsEntry = isReviewEntryStep(entryStep)
  const conceptSlug =
    steps.find((s) => s.kind === 'concept' && s.id.startsWith('concept:'))?.id.replace(/^concept:/, '') ??
    null
  const demoteEntryHighlight = reviewDue && !reviewIsEntry

  useEffect(() => {
    if (!onPlanStatusChange) return
    if (status === 'loading' || status === 'idle') {
      onPlanStatusChange({
        empty: false,
        settled: false,
        reviewIsEntry: false,
        conceptSlug: null,
        allDone: false,
        arc: undefined,
        stepCount: 0,
      })
      return
    }
    const empty = status === 'ready' && !allDone && steps.length === 0
    onPlanStatusChange({
      empty,
      settled: status === 'ready' || status === 'error',
      reviewIsEntry: status === 'ready' && reviewIsEntry,
      conceptSlug: status === 'ready' ? conceptSlug : null,
      allDone: status === 'ready' && allDone,
      arc: status === 'ready' ? arc : undefined,
      stepCount: steps.length,
    })
  }, [status, allDone, steps.length, reviewIsEntry, conceptSlug, arc, onPlanStatusChange])

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
      <div className="flex flex-col rounded-xl border border-border-subtle bg-daily-card px-[var(--layout-card-pad)] pb-[var(--layout-card-pad)] pt-5">
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {status === 'ready' && !allDone && `Plan de hoy listo, ${steps.length} pasos`}
          {status === 'ready' && allDone && 'Plan diario completo'}
        </div>

        {(status === 'loading' || status === 'idle') && (
          <div className="flex flex-col gap-2.5">
            {(['w-4/5', 'w-3/4', 'w-11/12', 'w-2/3', 'w-5/6'] as const).map((widthClass, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-3 w-6 shrink-0 animate-pulse rounded bg-surface-sunken" />
                <div className={`h-4 animate-pulse rounded-md bg-surface-sunken ${widthClass}`} />
              </div>
            ))}
            <p className="font-body-sm mt-2 animate-pulse text-center text-fg-muted">
              Preparando tu plan…
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="animate-state-in flex flex-col items-center gap-3 py-[var(--layout-section-gap)] text-center">
            <p className="font-body-sm text-error">No se pudo preparar tu plan.</p>
            <Button type="button" variant="primary" size="md" onClick={() => void load()}>
              Reintentar
            </Button>
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

        {/* Post-plan surface is owned by HomeCommandGrid (replaces this card). */}
        {status === 'ready' && allDone ? (
          <p className="sr-only">Plan diario completo</p>
        ) : null}

        {status === 'ready' && !allDone && steps.length > 0 ? (
          <div className="animate-state-in flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <span className="font-label shrink-0 text-fg">Plan de hoy</span>
              <PlanSegmentProgress
                stepIds={steps.map((s) => s.id)}
                completedCount={completedCount}
                getStepStatus={getStepStatus}
                activeStepId={inProgressStepId}
                entryStepId={entryStep?.id ?? null}
              />
              <span className="font-caption shrink-0 tabular-nums text-fg-muted">
                {progressLabel}
              </span>
            </div>
            <HomeFirstSessionHint enabled={showFirstSessionHint} />
            <DailyStepList
              steps={steps}
              getStepStatus={getStepStatus}
              onStartStep={handleStartStep}
              inProgressStepId={inProgressStepId}
              demoteEntryHighlight={demoteEntryHighlight}
              collapseFutureSteps
            />
          </div>
        ) : null}
      </div>
    </section>
  )
}
