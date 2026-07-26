'use client'

// Planned structure:
// <PronunciationProductionPrompt>
//   <PromptCopy />
//   <RecordingWaveform />   (listening)
//   <RecordControl />       (mic + live status)
//   <HeardConfirmation />   (done — transcript before advance)
//   <SkipButton />
// </PronunciationProductionPrompt>

import { useEffect, useRef, useState } from 'react'
import { Mic, MicOff } from '@/components/icons'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { micErrorMessage } from '@/components/practice/essential-words/mic-error-message'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { getLearnerTargetCopy } from '@/lib/pronunciation/assessment/learner-copy'
import type { SpokenAttempt } from '@/lib/pronunciation/spoken-attempt'
import type { DiagnosticPromptSelection } from '@/lib/pronunciation/assessment/prompt-selection'

interface PronunciationProductionPromptProps {
  userId: string
  selection: DiagnosticPromptSelection
  onAttempt: (attempt: SpokenAttempt) => void
}

const WAVE_HEIGHTS = [36, 58, 72, 48, 84, 62, 40, 70, 52, 78, 44, 66]

function buildAttempt(
  userId: string,
  targetText: string,
  targetId: string,
  transcript: string,
  overallScore: number,
  outcome: SpokenAttempt['outcome']
): SpokenAttempt {
  return {
    userId,
    targetText,
    transcript,
    evaluatorVersion: 'diagnostic-stt-v1',
    scoreKind: 'stt_intelligibility',
    overallScore,
    targetId,
    durationMs: 0,
    outcome,
  }
}

export function PronunciationProductionPrompt({
  userId,
  selection,
  onAttempt,
}: PronunciationProductionPromptProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const { status, result, errorCode, isSupported, start, stop, reset } = useSpeechRecognition()
  const { title, ipaHint, speakCue } = getLearnerTargetCopy(selection.targetId)
  const targetText = speakCue ?? title
  const submittedRef = useRef(false)
  const noSpeechGraceRef = useRef(false)
  const [confirmed, setConfirmed] = useState(false)
  const [graceListening, setGraceListening] = useState(false)

  useEffect(() => {
    headingRef.current?.focus()
    submittedRef.current = false
    noSpeechGraceRef.current = false
    setConfirmed(false)
    setGraceListening(false)
    reset()
  }, [selection.targetId, reset])

  // One free retry on silence so reading the phrase before speaking isn't punished.
  useEffect(() => {
    if (status !== 'error' || errorCode !== 'no-speech') return
    if (noSpeechGraceRef.current) return
    noSpeechGraceRef.current = true
    setGraceListening(true)
    reset()
    void start()
  }, [status, errorCode, reset, start])

  function submit(attempt: SpokenAttempt) {
    if (submittedRef.current) return
    submittedRef.current = true
    onAttempt(attempt)
  }

  function skip() {
    submit(
      buildAttempt(userId, targetText, selection.targetId, '', 0, 'skipped')
    )
  }

  function confirmHeard() {
    if (!result || confirmed) return
    setConfirmed(true)
    submit(
      buildAttempt(
        userId,
        targetText,
        selection.targetId,
        result.transcript,
        result.confidence * 100,
        result.transcript.trim().length > 0 ? 'scored' : 'failed'
      )
    )
  }

  const isListening = status === 'listening'
  const isError = status === 'error'
  const isDone = status === 'done' && result !== null
  const heardText = result?.transcript.trim() ?? ''

  return (
    <fieldset className="flex min-w-0 flex-col items-stretch gap-5 sm:items-center">
      <legend className="sr-only">Pregunta de producción oral</legend>
      <div className="flex min-w-0 flex-col items-center gap-2 text-center">
        <p className="font-kicker text-fg-muted">Di en voz alta</p>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="min-w-0 text-pretty break-words text-h4 text-fg outline-none"
        >
          {targetText}
        </h2>
        <p className="text-pretty font-body-sm text-fg-muted">
          Enfoque: {title}
          {ipaHint ? (
            <>
              {' '}
              <span className="font-ipa" aria-label={title}>
                ({ipaHint})
              </span>
            </>
          ) : null}
        </p>
      </div>

      {isSupported && !isDone ? (
        <div className="flex w-full flex-col items-center gap-3 sm:max-w-xs">
          {isListening ? (
            <div
              className="flex h-8 w-full max-w-[12rem] items-center justify-center gap-0.5"
              aria-hidden
            >
              <style>{`
                @keyframes diag-wave-pulse {
                  0%, 100% { transform: scaleY(0.35); opacity: 0.35; }
                  50% { transform: scaleY(1); opacity: 0.85; }
                }
                @media (prefers-reduced-motion: reduce) {
                  @keyframes diag-wave-pulse {
                    0%, 100% { transform: none; opacity: 0.5; }
                  }
                }
              `}</style>
              {WAVE_HEIGHTS.map((height, index) => (
                <span
                  key={index}
                  className="inline-block w-0.5 origin-center rounded-full bg-primary"
                  style={{
                    height: `${height}%`,
                    animation: 'diag-wave-pulse 1.4s ease-in-out infinite',
                    animationDelay: `${index * 0.05}s`,
                  }}
                />
              ))}
            </div>
          ) : null}

          <Button
            type="button"
            fullWidth
            className={cn('min-h-11', isListening && 'ring-2 ring-primary/35 ring-offset-2 ring-offset-surface-base')}
            variant={isListening ? 'soft' : 'primary'}
            icon={isListening ? <MicOff size={16} aria-hidden /> : <Mic size={16} aria-hidden />}
            onClick={isListening ? stop : start}
            aria-label={isListening ? 'Detener grabación' : 'Grabar'}
            aria-pressed={isListening}
          >
            {isListening ? 'Detener' : 'Grabar'}
          </Button>

          <p
            role="status"
            aria-live="polite"
            className="m-0 text-center font-body-sm text-fg-muted"
          >
            {isListening
              ? graceListening
                ? 'Sin voz aún — seguimos escuchando. Di la frase cuando puedas.'
                : 'Escuchando… toca Detener cuando termines'
              : 'Toca Grabar y di la frase'}
          </p>
        </div>
      ) : null}

      {!isSupported ? (
        <p className="text-pretty text-center font-body-sm text-fg-muted">
          Tu navegador no soporta reconocimiento de voz. Puedes saltar esta pregunta.
        </p>
      ) : null}

      {isDone ? (
        <div
          role="status"
          aria-live="polite"
          className="flex w-full max-w-md flex-col items-center gap-3 rounded-md bg-surface-sunken px-4 py-3 text-center"
        >
          <p className="font-kicker text-fg-muted">Te escuché</p>
          <p className="min-w-0 text-pretty break-words text-h4 text-fg">
            {heardText.length > 0 ? `“${heardText}”` : 'No capturé palabras claras'}
          </p>
          <p className="text-pretty font-body-sm text-fg-muted">
            {heardText.length > 0
              ? 'Si se oye bien, continúa. Si no, graba de nuevo.'
              : 'No pasó nada: puedes continuar o grabar de nuevo.'}
          </p>
          <div className="flex w-full flex-col gap-2 sm:max-w-xs">
            <Button
              type="button"
              fullWidth
              className="min-h-11"
              onClick={confirmHeard}
              disabled={confirmed}
            >
              Continuar
            </Button>
            <Button
              type="button"
              variant="ghost"
              fullWidth
              className="min-h-11"
              onClick={() => {
                submittedRef.current = false
                noSpeechGraceRef.current = false
                setConfirmed(false)
                setGraceListening(false)
                reset()
              }}
            >
              Grabar de nuevo
            </Button>
          </div>
        </div>
      ) : null}

      {isError && !(errorCode === 'no-speech' && !noSpeechGraceRef.current) ? (
        <p role="alert" className="text-pretty text-center font-body-sm text-error">
          {errorCode === 'no-speech'
            ? 'Todavía no captamos voz. Graba de nuevo o salta si prefieres.'
            : micErrorMessage(errorCode)}
        </p>
      ) : null}

      {!isDone ? (
        <Button type="button" variant="ghost" className="min-h-11 text-fg-subtle" onClick={skip}>
          Saltar
        </Button>
      ) : null}
    </fieldset>
  )
}
