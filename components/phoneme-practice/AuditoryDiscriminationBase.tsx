'use client'

// Planned structure:
// <AuditoryDiscriminationBase>
//   <PhonemeExercisePrompt />
//   <StimulusSlot />
//   <OptionsGrid (single/multi)>
//   <PhonemeConfirmButton />
//   <FeedbackSlot />
//   <ComparisonSlot />
// </AuditoryDiscriminationBase>

import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { PhonemeConfirmButton } from '@/components/phoneme-practice/PhonemeConfirmButton'
import { PhonemeExercisePrompt } from '@/components/phoneme-practice/PhonemeExercisePrompt'
import type { Option } from '@/lib/phoneme-practice/types'

export type AuditoryOption = Option & {
  ariaLabel?: string
}

export interface AuditoryDiscriminationBaseProps {
  title: ReactNode
  kicker?: string
  hint?: string
  stimulusSlot?: ReactNode
  options: AuditoryOption[]
  selectedIds: string[]
  correctIds: string[]
  submitted: boolean
  mode?: 'single' | 'multi'
  canConfirm: boolean
  onToggleOption: (id: string, label: string) => void
  onConfirm: () => void
  feedbackSlot?: ReactNode
  comparisonSlot?: ReactNode
  gridCols?: 2 | 3
}

export function AuditoryDiscriminationBase({
  title,
  kicker,
  hint,
  stimulusSlot,
  options,
  selectedIds,
  correctIds,
  submitted,
  mode = 'single',
  canConfirm,
  onToggleOption,
  onConfirm,
  feedbackSlot,
  comparisonSlot,
  gridCols = 2,
}: AuditoryDiscriminationBaseProps) {
  const selectedSet = new Set(selectedIds)
  const correctSet = new Set(correctIds)

  return (
    <div className="flex w-full flex-col gap-6">
      <PhonemeExercisePrompt
        centered
        title={title}
        kicker={kicker}
        hint={hint}
      />

      {stimulusSlot && (
        <div className="flex justify-center py-1">
          {stimulusSlot}
        </div>
      )}

      <div
        role={mode === 'single' ? 'radiogroup' : 'group'}
        aria-label={mode === 'single' ? 'Opciones de discriminación auditiva' : 'Opciones — selecciona las correctas'}
        className={cn(
          'grid w-full gap-3.5',
          gridCols === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2',
        )}
      >
        {options.map((opt) => {
          const isSelected = selectedSet.has(opt.id)
          const isCorrect = correctSet.has(opt.id)

          return (
            <button
              key={opt.id}
              type="button"
              role={mode === 'single' ? 'radio' : undefined}
              aria-checked={mode === 'single' ? isSelected : undefined}
              aria-pressed={mode === 'multi' ? isSelected : undefined}
              aria-label={opt.ariaLabel ?? `Seleccionar ${opt.label}`}
              disabled={submitted}
              onClick={() => onToggleOption(opt.id, opt.label)}
              className={cn(
                'group flex min-h-14 cursor-pointer items-center justify-center gap-3 rounded-xl border-2 p-4 transition-all duration-150 select-none text-center focus-ring',
                mode === 'multi' && 'justify-between text-left',
                !submitted && !isSelected && 'border-border-default bg-surface-sunken/40 hover:border-primary/50 hover:bg-surface-sunken text-fg',
                !submitted && isSelected && 'border-primary bg-primary-soft text-primary shadow-xs font-semibold ring-1 ring-primary/30',
                submitted && isCorrect && 'border-success-border bg-success-soft text-success pf-reveal-ok font-semibold',
                submitted && isSelected && !isCorrect && 'border-error-border bg-error-soft text-error pf-reveal-bad font-semibold',
                submitted && !isSelected && !isCorrect && 'border-border-subtle bg-surface-raised/40 text-fg-subtle opacity-40 cursor-default',
              )}
            >
              <span className="text-body-lg font-semibold">{opt.label}</span>
              <div
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center border transition-colors',
                  mode === 'single' ? 'rounded-full' : 'rounded-md',
                  !isSelected && 'border-border-strong bg-surface-base',
                  isSelected && !submitted && 'border-primary bg-primary text-on-primary',
                  submitted && isCorrect && 'border-success bg-success text-on-primary',
                  submitted && isSelected && !isCorrect && 'border-error bg-error text-on-primary',
                )}
                aria-hidden
              >
                {isSelected && (
                  mode === 'single' ? (
                    <div className="size-2 rounded-full bg-current" />
                  ) : (
                    <span className="text-xs font-bold leading-none">✓</span>
                  )
                )}
              </div>
            </button>
          )
        })}
      </div>

      {!submitted && (
        <PhonemeConfirmButton onClick={onConfirm} disabled={!canConfirm} />
      )}

      {submitted && feedbackSlot}
      {submitted && comparisonSlot}
    </div>
  )
}
