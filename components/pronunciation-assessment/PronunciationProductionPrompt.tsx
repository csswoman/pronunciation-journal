'use client'

import { useEffect, useRef } from 'react'
import { Mic, MicOff } from '@/components/icons'
import Button from '@/components/ui/Button'
import { micErrorMessage } from '@/components/practice/essential-words/mic-error-message'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { getTarget } from '@/lib/pronunciation/targets/registry'
import type { SpokenAttempt } from '@/lib/pronunciation/spoken-attempt'
import type { DiagnosticPromptSelection } from '@/lib/pronunciation/assessment/prompt-selection'

interface PronunciationProductionPromptProps {
  userId: string
  selection: DiagnosticPromptSelection
  onAttempt: (attempt: SpokenAttempt) => void
}

/**
 * Minimal production prompt: reuses `useSpeechRecognition` (already the
 * established mic + Web Speech API hook — see `SpeakScoredExercise.tsx`)
 * to capture a spoken attempt and turns the transcript into a `SpokenAttempt`
 * for `scoreProductionPrompt` (step 4) to grade. No audio is persisted here.
 *
 * Kept intentionally minimal: one target word (the target's label) said
 * once, recognized, and submitted — the plan's emphasis is the results
 * experience, not prompt-taking polish.
 */
export function PronunciationProductionPrompt({ userId, selection, onAttempt }: PronunciationProductionPromptProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const { status, result, errorCode, isSupported, start, stop, reset } = useSpeechRecognition()
  const lookup = getTarget(selection.targetId)
  const label = lookup.ok ? lookup.target.label : selection.targetId
  const submittedRef = useRef(false)

  useEffect(() => {
    headingRef.current?.focus()
    submittedRef.current = false
    reset()
    // `reset` (from useSpeechRecognition) has a stable identity, so it's
    // safe to omit from deps without disabling the lint rule.
  }, [selection.targetId, reset])

  useEffect(() => {
    if (status !== 'done' || !result || submittedRef.current) return
    submittedRef.current = true
    const attempt: SpokenAttempt = {
      userId,
      targetText: label,
      transcript: result.transcript,
      evaluatorVersion: 'diagnostic-stt-v1',
      scoreKind: 'stt_intelligibility',
      overallScore: result.confidence * 100,
      targetId: selection.targetId,
      durationMs: 0,
      outcome: result.transcript.trim().length > 0 ? 'scored' : 'failed',
    }
    onAttempt(attempt)
  }, [status, result, userId, label, selection.targetId, onAttempt])

  function skip() {
    if (submittedRef.current) return
    submittedRef.current = true
    onAttempt({
      userId,
      targetText: label,
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
    <fieldset className="flex flex-col items-center gap-4 rounded-md border border-[var(--border-default)] bg-[var(--surface-raised)] p-4">
      <legend className="sr-only">Pregunta de producción oral</legend>
      <h2 ref={headingRef} tabIndex={-1} className="text-[15px] font-semibold text-[var(--text-primary)] outline-none">
        Di en voz alta: {label}
      </h2>

      {isSupported ? (
        <Button
          type="button"
          variant={isListening ? 'error' : 'primary'}
          icon={isListening ? <MicOff size={18} aria-hidden /> : <Mic size={18} aria-hidden />}
          onClick={isListening ? stop : start}
          aria-label={isListening ? 'Detener grabación' : 'Grabar'}
        >
          {isListening ? 'Detener' : 'Grabar'}
        </Button>
      ) : (
        <p className="text-[13px] text-[var(--text-secondary)]">
          Tu navegador no soporta reconocimiento de voz. Puedes saltar esta pregunta.
        </p>
      )}

      {isError && (
        <p role="alert" className="text-[13px] text-[var(--error)]">
          {micErrorMessage(errorCode)}
        </p>
      )}

      <Button type="button" variant="ghost" size="sm" onClick={skip}>
        Saltar
      </Button>
    </fieldset>
  )
}
