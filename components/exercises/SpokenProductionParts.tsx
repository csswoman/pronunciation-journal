'use client'

// Planned structure:
// <SpokenProductionControls>
//   <MicButton />
//   <MicError />
//   <ErrorAlert />
//   <SkipLink />
// </SpokenProductionControls>
// <SpokenProductionFeedbackActions />

import type { ReactNode } from 'react'
import { Loader2, Mic, MicOff } from '@/components/icons'
import Button from '@/components/ui/Button'
import { PracticeActionBar, PracticeContinueButton } from '@/components/practice/session/PracticeActionBar'
import { ProductionFeedback } from '@/components/exercises/ProductionFeedback'
import { ScrollingWaveform } from '@/components/ai-coach/missions/scripted/ScrollingWaveform'
import { ListenButton } from '@/components/ui/ListenButton'
import { speak } from '@/lib/phoneme-practice/tts'
import { SCORING_UNAVAILABLE_ES } from '@/lib/speech/browser-support-message'
import { cn } from '@/lib/cn'
import type { ProductionGradeResult } from '@/lib/exercises/production-grade'

export function SpokenProductionControls({
  online,
  isListening,
  isTranscribing,
  isDone,
  grading,
  isMicError,
  speechError,
  error,
  errorId,
  elapsedLabel,
  getSamples,
  peak,
  onToggleMic,
  onRetry,
  onSkip,
  idleHint,
  children,
}: {
  /** Subtítulo del micrófono en reposo (p. ej. narración de varias frases). */
  idleHint?: string
  /** Shown between the mic area and the skip link (e.g. the example hint). */
  children?: ReactNode
  online: boolean
  isListening: boolean
  /** Audio capturado, transcripción en vuelo. El micro ya no escucha. */
  isTranscribing: boolean
  isDone: boolean
  grading: boolean
  isMicError: boolean
  speechError: string | null
  error: string | null
  errorId: string
  elapsedLabel: string | null
  /** Muestras reales del micro para el osciloscopio. */
  getSamples: () => Uint8Array
  peak: number
  onToggleMic: () => void
  onRetry: () => void
  onSkip?: () => void
}) {
  const hasError = isMicError || Boolean(error)
  // Transcribir y corregir son dos fases distintas para nosotros, pero para el
  // estudiante son una sola espera: "la IA está trabajando con mi audio".
  const isBusy = isTranscribing || grading
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

      <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-border bg-surface px-4 py-8 text-center sm:py-10">
        {/* Anillo neutro alrededor del botón azul, como en el diseño. */}
        <span className="flex size-[9rem] items-center justify-center rounded-full bg-surface-sunken">
          <button
            type="button"
            onClick={hasError && !isListening ? onRetry : onToggleMic}
            // Durante transcripción/corrección el audio ya está en vuelo: pulsar
            // aquí reiniciaría la captura y descartaría el intento del estudiante.
            disabled={isDone || isBusy || !online}
            aria-label={
              isListening
                ? 'Detener grabación'
                : isBusy
                  ? 'Procesando tu respuesta'
                  : 'Grabar mi voz'
            }
            className={cn(
              'flex size-[7.25rem] cursor-pointer items-center justify-center rounded-full border-none bg-primary text-on-primary transition-all duration-200 focus-ring disabled:cursor-not-allowed',
              isListening && 'animate-pulse',
              isBusy && 'opacity-70 disabled:opacity-70',
              !isListening && !isBusy && 'hover:opacity-90 active:scale-95 disabled:opacity-40',
              hasError && !isListening && !isBusy && 'ring-4 ring-warning-border',
            )}
          >
            {isBusy ? (
              <Loader2 size={40} className="animate-spin" />
            ) : isListening ? (
              <MicOff size={40} />
            ) : (
              <Mic size={40} />
            )}
          </button>
        </span>

        {(isListening || isBusy) && (
          <ScrollingWaveform
            getSamples={getSamples}
            peak={peak}
            isActive={isListening}
            tone="pronunciacion"
            className="h-6 w-24"
          />
        )}

        <div className="flex flex-col items-center gap-0.5">
          <p className="m-0 text-body-md font-semibold text-fg" role="status" aria-live="polite">
            {isListening
              ? 'Escuchando… habla en voz alta'
              : isTranscribing
                ? 'Escuchando lo que dijiste…'
                : grading
                  ? 'Analizando tu respuesta…'
                  : hasError
                    ? 'Toca para reintentar'
                    : 'Toca para hablar'}
          </p>
          <p className="m-0 text-caption text-fg-muted">
            {isListening
              ? elapsedLabel
                ? `Grabando ${elapsedLabel} · toca el botón cuando termines`
                : 'Toca el botón cuando termines tu oración'
              : isTranscribing
                ? 'Convirtiendo tu audio en texto. No cierres esta pantalla.'
                : grading
                  ? 'Comprobando pronunciación, gramática y tiempo verbal'
                  : (idleHint ?? 'Di tu oración en inglés con claridad')}
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

      {children}

      {onSkip && (
        <button
          type="button"
          onClick={onSkip}
          disabled={isBusy || isListening}
          aria-label="Omitir este ejercicio"
          className="min-h-11 cursor-pointer self-center rounded-md border-none bg-transparent px-1 text-body-md font-medium text-fg-muted underline underline-offset-4 transition-colors hover:text-fg focus-ring disabled:cursor-not-allowed disabled:opacity-40"
        >
          Omitir este ejercicio
        </button>
      )}
    </div>
  )
}

/**
 * Camino sin puntuación cuando el micrófono no es accesible (origen inseguro,
 * permiso bloqueado o dispositivo sin micro). No es cuestión del navegador: la
 * transcripción corre por Gemini en todos. Se conserva la práctica en voz alta
 * y una salida explícita que no penaliza.
 */
export function SpokenProductionUnscored({
  exampleSentence,
  onContinue,
  message = SCORING_UNAVAILABLE_ES,
}: {
  exampleSentence?: string
  onContinue: () => void
  /** Por qué este intento no se puntúa (micrófono o presupuesto de IA). */
  message?: string
}) {
  return (
    <div className="flex w-full flex-col items-center gap-4 rounded-[var(--radius-lg)] border border-border-subtle bg-surface-raised/50 px-4 py-6 text-center">
      <p className="m-0 max-w-[50ch] text-body-sm text-fg-muted">
        {message}
      </p>

      {exampleSentence && (
        <div className="flex flex-col items-center gap-2">
          <p className="m-0 max-w-[50ch] text-body-md font-medium text-fg">
            {exampleSentence}
          </p>
          <ListenButton
            onPlay={() => speak(exampleSentence)}
            label="Escuchar el modelo"
          />
        </div>
      )}

      <PracticeActionBar>
        <PracticeContinueButton onClick={onContinue}>
          Continuar sin puntuación
        </PracticeContinueButton>
      </PracticeActionBar>
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
        {grade.correct ? (
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
