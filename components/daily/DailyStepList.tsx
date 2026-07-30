'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Check } from "@/components/icons"
import { DailyStepTitle } from './DailyStepTitle'
import { DailyThreadStrip } from './DailyThreadStrip'
import { getThreadHintsForStep } from '@/lib/practice/daily-plan/step-thread'
import type { StepThreadHint } from '@/lib/practice/daily-plan/step-thread'
import type { DailyStepStatus } from '@/hooks/useDailyPlan'
import type { DailyStep } from '@/lib/practice/types'
import { cn } from '@/lib/cn'
import Link from 'next/link'
import {
  localizeDailyStepSubtitle,
  localizeDailyStepTitle,
} from '@/lib/daily/localize-step-copy'

const STORAGE_KEY = 'daily:step'

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

function collectPlanHints(steps: DailyStep[]): StepThreadHint[] {
  const byWord = new Map<string, StepThreadHint>()
  for (let i = 0; i < steps.length; i++) {
    for (const hint of getThreadHintsForStep(steps, i)) {
      if (!byWord.has(hint.word)) byWord.set(hint.word, hint)
    }
  }
  return [...byWord.values()].sort((a, b) => a.word.localeCompare(b.word))
}

function stepMeta(step: DailyStep): string {
  const parts: string[] = []
  if (step.exercises.length > 0) {
    parts.push(
      `${step.exercises.length} ${step.exercises.length === 1 ? 'ejercicio' : 'ejercicios'}`,
    )
  }
  const cardCount = step.studyCards?.length ?? 0
  if (cardCount > 0) {
    parts.push(`${cardCount} ${cardCount === 1 ? 'palabra' : 'palabras'}`)
  }
  if (step.readerPassage) parts.push('lectura')
  parts.push(`≈${step.estMinutes} min`)
  return parts.join(' · ')
}

type RowVisual = 'done' | 'entry' | 'current' | 'pending'

function rowVisual(
  status: DailyStepStatus,
  isInProgress: boolean,
  isEntry: boolean,
): RowVisual {
  if (status === 'done' || status === 'resolved') return 'done'
  if (isInProgress) return 'current'
  if (isEntry) return 'entry'
  return 'pending'
}

/** True mid-session: storage exists and at least one exercise was advanced. */
export function readInProgressStepId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { stepId?: string; exerciseIndex?: number }
    if (!parsed.stepId || typeof parsed.exerciseIndex !== 'number') return null
    if (parsed.exerciseIndex <= 0) return null
    return parsed.stepId
  } catch {
    return null
  }
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
          const isEntryOrCurrent = visual === 'entry' || visual === 'current'
          const compact = isCompactRow(isEntryOrCurrent)
          const hidden = isHiddenRow(status, isEntryOrCurrent)
          const isReadingStep = step.kind === 'concept' || step.kind === 'study_deck'
          const cardCount = step.studyCards?.length ?? 0
          const hasReader = !!step.readerPassage
          const isStartable = step.exercises.length > 0 || cardCount > 0 || hasReader

          if (hidden) return null

          const cardClass = cn(
            'home-card-lift focus-ring group flex w-full flex-col gap-2 rounded-[var(--radius-lg)] border bg-surface-raised text-left',
            compact ? 'px-4 py-2' : 'px-4 py-3.5',
            visual === 'entry' &&
              (demoteEntryHighlight
                ? 'border-border-subtle hover:border-border-default'
                : 'border-primary bg-primary-soft hover:border-primary'),
            visual === 'current' &&
              'border-primary bg-primary-soft hover:border-primary',
            visual === 'pending' &&
              'border-border-subtle hover:border-border-default',
            visual === 'done' && 'border-border-subtle opacity-80',
          )

          const inner = compact ? (
            <div className="flex w-full items-center justify-between gap-3">
              <span className={cn('truncate font-body-sm font-medium', done ? 'text-fg-muted/70' : 'text-fg')}>
                {localizeDailyStepTitle(step.title)}
              </span>
              {done ? (
                <span className="inline-flex shrink-0 items-center gap-1 font-body-sm font-medium text-success">
                  <Check size={14} aria-hidden />
                  Hecho
                </span>
              ) : (
                <span className="shrink-0 font-caption tabular-nums text-fg-muted">
                  ≈{step.estMinutes} min
                </span>
              )}
            </div>
          ) : (
            <div className="flex w-full items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className={cn(done && 'opacity-60')}>
                  <DailyStepTitle
                    title={localizeDailyStepTitle(step.title)}
                    ipa={step.ipa}
                    index={i}
                  />
                </div>
                <p
                  className={cn( 'mt-0.5 truncate font-body-sm', done ? 'text-fg-muted/70' : 'text-fg-muted', )}
                >
                  {[localizeDailyStepSubtitle(step.subtitle), stepMeta(step)]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              {done ? (
                <span className="animate-state-in inline-flex shrink-0 items-center gap-1 font-body-sm font-medium text-success">
                  <Check size={16} aria-hidden />
                  Hecho
                </span>
              ) : visual === 'entry' ? (
                <span
                  className={cn(
                    'shrink-0 font-body-sm font-medium',
                    demoteEntryHighlight ? 'text-fg-muted' : 'text-primary',
                  )}
                >
                  Empieza aquí
                </span>
              ) : visual === 'current' ? (
                <span className="shrink-0 font-body-sm font-medium text-primary">
                  En curso
                </span>
              ) : (
                <ArrowRight
                  size={18}
                  className="shrink-0 text-fg-muted transition-transform duration-150 group-hover:translate-x-0.5"
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
          className="focus-ring self-start font-body-sm font-medium text-fg-muted hover:text-fg"
          onClick={() => setShowAllCompact(true)}
        >
          Ver {hiddenCount} más
        </button>
      ) : null}
      {threadHints.length > 0 ? <DailyThreadStrip hints={threadHints} /> : null}
    </div>
  )
}
