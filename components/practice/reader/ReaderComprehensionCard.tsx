'use client'

// Planned structure:
// <ReaderComprehensionCard>
//   <KickerAndPrompt />
//   <OptionsList />
//   <FeedbackAndRetryAlert />
// </ReaderComprehensionCard>

import { cn } from '@/lib/cn'
import Button from '@/components/ui/Button'
import { Check, X } from '@/components/icons'
import type { ReaderQuestion } from '@/lib/practice/reader/types'

interface ReaderComprehensionCardProps {
  question: ReaderQuestion
  answered: boolean
  selectedIndex: number | null
  saving: boolean
  saveError: boolean
  onChoose: (index: number) => void
}

export function ReaderComprehensionCard({
  question,
  answered,
  selectedIndex,
  saving,
  saveError,
  onChoose,
}: ReaderComprehensionCardProps) {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border-default bg-surface-raised p-6 sm:p-7 shadow-xs">
      <div className="flex items-center gap-2">
        <span className="font-kicker text-caption uppercase tracking-wider text-fg-muted">
          Comprobación de lectura
        </span>
      </div>

      <p className="text-h3 font-medium text-fg leading-snug">{question.prompt}</p>

      <div className="grid gap-2.5">
        {question.options.map((opt, i) => {
          const isSelected = selectedIndex === i
          const isCorrect = i === question.correctIndex
          const optionLetter = ['A', 'B', 'C', 'D'][i] ?? `${i + 1}`

          return (
            <button
              key={opt}
              type="button"
              aria-label={opt}
              onClick={() => onChoose(i)}
              disabled={answered || saving}
              className={cn(
                'group flex items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left text-body transition-all duration-150',
                !answered &&
                  'border-border-default bg-surface-sunken/40 hover:border-border-hover hover:bg-surface-sunken/80 cursor-pointer active:scale-[0.99] focus-ring',
                answered &&
                  isCorrect &&
                  'border-success bg-success-soft text-fg font-medium ring-1 ring-success/30',
                answered &&
                  isSelected &&
                  !isCorrect &&
                  'border-error bg-error-soft text-fg font-medium ring-1 ring-error/30',
                answered &&
                  !isSelected &&
                  !isCorrect &&
                  'border-border-subtle bg-surface-base/40 opacity-60 text-fg-muted',
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full text-tiny font-semibold transition-all duration-150',
                    !answered &&
                      'bg-surface-sunken text-fg-muted border border-border-subtle group-hover:border-border-default group-hover:text-fg',
                    answered && isCorrect && 'bg-success text-white shadow-xs',
                    answered && isSelected && !isCorrect && 'bg-error text-white shadow-xs',
                    answered && !isSelected && !isCorrect && 'bg-surface-sunken text-fg-muted/60',
                  )}
                >
                  {optionLetter}
                </span>
                <span className="leading-snug">{opt}</span>
              </div>
              {answered && isCorrect && <Check className="size-4 shrink-0 text-success" />}
              {answered && isSelected && !isCorrect && <X className="size-4 shrink-0 text-error" />}
            </button>
          )
        })}
      </div>

      {answered && (
        <p
          role="status"
          className={cn(
            'text-body-sm font-medium pt-1',
            selectedIndex === question.correctIndex ? 'text-success' : 'text-error',
          )}
        >
          {saving
            ? 'Saving progress…'
            : selectedIndex === question.correctIndex
              ? 'Correcto. Esta lectura cuenta en tu progreso.'
              : 'No exactamente. Revisa el texto y compara con la respuesta marcada.'}
        </p>
      )}

      {saveError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-2 text-body-sm text-warning bg-warning-soft/30 border border-warning/30 rounded-lg p-3 mt-1"
        >
          <span>
            Your answer is shown here, but progress could not be saved. Try again when the connection
            recovers.
          </span>
          {selectedIndex !== null && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onChoose(selectedIndex)}
              disabled={saving}
              className="shrink-0"
            >
              Reintentar
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
