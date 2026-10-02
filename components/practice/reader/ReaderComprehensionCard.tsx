'use client'

// Planned structure:
// <ReaderComprehensionCard>
//   <PastelCard tone="butter">
//     <CardHeader>
//       <COMPRUEBABadge /> (Pill negro)
//       <QuestionProgressText /> (Pregunta 1 de 3)
//     </CardHeader>
//     <QuestionPromptText /> (Bricolage font-display)
//     <OptionsList>
//       <OptionItem /> (White rounded pill cards with A, B, C, D circles)
//     </OptionsList>
//     <HintText /> (Pista: búscala en la tercera frase.)
//     <StatusFeedbackText /> (role="status")
//     <SaveErrorAlert /> (role="alert")
//   </PastelCard>
// </ReaderComprehensionCard>

import { cn } from '@/lib/cn'
import PastelCard from '@/components/layout/PastelCard'
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
  currentQuestionIdx?: number
  totalQuestions?: number
  hintText?: string
}

export function ReaderComprehensionCard({
  question,
  answered,
  selectedIndex,
  saving,
  saveError,
  onChoose,
  currentQuestionIdx = 1,
  totalQuestions = 3,
  hintText = 'Pista: búscala en la tercera frase.',
}: ReaderComprehensionCardProps) {
  return (
    <PastelCard tone="butter" className="rounded-3xl p-6 shadow-xs flex flex-col gap-4 border border-black/10">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-ink text-paper px-3.5 py-1 text-xs font-bold uppercase tracking-wider shadow-2xs">
          COMPRUEBA
        </span>
        <span className="text-xs font-mono font-semibold text-fg/75">
          Pregunta {currentQuestionIdx} de {totalQuestions}
        </span>
      </div>

      {/* Question Prompt with Bricolage Font */}
      <h3 className="font-display font-bold text-xl sm:text-2xl text-fg leading-snug mt-1">
        {question.prompt}
      </h3>

      {/* Options List */}
      <div className="grid gap-3 mt-1">
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
                'group flex items-center justify-between gap-3 rounded-2xl border p-3.5 text-left text-sm font-medium transition-all duration-150 shadow-2xs cursor-pointer',
                !answered &&
                  'border-black/10 bg-paper hover:bg-paper/90 hover:border-black/20 text-fg active:scale-[0.99] focus-ring',
                answered &&
                  isCorrect &&
                  'border-success bg-success-soft text-fg font-bold ring-2 ring-success/40',
                answered &&
                  isSelected &&
                  !isCorrect &&
                  'border-error bg-error-soft text-fg font-bold ring-2 ring-error/40',
                answered &&
                  !isSelected &&
                  !isCorrect &&
                  'border-black/5 bg-paper/60 opacity-60 text-fg/70',
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold transition-colors shadow-2xs',
                    !answered && 'bg-surface-sunken border border-black/5 text-fg-muted group-hover:text-fg',
                    answered && isCorrect && 'bg-success text-white',
                    answered && isSelected && !isCorrect && 'bg-error text-white',
                    answered && !isSelected && !isCorrect && 'bg-surface-sunken text-fg-muted/60',
                  )}
                >
                  {optionLetter}
                </span>
                <span className="leading-snug text-fg">{opt}</span>
              </div>
              {answered && isCorrect && <Check className="size-4 shrink-0 text-success" />}
              {answered && isSelected && !isCorrect && <X className="size-4 shrink-0 text-error" />}
            </button>
          )
        })}
      </div>

      {/* Hint Text */}
      {hintText && (
        <p className="text-xs font-mono text-fg/75 mt-1">
          {hintText}
        </p>
      )}

      {answered && (
        <p
          role="status"
          className={cn(
            'text-xs font-bold pt-1',
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
          className="flex items-center justify-between gap-2 text-xs text-warning bg-warning-soft/40 border border-warning/40 rounded-xl p-3 mt-1 font-medium"
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
              className="shrink-0 text-xs"
            >
              Reintentar
            </Button>
          )}
        </div>
      )}
    </PastelCard>
  )
}
