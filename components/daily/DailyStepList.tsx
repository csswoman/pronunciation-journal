'use client'

// Planned structure:
// <DailyStepList>
//   ol list of steps
//     step item (DailyStepTitle, status indicators, CTA buttons)
//   DailyThreadStrip (optional plan hints)
// </DailyStepList>

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { ArrowRight, Check, ChevronDown } from "@/components/icons"
import { DailyStepTitle } from './DailyStepTitle'
import { DailyThreadStrip } from './DailyThreadStrip'
import type { DailyStepStatus } from '@/hooks/useDailyPlan'
import type { DailyStep } from '@/lib/practice/types'
import { cn } from '@/lib/cn'
import { playUiCue } from '@/lib/ui-sounds/cues'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import {
  localizeDailyStepSubtitle,
  localizeDailyStepTitle,
} from '@/lib/daily/localize-step-copy'
import {
  collectPlanHints,
  MAX_VISIBLE_COMPACT_PENDING,
  readInProgressStepId,
  revealStaggerByStepId,
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
  /** When true, omits the inline thread strip (used when hints are displayed elsewhere). */
  hideThreadHints?: boolean
}

/** Daily step checklist shared by /daily and home. */
export default function DailyStepList({
  steps,
  getStepStatus,
  onStartStep,
  inProgressStepId = null,
  demoteEntryHighlight = false,
  collapseFutureSteps = false,
  hideThreadHints = false,
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
  let visiblePendingCompactBudget = MAX_VISIBLE_COMPACT_PENDING
  let hiddenCount = 0
  const isCompactRow = (isEntryOrCurrent: boolean): boolean => {
    if (!collapseFutureSteps) return false
    if (isEntryOrCurrent) return false
    return true
  }
  const isHiddenRow = (status: DailyStepStatus, isEntryOrCurrent: boolean): boolean => {
    if (!collapseFutureSteps || showAllCompact || steps.length <= 5) return false
    if (isEntryOrCurrent) return false
    if (status === 'done' || status === 'resolved') return false
    if (visiblePendingCompactBudget > 0) {
      visiblePendingCompactBudget -= 1
      return false
    }
    hiddenCount += 1
    return true
  }
  const revealStagger = revealStaggerByStepId(steps, getStepStatus, {
    collapseFutureSteps,
    showAllCompact,
    entryIndex,
    activeId,
  })

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
  }, [steps, getStepStatus])

  return (
    <div className="flex w-full flex-col gap-3">
      <ol className="flex w-full flex-col gap-2.5">
        {steps.map((step, i) => {
          const status = getStepStatus(step.id)
          const isInProgress =
            activeId === step.id && status !== 'done' && status !== 'resolved'
          // Entry point only when nothing is mid-session: avoid false "en curso".
          const isEntry =
            !activeId && i === entryIndex && status !== 'done' && status !== 'resolved'
          const visual = rowVisual(status, isInProgress, isEntry)
          const done = visual === 'done'
          const justCompleted = done && newlyDoneIds.includes(step.id)
          const isEntryOrCurrent = visual === 'entry' || visual === 'current'
          const compact = isCompactRow(isEntryOrCurrent)
          const hidden = isHiddenRow(status, isEntryOrCurrent)
          const staggerIndex = revealStagger.get(step.id)
          const isReadingStep = step.kind === 'concept' || step.kind === 'study_deck'
          const cardCount = step.studyCards?.length ?? 0
          const hasReader = !!step.readerPassage
          const isStartable = step.exercises.length > 0 || cardCount > 0 || hasReader || Boolean(step.missionLaunch)

          if (hidden) return null

          const rowClass = cn(
            'min-w-0',
            staggerIndex !== undefined && 'list-stagger',
          )
          const rowStyle =
            staggerIndex !== undefined
              ? ({ '--stagger-index': staggerIndex } as CSSProperties)
              : undefined

          const cardClass = cn(
            'home-card-lift focus-ring group flex w-full min-h-11 items-center gap-3 rounded-xl text-left transition-colors',
            compact ? 'px-3 py-2.5' : 'px-3.5 py-3',
            visual === 'entry' &&
              (demoteEntryHighlight
                ? 'border border-border-default bg-surface-raised hover:border-border-default'
                : 'border border-border-default bg-surface-raised hover:border-primary/40 text-fg'),
            visual === 'current' &&
              'border border-primary/40 bg-primary/10 text-fg',
            visual === 'pending' &&
              'border border-transparent bg-transparent hover:bg-surface-sunken/70',
            visual === 'done' &&
              'border border-transparent bg-transparent',
          )

          const localizedSubtitle = localizeDailyStepSubtitle(step.subtitle)
          const stepMetaText = stepMeta(step)
          const stepNumber = (
            <span
              className={cn(
                "font-mono text-body-sm font-medium w-4 shrink-0 select-none",
                visual === 'entry' || visual === 'current' ? 'text-primary font-bold' : 'text-fg-muted'
              )}
            >
              {i + 1}
            </span>
          )

          const inner = compact ? (
            <div className="flex w-full items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {stepNumber}
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
              </div>
              {done ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-success-soft px-2 py-0.5 font-caption font-semibold text-success">
                  <Check size={14} aria-hidden />
                  Hecho
                </span>
              ) : (
                <div className="flex items-center gap-1.5 shrink-0">
                  {step.id === 'journal_entry' || step.href === '/journal' ? (
                    <Badge label="Opcional" variant="neutral" size="sm" />
                  ) : null}
                  <span className="w-14 text-right font-caption tabular-nums text-fg-muted">
                    {step.estMinutes} min
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex w-full items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {stepNumber}
                <div className="min-w-0 flex-1">
                  <DailyStepTitle
                    title={localizeDailyStepTitle(step.title)}
                    ipa={step.ipa}
                    muted={done}
                  />
                  {(localizedSubtitle || stepMetaText) ? (
                    <p
                      className={cn(
                        'mt-0.5 truncate font-body-sm',
                        done
                          ? 'text-fg-muted'
                          : isEntryOrCurrent
                            ? 'text-fg font-medium'
                            : 'text-fg-muted',
                      )}
                    >
                      {[localizedSubtitle, stepMetaText]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  ) : null}
                </div>
              </div>
              {done ? (
                <div className="flex shrink-0 items-center gap-2.5">
                  <span
                    className={cn(
                      "animate-state-in inline-flex items-center gap-1 rounded-md bg-accent-2-soft px-2.5 py-1 font-caption font-semibold text-accent-2",
                      justCompleted && "success-pulse",
                    )}
                  >
                    <Check size={16} aria-hidden />
                    Hecho
                  </span>
                  <span className="w-6 shrink-0" aria-hidden />
                </div>
              ) : (
                <div className="flex shrink-0 items-center gap-2">
                  {step.id === 'journal_entry' || step.href === '/journal' ? (
                    <Badge label="Opcional" variant="neutral" size="sm" />
                  ) : null}
                  <span className="w-14 text-right font-caption tabular-nums text-fg-muted">
                    {step.estMinutes} min
                  </span>
                  <ArrowRight
                    size={18}
                    className={cn(
                      "w-6 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5",
                      isEntryOrCurrent ? "text-primary" : "text-fg-muted group-hover:text-primary"
                    )}
                  />
                </div>
              )}
            </div>
          )

          if (isReadingStep && step.href) {
            return (
              <li key={step.id} className={rowClass} style={rowStyle}>
                <Link href={step.href} className={cardClass}>
                  {inner}
                </Link>
              </li>
            )
          }

          return (
            <li key={step.id} className={rowClass} style={rowStyle}>
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
          aria-expanded={false}
          className="press-feedback focus-ring -mx-1.5 inline-flex min-h-11 items-center gap-1.5 self-start rounded-lg px-1.5 font-body-sm font-medium text-fg-muted transition-colors hover:bg-surface-sunken/70 hover:text-fg"
          onClick={() => {
            playUiCue('nav-open')
            setShowAllCompact(true)
          }}
        >
          <ChevronDown size={16} aria-hidden />
          Ver {hiddenCount} {hiddenCount === 1 ? 'paso más' : 'pasos más'}
        </button>
      ) : null}
      {threadHints.length > 0 && !hideThreadHints ? (
        <DailyThreadStrip hints={threadHints} embedded />
      ) : null}
    </div>
  )
}
