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
  return (
    <>
      {!online && (
        <p
          role="status"
          className="m-0 w-full rounded-[var(--radius-md)] border border-warning-border bg-warning-soft px-3 py-2 text-body-sm text-warning"
        >
          Sin conexión. Conéctate para grabar y corregir tu respuesta.
        </p>
      )}

      {!isMicError && (
        <div className="flex flex-col items-center gap-2 py-2">
          <button
            type="button"
            onClick={onToggleMic}
            disabled={isDone || grading || !online}
            aria-label={isListening ? 'Detener grabación' : 'Grabar mi voz'}
            className={cn(
              'flex h-20 w-20 items-center justify-center rounded-full border-none text-on-primary transition-all focus-ring disabled:opacity-40 cursor-pointer',
              isListening
                ? 'bg-error shadow-[0_0_0_14px_color-mix(in_oklch,var(--error)_18%,transparent)]'
                : 'bg-primary shadow-[0_4px_16px_color-mix(in_oklch,var(--primary)_35%,transparent)]',
            )}
          >
            {isListening ? <MicOff size={28} /> : <Mic size={28} />}
          </button>
          <p className="m-0 text-body-sm text-fg-subtle">
            {isListening
              ? 'Escuchando… toca para parar'
              : grading
                ? 'Corrigiendo…'
                : 'Toca para hablar'}
          </p>
        </div>
      )}

      {isMicError && (
        <p className="m-0 text-center text-body-sm text-fg-muted" role="alert">
          {speechError === 'not-allowed'
            ? 'Se denegó el acceso al micrófono.'
            : speechError === 'no-speech'
              ? 'No se detectó voz. Toca el micrófono y habla con claridad.'
              : 'No se pudo transcribir tu respuesta. Inténtalo de nuevo.'}{' '}
          <button
            type="button"
            onClick={onRetry}
            className="min-h-11 cursor-pointer border-none bg-transparent px-1 text-body-sm text-fg-muted underline focus-ring"
          >
            Reintentar
          </button>
        </p>
      )}

      <ProductionHint exampleSentence={exampleSentence} exerciseId={exerciseId} />

      {error && (
        <p id={errorId} role="alert" className="m-0 text-body-sm text-error">
          {error}
        </p>
      )}

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
    </>
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
