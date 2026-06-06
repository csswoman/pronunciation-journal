'use client'

import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { DailyStepIcon } from './dailyIcons'
import type { DailyStep } from '@/lib/practice/types'

interface DailyStepListProps {
  steps: DailyStep[]
  doneIds: Set<string>
  /** Starts the exercise session for a step (not called for 'concept'). */
  onStartStep: (step: DailyStep) => void
  /** Marks a step done (used by 'concept' when opening its reading). */
  onMarkDone: (stepId: string) => void
}

const CARD_CLASS =
  'home-card-lift focus-ring group flex w-full items-center gap-3 rounded-[var(--radius-lg)] border border-border-subtle bg-surface-raised p-4 text-left hover:border-[var(--accent-border)]'

const ICON_CLASS =
  'grid h-10 w-10 shrink-0 place-items-center rounded-full transition-[background-color,transform] duration-200'

/** Daily step checklist shared by /daily and home. */
export default function DailyStepList({ steps, doneIds, onStartStep, onMarkDone }: DailyStepListProps) {
  return (
    <ol className="flex flex-col gap-3">
      {steps.map((step, i) => {
        const done = doneIds.has(step.id)
        const isConcept = step.kind === 'concept'

        const inner = (
          <>
            <div
              className={`${ICON_CLASS} ${
                done ? 'bg-[var(--success)] text-white' : 'bg-[var(--hue-icon-bg)] text-[var(--primary)]'
              }`}
            >
              {done ? <Check size={18} className="animate-step-done" /> : <DailyStepIcon name={step.icon} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2.5 text-base font-semibold text-[var(--text-primary)]">
                <span className="font-caption tabular-nums text-[var(--text-tertiary)]">{String(i + 1).padStart(2, '0')}</span>
                {step.title}
              </p>
              <p className="font-body-sm truncate text-[var(--text-tertiary)]">
                {step.subtitle}
                {step.exercises.length > 0 ? ` · ${step.exercises.length} exercises` : ''}
                {` · ≈${step.estMinutes} min`}
              </p>
            </div>
            {done ? (
              <span className="animate-state-in font-body-sm font-medium text-[var(--success)]">Done</span>
            ) : (
              <ArrowRight size={18} className="text-[var(--text-tertiary)] transition-transform duration-150 group-hover:translate-x-0.5" />
            )}
          </>
        )

        if (isConcept && step.href) {
          return (
            <li key={step.id}>
              <Link href={step.href} className={CARD_CLASS} onClick={() => onMarkDone(step.id)}>
                {inner}
              </Link>
            </li>
          )
        }

        return (
          <li key={step.id}>
            <button
              type="button"
              className={`${CARD_CLASS} w-full`}
              onClick={() => onStartStep(step)}
              disabled={step.exercises.length === 0}
            >
              {inner}
            </button>
          </li>
        )
      })}
    </ol>
  )
}
