'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, ChevronDown } from "@/components/icons"
import { DailyStepTitle } from './DailyStepTitle'
import { DailyThreadStrip } from './DailyThreadStrip'
import type { DailyStepStatus } from '@/hooks/useDailyPlan'
import type { DailyStep } from '@/lib/practice/types'
import { cn } from '@/lib/cn'
import { playUiCue } from '@/lib/ui-sounds/cues'
import Link from 'next/link'
import {
  localizeDailyStepSubtitle,
  localizeDailyStepTitle,
} from '@/lib/daily/localize-step-copy'
import {
  collectPlanHints,
  readInProgressStepId,
  rowVisual,
  stepMeta,
} from './daily-step-list-helpers'

export { readInProgressStepId }

interface DailyStepListProps {
  steps: DailyStep[]
  getStepStatus: (stepId: string) => DailyStepStatus
  /** Starts the exercise session for a step (not called for 'concept'). */
  onStartStep: (step: DailyStep) => void
  /** Step id with a real mid-session (exerciseIndex > 0). */
  inProgressStepId?: string | null
  /**
   * When review is the home primary, keep "Empieza aquí" but drop primary wash
   * so only one zone shouts.
   */
  demoteEntryHighlight?: boolean
  /**
   * Collapse done/pending rows beyond the current step into compact one-line
   * rows, with a "Ver N más" toggle for anything past the first 2 pending
   * rows. Off by default so /daily (DailyChecklist) keeps full expansion.
   */
  collapseFutureSteps?: boolean
}

/** Daily step checklist shared by /daily and home. */
export default function DailyStepList({
  steps,
  getStepStatus,
  onStartStep,
  inProgressStepId = null,
  demoteEntryHighlight = false,
  collapseFutureSteps = false,
}: DailyStepListProps) {
  const threadHints = collectPlanHints(steps)
  const [activeId, setActiveId] = useState<string | null>(inProgressStepId)
  const [showAllCompact, setShowAllCompact] = useState(false)
  const seenDoneIds = useRef<Set<string> | null>(null)
  if (seenDoneIds.current === null) {
    seenDoneIds.current = new Set(
      steps
        .filter((s) => {
          const st = getStepStatus(s.id)
          return st === 'done' || st === 'resolved'
        })
        .map((s) => s.id),
    )
  }

  useEffect(() => {
    setActiveId(inProgressStepId ?? readInProgressStepId())
  }, [inProgressStepId, steps])

  const entryIndex = steps.findIndex((s) => {
    const st = getStepStatus(s.id)
    return st !== 'done' && st !== 'resolved'
  })

  // When collapsing: the entry/current step stays expanded; done steps and
  // the first 2 pending steps beyond entry render compact; anything past
  // that is hidden behind the "Ver N más" toggle until showAllCompact.
  const MAX_VISIBLE_COMPACT_PENDING = 2
  let visiblePendingCompactBudget = MAX_VISIBLE_COMPACT_PENDING
  let hiddenCount = 0
  const isCompactRow = (isEntryOrCurrent: boolean): boolean => {
    if (!collapseFutureSteps) return false
    if (isEntryOrCurrent) return false
    return true
  }
  const isHiddenRow = (status: DailyStepStatus, isEntryOrCurrent: boolean): boolean => {
    if (!collapseFutureSteps || showAllCompact) return false
    if (isEntryOrCurrent) return false
    if (status === 'done' || status === 'resolved') return false
    if (visiblePendingCompactBudget > 0) {
      visiblePendingCompactBudget -= 1
      return false
    }
    hiddenCount += 1
    return true
  }

  const currentDoneIds = new Set(
    steps
      .filter((s) => {
        const st = getStepStatus(s.id)
        return st === 'done' || st === 'resolved'
      })
      .map((s) => s.id),
  )
  const newlyDoneIds = [...currentDoneIds].filter((id) => !seenDoneIds.current!.has(id))

  useEffect(() => {
    if (newlyDoneIds.length > 0) {
      playUiCue('toggle')
    }
    seenDoneIds.current = currentDoneIds
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps, getStepStatus])

  return (
    <div className="flex w-full flex-col gap-3">
      <ol className="flex w-full flex-col gap-2.5">
        {steps.map((step, i) => {
          const status = getStepStatus(step.id)
          const isInProgress =
            activeId === step.id && status !== 'done' && status !== 'resolved'
          // Entry point only when nothing is mid-session — avoid false "en curso".
          const isEntry =
            !activeId && i === entryIndex && status !== 'done' && status !== 'resolved'
          const visual = rowVisual(status, isInProgress, isEntry)
          const done = visual === 'done'
          const justCompleted = done && newlyDoneIds.includes(step.id)
          const isEntryOrCurrent = visual === 'entry' || visual === 'current'
          const compact = isCompactRow(isEntryOrCurrent)
          const hidden = isHiddenRow(status, isEntryOrCurrent)
          const isReadingStep = step.kind === 'concept' || step.kind === 'study_deck'
          const cardCount = step.studyCards?.length ?? 0
          const hasReader = !!step.readerPassage
          const isStartable = step.exercises.length > 0 || cardCount > 0 || hasReader || Boolean(step.missionLaunch)

          if (hidden) return null

          const cardClass = cn(
            'home-card-lift focus-ring group flex w-full min-h-11 flex-col gap-2 rounded-[var(--radius-md)] text-left',
            compact ? 'px-3 py-2.5' : 'px-3.5 py-3.5',
            visual === 'entry' &&
              (demoteEntryHighlight
                ? 'border border-border-default bg-surface-raised hover:border-border-default'
                : 'border border-primary bg-primary text-on-primary'),
            visual === 'current' &&
              'border border-primary bg-primary text-on-primary',
            visual === 'pending' &&
              'border border-transparent bg-transparent hover:bg-surface-sunken/70',
            visual === 'done' &&
              'border border-transparent bg-transparent',
          )

          const localizedSubtitle = localizeDailyStepSubtitle(step.subtitle)
          const inner = compact ? (
            <div className="flex w-full items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span
                  className={cn(
                    'block truncate font-body-sm font-medium',
                    done ? 'text-fg-muted' : 'text-fg',
                  )}
                >
                  {localizeDailyStepTitle(step.title)}
                </span>
                {!done && localizedSubtitle ? (
                  <span className="mt-0.5 block truncate font-caption text-fg-muted">
                    {localizedSubtitle}
                  </span>
                ) : null}
              </div>
              {done ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-success-soft px-2 py-0.5 font-caption font-semibold text-success">
                  <Check size={14} aria-hidden />
                  Hecho
                </span>
              ) : (
                <span className="shrink-0 font-caption tabular-nums text-fg-muted">
                  {step.estMinutes} min
                </span>
              )}
            </div>
          ) : (
            <div className="flex w-full items-center gap-3">
              <div className="min-w-0 flex-1">
                <DailyStepTitle
                  title={localizeDailyStepTitle(step.title)}
                  ipa={step.ipa}
                  muted={done}
                  emphasize={isEntryOrCurrent && !demoteEntryHighlight}
                />
                <p
                  className={cn(
                    'mt-0.5 truncate font-body-sm',
                    done
                      ? 'text-fg-subtle'
                      : isEntryOrCurrent
                        ? 'text-on-primary/80'
                        : 'text-fg-muted',
                  )}
                >
                  {[localizedSubtitle, stepMeta(step)]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              {done ? (
                <span
                  className={cn(
                    "animate-state-in inline-flex shrink-0 items-center gap-1 rounded-md bg-accent-2-soft px-2.5 py-1 font-caption font-semibold text-accent-2",
                    justCompleted && "success-pulse",
                  )}
                >
                  <Check size={16} aria-hidden />
                  Hecho
                </span>
              ) : visual === 'entry' ? (
                demoteEntryHighlight ? (
                  <span className="shrink-0 font-body-sm font-medium text-fg-muted">
                    Empieza aquí
                  </span>
                ) : (
                  <span className="inline-flex shrink-0 items-center rounded-md bg-surface-raised px-2.5 py-1 font-caption font-semibold text-fg">
                    Empieza aquí
                  </span>
                )
              ) : visual === 'current' ? (
                <span className="inline-flex shrink-0 items-center rounded-md bg-surface-raised px-2.5 py-1 font-caption font-semibold text-fg">
                  En curso
                </span>
              ) : (
                <ArrowRight
                  size={18}
                  className="shrink-0 text-fg-muted transition-colors duration-150 group-hover:translate-x-0.5 group-hover:text-primary"
                />
              )}
            </div>
          )

          if (isReadingStep && step.href) {
            return (
              <li key={step.id} className="min-w-0">
                <Link href={step.href} className={cardClass}>
                  {inner}
                </Link>
              </li>
            )
          }

          return (
            <li key={step.id} className="min-w-0">
              <button
                type="button"
                className={cardClass}
                onClick={() => onStartStep(step)}
                disabled={!isStartable || done}
              >
                {inner}
              </button>
            </li>
          )
        })}
      </ol>
      {collapseFutureSteps && !showAllCompact && hiddenCount > 0 ? (
        <button
          type="button"
          className="focus-ring inline-flex min-h-11 items-center gap-1.5 self-center rounded-md border border-border-default bg-surface-raised px-3 font-body-sm font-semibold text-fg transition-colors hover:bg-surface-sunken active:scale-[0.96]"
          onClick={() => setShowAllCompact(true)}
        >
          Ver {hiddenCount} {hiddenCount === 1 ? 'paso más' : 'pasos más'}
          <ChevronDown size={16} aria-hidden />
        </button>
      ) : null}
      {threadHints.length > 0 ? <DailyThreadStrip hints={threadHints} embedded /> : null}
    </div>
  )
}
