'use client'

// Planned structure:
// <SpokenProductionControls>
//   <MicButton />
//   <MicError />
//   <ProductionHint />
//   <ErrorAlert />
//   <SkipLink />
// </SpokenProductionControls>
// <SpokenProductionFeedbackActions />

import { Mic, MicOff } from '@/components/icons'
import Button from '@/components/ui/Button'
import { PracticeActionBar, PracticeContinueButton } from '@/components/practice/session/PracticeActionBar'
import { ProductionFeedback } from '@/components/exercises/ProductionFeedback'
import { ProductionHint } from '@/components/exercises/ProductionHint'
import { cn } from '@/lib/cn'
import type { ProductionGradeResult } from '@/lib/exercises/production-grade'

export function SpokenProductionControls({
  exampleSentence,
  exerciseId,
  online,
  isListening,
  isDone,
  grading,
  isMicError,
  speechError,
  error,
  errorId,
  onToggleMic,
  onRetry,
  onSkip,
}: {
  exampleSentence?: string
  exerciseId: string
  online: boolean
  isListening: boolean
  isDone: boolean
  grading: boolean
  isMicError: boolean
  speechError: string | null
  error: string | null
  errorId: string
  onToggleMic: () => void
  onRetry: () => void
  onSkip?: () => void
}) {
  const hasError = isMicError || Boolean(error)
  const errorMessage = speechError === 'not-allowed'
    ? 'Se denegó el acceso al micrófono. Concede permisos en tu navegador.'
    : speechError === 'no-speech'
      ? 'No se detectó voz. Habla más cerca del micrófono y con claridad.'
      : (error ?? 'No se pudo transcribir tu respuesta. Toca el micrófono para intentar de nuevo.')

  return (
    <div className="flex w-full flex-col gap-3">
      {!online && (
        <p
          role="status"
          className="m-0 w-full rounded-[var(--radius-md)] border border-warning-border bg-warning-soft px-3.5 py-2.5 text-body-sm text-warning"
        >
          Sin conexión. Conéctate a internet para grabar y corregir tu respuesta.
        </p>
      )}

      <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-border-subtle bg-surface-raised/50 px-4 py-6 text-center sm:py-8">
        <button
          type="button"
          onClick={hasError && !isListening ? onRetry : onToggleMic}
          disabled={isDone || grading || !online}
          aria-label={isListening ? 'Detener grabación' : 'Grabar mi voz'}
          className={cn(
            'flex h-20 w-20 items-center justify-center rounded-full border-none transition-all duration-200 focus-ring disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer',
            isListening && 'bg-error text-on-primary animate-pulse shadow-[0_0_0_12px_color-mix(in_oklch,var(--error)_20%,transparent)]',
            grading && 'bg-primary/80 text-on-primary animate-pulse shadow-[0_0_0_8px_color-mix(in_oklch,var(--primary)_20%,transparent)]',
            !isListening && !grading && (hasError
              ? 'border-2 border-warning-border bg-warning-soft text-warning hover:bg-warning-soft/80'
              : 'bg-primary text-on-primary hover:bg-primary-hover shadow-[0_4px_16px_color-mix(in_oklch,var(--primary)_30%,transparent)] active:scale-95'
            ),
          )}
        >
          {isListening ? <MicOff size={32} /> : <Mic size={32} />}
        </button>

        <div className="flex flex-col items-center gap-0.5">
          <p className="m-0 text-body-md font-semibold text-fg">
            {isListening
              ? 'Escuchando… habla en voz alta'
              : grading
                ? 'Analizando tu respuesta…'
                : hasError
                  ? 'Toca para reintentar'
                  : 'Toca para hablar'}
          </p>
          <p className="m-0 text-caption text-fg-muted">
            {isListening
              ? 'Toca el botón cuando termines tu oración'
              : grading
                ? 'Comprobando pronunciación, gramática y tiempo verbal'
                : 'Di tu oración en inglés con claridad'}
          </p>
        </div>

        {hasError && (
          <div
            id={errorId}
            role="alert"
            className="mt-1 flex max-w-[50ch] flex-col items-center gap-1 rounded-[var(--radius-md)] border border-warning-border/50 bg-warning-soft/50 px-3.5 py-2 text-center text-body-sm text-warning"
          >
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      <ProductionHint exampleSentence={exampleSentence} exerciseId={exerciseId} />

      {onSkip && (
        <button
          type="button"
          onClick={onSkip}
          disabled={grading || isListening}
          aria-label="Omitir este ejercicio"
          className="min-h-11 cursor-pointer self-center border-none bg-transparent px-4 text-body-sm font-medium text-fg-subtle transition-colors hover:text-fg-muted focus-ring disabled:cursor-not-allowed disabled:opacity-40"
        >
          Omitir este
        </button>
      )}
    </div>
  )
}

export function SpokenProductionFeedbackActions({
  grade,
  transcript,
  onContinue,
  onRetry,
}: {
  grade: ProductionGradeResult
  transcript?: string
  onContinue: () => void
  onRetry: () => void
}) {
  return (
    <>
      <ProductionFeedback grade={grade} transcript={transcript} />
      <PracticeActionBar>
        {grade.usedTarget ? (
          <>
            <Button variant="secondary" size="lg" fullWidth onClick={onRetry}>
              Intentar de nuevo
            </Button>
            <PracticeContinueButton onClick={onContinue} />
          </>
        ) : (
          <>
            <Button variant="secondary" size="lg" fullWidth onClick={onContinue}>
              Continuar de todos modos
            </Button>
            <Button variant="primary" size="lg" fullWidth onClick={onRetry}>
              Intentar de nuevo
            </Button>
          </>
        )}
      </PracticeActionBar>
    </>
  )
}
