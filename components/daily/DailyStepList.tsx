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
}: DailyStepListProps) {
  const threadHints = collectPlanHints(steps)
  const [activeId, setActiveId] = useState<string | null>(inProgressStepId)

  useEffect(() => {
    setActiveId(inProgressStepId ?? readInProgressStepId())
  }, [inProgressStepId, steps])

  const entryIndex = steps.findIndex((s) => {
    const st = getStepStatus(s.id)
    return st !== 'done' && st !== 'resolved'
  })

  return (
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
        const isConcept = step.kind === 'concept'
        const cardCount = step.studyCards?.length ?? 0
        const hasReader = !!step.readerPassage
        const isStartable = step.exercises.length > 0 || cardCount > 0 || hasReader
        const showThread =
          step.kind === 'word_review' && threadHints.length > 0

        const cardClass = cn(
          'home-card-lift focus-ring group flex w-full flex-col gap-2 rounded-[var(--radius-lg)] border bg-surface-raised px-4 py-3.5 text-left',
          visual === 'entry' &&
            'border-border-subtle border-l-[3px] border-l-primary hover:border-[var(--accent-border)]',
          visual === 'current' &&
            'border-border-subtle border-l-[3px] border-l-primary hover:border-[var(--accent-border)]',
          visual === 'pending' &&
            'border-border-subtle hover:border-[var(--accent-border)]',
          visual === 'done' && 'border-border-subtle opacity-80',
        )

        const inner = (
          <>
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
                  className={cn(
                    'mt-0.5 truncate font-body-sm',
                    done ? 'text-fg-muted/70' : 'text-fg-muted',
                  )}
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
                <span className="shrink-0 font-body-sm font-medium text-primary">
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
            {showThread ? <DailyThreadStrip hints={threadHints} embedded /> : null}
          </>
        )

        if (isConcept && step.href) {
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
  )
}
