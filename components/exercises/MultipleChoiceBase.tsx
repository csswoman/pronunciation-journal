'use client'

import { Check, X } from '@/components/icons'
import { cn } from '@/lib/cn'

export interface MultipleChoiceOptionItem {
  id: string | number
  label: string
}

export interface MultipleChoiceBaseProps {
  options: MultipleChoiceOptionItem[]
  selectedId: string | number | null
  correctId?: string | number | null
  state: 'idle' | 'correct' | 'wrong'
  onSelect: (option: MultipleChoiceOptionItem, index: number) => void
  indicatorType?: 'number' | 'radio'
  className?: string
}

export function MultipleChoiceBase({
  options,
  selectedId,
  correctId,
  state,
  onSelect,
  indicatorType = 'radio',
  className,
}: MultipleChoiceBaseProps) {
  const isRevealed = state !== 'idle'

  return (
    <div className={cn('flex flex-col gap-3 w-full', className)}>
      {options.map((option, idx) => {
        const isSelected = option.id === selectedId
        const isCorrect = option.id === correctId

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option, idx)}
            disabled={isRevealed}
            aria-label={indicatorType === 'number' ? `${idx + 1}. ${option.label}` : option.label}
            className={cn(
              'group flex w-full min-h-14 items-center justify-between rounded-xl border p-4 transition-all duration-150 select-none text-left focus-ring',
              !isRevealed && 'border-border-default bg-surface-sunken/40 hover:border-primary/50 hover:bg-surface-sunken text-fg cursor-pointer active:scale-[0.99]',
              !isRevealed && isSelected && 'border-primary bg-primary-soft text-primary shadow-xs font-semibold ring-1 ring-primary/30',
              isRevealed && isCorrect && 'border-success-border bg-success-soft text-success pf-reveal-ok font-semibold cursor-default',
              isRevealed && isSelected && !isCorrect && 'border-error-border bg-error-soft text-error pf-reveal-bad font-semibold cursor-default',
              isRevealed && !isSelected && !isCorrect && 'border-border-subtle bg-surface-raised/40 text-fg-subtle opacity-40 cursor-default',
            )}
          >
            <div className="flex items-center gap-3.5">
              {indicatorType === 'number' ? (
                <span
                  className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded-md font-mono text-tiny font-semibold transition-colors',
                    !isRevealed && 'border border-border-strong bg-surface-base text-fg-muted group-hover:border-primary/60 group-hover:text-primary',
                    isRevealed && isCorrect && 'border border-success bg-success-soft text-success',
                    isRevealed && isSelected && !isCorrect && 'border border-error bg-error-soft text-error',
                    isRevealed && !isCorrect && !isSelected && 'border border-border-subtle bg-surface-base text-fg-subtle opacity-60',
                  )}
                  aria-hidden
                >
                  {idx + 1}
                </span>
              ) : (
                <div
                  className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                    !isSelected && !isRevealed && 'border-border-strong bg-surface-base',
                    !isSelected && isRevealed && !isCorrect && 'border-border-subtle bg-surface-base',
                    !isSelected && isRevealed && isCorrect && 'border-success bg-surface-base',
                    isSelected && !isRevealed && 'border-primary bg-surface-base',
                    isRevealed && isCorrect && 'border-success bg-surface-base',
                    isRevealed && isSelected && !isCorrect && 'border-error bg-surface-base',
                  )}
                  aria-hidden
                >
                  {isSelected && (
                    <div
                      className={cn(
                        'size-2.5 rounded-full transition-transform duration-150',
                        !isRevealed && 'bg-primary',
                        isRevealed && isCorrect && 'bg-success shadow-xs scale-110',
                        isRevealed && !isCorrect && 'bg-error shadow-xs',
                      )}
                    />
                  )}
                </div>
              )}

              <span className="text-body-md font-medium">{option.label}</span>
            </div>

            {isRevealed && (
              <div className="shrink-0">
                {isCorrect ? (
                  <Check size={20} className="text-success" />
                ) : isSelected ? (
                  <X size={20} className="text-error" />
                ) : null}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
