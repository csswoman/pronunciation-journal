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
              'group flex w-full min-h-18 items-center justify-between rounded-full border-2 px-6 py-4 transition-all duration-150 select-none text-left focus-ring',
              !isRevealed && !isSelected && 'border-transparent bg-surface-sunken hover:border-primary/40 text-fg cursor-pointer active:scale-[0.99]',
              !isRevealed && isSelected && 'border-primary bg-surface-raised text-fg font-bold cursor-pointer',
              isRevealed && isCorrect && 'border-mint-deep/60 bg-mint text-ink font-bold dark:bg-mint/30 dark:text-fg dark:border-mint/60 pf-reveal-ok cursor-default shadow-xs',
              isRevealed && isSelected && !isCorrect && 'border-coral-deep/60 bg-coral text-ink font-bold dark:bg-coral/30 dark:text-fg dark:border-coral/60 pf-reveal-bad cursor-default shadow-xs',
              isRevealed && !isSelected && !isCorrect && 'border-border-subtle bg-surface-raised/40 text-fg-subtle opacity-40 cursor-default',
            )}
          >
            <div className="flex items-center gap-3.5">
              {indicatorType === 'number' ? (
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-full text-body-sm font-bold transition-colors',
                    !isRevealed && !isSelected && 'bg-transparent text-fg-muted border-2 border-border-strong group-hover:border-primary/60 group-hover:text-primary',
                    !isRevealed && isSelected && 'bg-primary text-on-primary font-bold',
                    isRevealed && isCorrect && 'bg-ink/15 text-ink dark:bg-paper/20 dark:text-fg font-bold',
                    isRevealed && isSelected && !isCorrect && 'bg-ink/15 text-ink dark:bg-paper/20 dark:text-fg font-bold',
                    isRevealed && !isCorrect && !isSelected && 'bg-surface-base text-fg-subtle opacity-50',
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
                    !isSelected && isRevealed && isCorrect && 'border-ink/40 bg-surface-base',
                    isSelected && !isRevealed && 'border-primary bg-surface-base',
                    isRevealed && isCorrect && 'border-ink bg-ink text-paper dark:border-paper dark:bg-paper dark:text-ink',
                    isRevealed && isSelected && !isCorrect && 'border-ink bg-ink text-paper dark:border-paper dark:bg-paper dark:text-ink',
                  )}
                  aria-hidden
                >
                  {isSelected && !isRevealed && (
                    <div className="size-2.5 rounded-full bg-primary transition-transform duration-150" />
                  )}
                </div>
              )}

              <span className="text-body-lg font-medium">{option.label}</span>
            </div>

            {isRevealed && (
              <div className="shrink-0" aria-hidden="true">
                {isCorrect ? (
                  <Check size={20} className="text-ink dark:text-fg stroke-[2.5]" />
                ) : isSelected ? (
                  <X size={20} className="text-ink dark:text-fg stroke-[2.5]" />
                ) : null}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
