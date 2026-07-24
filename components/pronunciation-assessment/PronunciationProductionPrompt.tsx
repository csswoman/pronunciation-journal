'use client'

import { useEffect, useRef } from 'react'
import { Mic, MicOff } from '@/components/icons'
import Button from '@/components/ui/Button'
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

export function PronunciationProductionPrompt({ userId, selection, onAttempt }: PronunciationProductionPromptProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const { status, result, errorCode, isSupported, start, stop, reset } = useSpeechRecognition()
  const { title, ipaHint, speakCue } = getLearnerTargetCopy(selection.targetId)
  const targetText = speakCue ?? title
  const submittedRef = useRef(false)

  useEffect(() => {
    headingRef.current?.focus()
    submittedRef.current = false
    reset()
  }, [selection.targetId, reset])

  useEffect(() => {
    if (status !== 'done' || !result || submittedRef.current) return
    submittedRef.current = true
    const attempt: SpokenAttempt = {
      userId,
      targetText,
      transcript: result.transcript,
      evaluatorVersion: 'diagnostic-stt-v1',
      scoreKind: 'stt_intelligibility',
      overallScore: result.confidence * 100,
      targetId: selection.targetId,
      durationMs: 0,
      outcome: result.transcript.trim().length > 0 ? 'scored' : 'failed',
    }
    onAttempt(attempt)
  }, [status, result, userId, targetText, selection.targetId, onAttempt])

  function skip() {
    if (submittedRef.current) return
    submittedRef.current = true
    onAttempt({
      userId,
      targetText,
      transcript: '',
      evaluatorVersion: 'diagnostic-stt-v1',
      scoreKind: 'stt_intelligibility',
      overallScore: 0,
      targetId: selection.targetId,
      durationMs: 0,
      outcome: 'skipped',
    })
  }

  const isListening = status === 'listening'
  const isError = status === 'error'

  return (
    <fieldset className="flex min-w-0 flex-col items-stretch gap-5 sm:items-center">
      <legend className="sr-only">Pregunta de producción oral</legend>
      <div className="flex min-w-0 flex-col items-center gap-2 text-center">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="font-kicker text-fg-muted outline-none"
        >
          Di en voz alta
        </h2>
        <p className="min-w-0 text-pretty break-words text-h4 text-fg">{targetText}</p>
        <p className="text-pretty font-body-sm text-fg-muted">
          Enfoque: {title}
          {ipaHint ? (
            <>
              {' '}
              <span className="font-ipa">({ipaHint})</span>
            </>
          ) : null}
        </p>
      </div>

      {isSupported ? (
        <Button
          type="button"
          fullWidth
          className="min-h-11 sm:max-w-xs"
          variant={isListening ? 'error' : 'primary'}
          icon={isListening ? <MicOff size={18} aria-hidden /> : <Mic size={18} aria-hidden />}
          onClick={isListening ? stop : start}
          aria-label={isListening ? 'Detener grabación' : 'Grabar'}
        >
          {isListening ? 'Detener' : 'Grabar'}
        </Button>
      ) : (
        <p className="text-pretty text-center font-body-sm text-fg-muted">
          Tu navegador no soporta reconocimiento de voz. Puedes saltar esta pregunta.
        </p>
      )}

      {isError && (
        <p role="alert" className="text-pretty text-center font-body-sm text-error">
          {micErrorMessage(errorCode)}
        </p>
      )}

      <Button type="button" variant="ghost" className="min-h-11" onClick={skip}>
        Saltar
      </Button>
    </fieldset>
  )
}
