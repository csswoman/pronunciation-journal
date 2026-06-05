'use client'

import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { DailyStepIcon } from './dailyIcons'
import type { DailyStep } from '@/lib/practice/types'

interface DailyStepListProps {
  steps: DailyStep[]
  doneIds: Set<string>
  /** Inicia la sesión de ejercicios de un paso (no se llama para 'concept'). */
  onStartStep: (step: DailyStep) => void
  /** Marca un paso hecho (usado por el paso 'concept' al abrir su lectura). */
  onMarkDone: (stepId: string) => void
}

const CARD_CLASS =
  'group flex items-center gap-3 rounded-[var(--radius-lg)] border border-border-subtle bg-surface-raised p-4 text-left transition-[transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-[var(--accent-border)]'

/** Lista de pasos de la diaria como checklist. Compartida por /daily y el home. */
export default function DailyStepList({ steps, doneIds, onStartStep, onMarkDone }: DailyStepListProps) {
  return (
    <ol className="flex flex-col gap-3">
      {steps.map((step, i) => {
        const done = doneIds.has(step.id)
        const isConcept = step.kind === 'concept'

        const inner = (
          <>
            <div
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                done ? 'bg-[var(--success)] text-white' : 'bg-[var(--hue-icon-bg)] text-[var(--primary)]'
              }`}
            >
              {done ? <Check size={18} /> : <DailyStepIcon name={step.icon} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                <span className="text-[var(--text-tertiary)]">{String(i + 1).padStart(2, '0')}</span>
                {step.title}
              </p>
              <p className="truncate text-xs text-[var(--text-tertiary)]">
                {step.subtitle}
                {step.exercises.length > 0 ? ` · ${step.exercises.length} exercises` : ''}
                {` · ≈${step.estMinutes} min`}
              </p>
            </div>
            {done ? (
              <span className="text-xs font-medium text-[var(--success)]">Done</span>
            ) : (
              <ArrowRight size={16} className="text-[var(--text-tertiary)]" />
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
