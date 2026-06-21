'use client'

import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { DailyStepIcon } from './dailyIcons'
import type { DailyStepStatus } from '@/hooks/useDailyPlan'
import type { DailyStep } from '@/lib/practice/types'

interface DailyStepListProps {
  steps: DailyStep[]
  getStepStatus: (stepId: string) => DailyStepStatus
  /** Starts the exercise session for a step (not called for 'concept'). */
  onStartStep: (step: DailyStep) => void
}

const CARD_CLASS =
  'home-card-lift focus-ring group flex w-full items-center gap-3 rounded-[var(--radius-lg)] border border-border-subtle bg-surface-raised p-4 text-left hover:border-[var(--accent-border)]'

const ICON_CLASS =
  'grid h-10 w-10 shrink-0 place-items-center rounded-full transition-[background-color,transform] duration-200'

/** Daily step checklist shared by /daily and home. */
export default function DailyStepList({
  steps,
  getStepStatus,
  onStartStep,
}: DailyStepListProps) {
  return (
    <ol className="flex w-full flex-col gap-3">
      {steps.map((step, i) => {
        const status = getStepStatus(step.id)
        const done = status === 'done'
        const resolved = status === 'resolved'
        const isConcept = step.kind === 'concept'
        // word_intro is a presentation step: it carries study cards, not exercises.
        const cardCount = step.studyCards?.length ?? 0
        const isStartable = step.exercises.length > 0 || cardCount > 0

        const inner = (
          <>
            <div
              className={`${ICON_CLASS} ${
                done || resolved
                  ? 'bg-[var(--success)] text-white'
                  : 'bg-[var(--hue-icon-bg)] text-[var(--primary)]'
              }`}
            >
              {done || resolved ? (
                <Check size={18} className="animate-step-done" />
              ) : (
                <DailyStepIcon name={step.icon} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex min-w-0 items-center gap-2.5 text-base font-semibold text-(--text-primary)">
                <span className="shrink-0 font-caption tabular-nums text-(--text-tertiary)">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="truncate">{step.title}</span>
              </p>
              <p className="font-body-sm truncate text-(--text-tertiary)">
                {step.subtitle}
                {step.exercises.length > 0 ? ` · ${step.exercises.length} exercises` : ''}
                {cardCount > 0 ? ` · ${cardCount} ${cardCount === 1 ? 'palabra' : 'palabras'}` : ''}
                {` · ≈${step.estMinutes} min`}
              </p>
            </div>
            {done ? (
              <span className="animate-state-in font-body-sm font-medium text-[var(--success)]">Done</span>
            ) : resolved ? (
              <span className="animate-state-in font-body-sm font-medium text-[var(--primary)]">
                Practiced
              </span>
            ) : (
              <ArrowRight
                size={18}
                className="text-[var(--text-tertiary)] transition-transform duration-150 group-hover:translate-x-0.5"
              />
            )}
          </>
        )

        if (isConcept && step.href) {
          return (
            <li key={step.id} className="min-w-0">
              <Link href={step.href} className={CARD_CLASS}>
                {inner}
              </Link>
            </li>
          )
        }

        return (
          <li key={step.id} className="min-w-0">
            <button
              type="button"
              className={CARD_CLASS}
              onClick={() => onStartStep(step)}
              disabled={!isStartable}
            >
              {inner}
            </button>
          </li>
        )
      })}
    </ol>
  )
}
