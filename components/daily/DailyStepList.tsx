'use client'

// Planned structure:
// <DailyStepList>
//   ol list of steps
//     DailyStepItem (step item with status indicators and CTA)
//   DailyThreadStrip (optional plan hints)
// </DailyStepList>

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from "@/components/icons"
import { DailyThreadStrip } from './DailyThreadStrip'
import { DailyStepItem } from './DailyStepItem'
import type { DailyStepStatus } from '@/hooks/useDailyPlan'
import type { DailyStep } from '@/lib/practice/types'
import { playUiCue } from '@/lib/ui-sounds/cues'
import {
  collectPlanHints,
  MAX_VISIBLE_COMPACT_PENDING,
  readInProgressStepId,
  revealStaggerByStepId,
  rowVisual,
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
          const isEntry =
            !activeId && i === entryIndex && status !== 'done' && status !== 'resolved'
          const visual = rowVisual(status, isInProgress, isEntry)
          const done = visual === 'done'
          const justCompleted = done && newlyDoneIds.includes(step.id)
          const isEntryOrCurrent = visual === 'entry' || visual === 'current'
          const compact = isCompactRow(isEntryOrCurrent)
          const hidden = isHiddenRow(status, isEntryOrCurrent)
          const staggerIndex = revealStagger.get(step.id)

          if (hidden) return null

          return (
            <DailyStepItem
              key={step.id}
              step={step}
              index={i}
              visual={visual}
              justCompleted={justCompleted}
              isEntryOrCurrent={isEntryOrCurrent}
              compact={compact}
              staggerIndex={staggerIndex}
              isEntry={isEntry}
              demoteEntryHighlight={demoteEntryHighlight}
              onStartStep={onStartStep}
            />
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
