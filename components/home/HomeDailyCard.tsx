'use client'

import { useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Flame } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import DailyStepList from '@/components/daily/DailyStepList'
import { useDailyPlan, type ConceptLesson, type DailyStep } from '@/hooks/useDailyPlan'
import { useAuth } from '@/components/auth/AuthProvider'

interface HomeDailyCardProps {
  conceptLesson: ConceptLesson | null
}

export default function HomeDailyCard({ conceptLesson }: HomeDailyCardProps) {
  const { user } = useAuth()
  const router = useRouter()
  const { status, steps, doneIds, completedCount, allDone, load, celebrate } = useDailyPlan({
    conceptLesson,
    autoLoad: false,
  })

  // Load plan once the user is available.
  useEffect(() => {
    if (user && (status === 'idle' || status === 'error')) void load()
  }, [user, status, load])

  // Celebrate once when all steps are complete.
  useEffect(() => {
    if (allDone) celebrate()
  }, [allDone, celebrate])

  // Navigate to /daily so the session runs at its own URL (survives reload).
  const handleStartStep = useCallback((step: DailyStep) => {
    if (step.kind === 'concept') return
    router.push('/daily')
  }, [router])

  // Embedded checklist (single view)
  return (
    <section>
      <div className="flex flex-col bg-daily-card rounded-[var(--radius-xl)] border border-border-subtle px-6 pb-6 pt-5">
        {/* aria-live region announces plan-ready state to screen readers */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
        {status === 'ready' && !allDone && `Today's plan ready, ${steps.length} steps`}
        {status === 'ready' && allDone && 'Daily plan complete!'}
      </div>

      {(status === 'loading' || status === 'idle') && (
        <div className="flex flex-col gap-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-7 w-7 shrink-0 rounded-md bg-surface-sunken animate-pulse" />
              <div className="h-4 flex-1 rounded-md bg-surface-sunken animate-pulse" style={{ width: `${70 + (i % 3) * 10}%` }} />
            </div>
          ))}
          <p className="font-body-sm mt-2 text-center text-[var(--text-tertiary)] animate-pulse">
            Preparing your plan…
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="animate-state-in flex flex-col items-center gap-3 py-8 text-center">
          <p className="font-body-sm text-[var(--error)]">Couldn't prepare your plan.</p>
          <Button type="button" variant="primary" size="sm" onClick={() => void load()}>
            Retry
          </Button>
        </div>
      )}

      {status === 'ready' && !allDone && steps.length === 0 && (
        <div className="animate-state-in flex flex-col items-center gap-4 py-8 text-center">
          <div className="flex flex-col gap-1.5">
            <p className="font-label font-semibold text-[var(--text-primary)]">
              Your plan is empty today.
            </p>
            <p className="font-body-sm max-w-[28ch] text-[var(--text-secondary)]">
              Your daily plan builds as you start a course or practice sounds.
            </p>
          </div>
          <Link href="/courses">
            <Button variant="primary" size="sm" icon={<ArrowRight size={14} />} iconPosition="right">
              Explore courses
            </Button>
          </Link>
        </div>
      )}

      {status === 'ready' &&
        (allDone ? (
          <div className="animate-state-in flex flex-col items-center gap-3 py-6 text-center">
            <div className="animate-step-done grid h-12 w-12 place-items-center rounded-full bg-[var(--success-soft)] text-[var(--success)]">
              <Flame size={24} />
            </div>
            <p className="font-title text-[var(--text-primary)]">Daily complete!</p>
            <p className="font-body-sm max-w-xs text-[var(--text-secondary)]">
              You finished all {steps.length} steps today.
            </p>
            <Link href="/practice/sounds">
              <Button variant="secondary" size="sm" icon={<ArrowRight size={14} />} iconPosition="right">
                Free practice
              </Button>
            </Link>
          </div>
        ) : steps.length > 0 ? (
          <div className="animate-state-in">
            <div className="mb-4 flex items-center gap-3">
              <Badge label="Today's plan" variant="default" className="shrink-0" />
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--primary-soft)]">
                <div
                  className="progress-fill progress-fill-mount h-full w-full rounded-full bg-[var(--primary)]"
                  style={{ transform: `scaleX(${steps.length ? completedCount / steps.length : 0})` }}
                />
              </div>
              <span className="font-body-sm shrink-0 tabular-nums text-[var(--text-tertiary)]">
                {completedCount} of {steps.length}
              </span>
            </div>
            <DailyStepList
              steps={steps}
              doneIds={doneIds}
              onStartStep={handleStartStep}
              onMarkDone={() => router.push('/daily')}
            />
          </div>
        ) : null)}
    </div>
    </section>
  )
}
