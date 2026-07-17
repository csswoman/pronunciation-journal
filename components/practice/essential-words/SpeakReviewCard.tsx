'use client'

// Planned structure:
// <SpeakReviewCard>
//   <SentencePrompt />
//   <MicButton | SelfGradeBar />
//   <QuietSpeakFeedback + PhonemeFeedbackTable />
//   <SpeakSkipActions />
// </SpeakReviewCard>

import { useCallback, useEffect, useRef, useState } from 'react'
import { Mic, MicOff } from '@/components/icons'
import { speak } from '@/lib/phoneme-practice/tts'
import { PillButton } from '@/components/ui/PillButton'
import { ListenButton } from '@/components/ui/ListenButton'
import { useSpeechInput } from '@/hooks/useSpeechInput'
import { useSharedMicStream } from '@/hooks/useSharedMicStream'
import { defaultEvaluationEngine } from '@/lib/exercises/evaluation'
import { getEvaluationWordResults } from '@/lib/exercises/evaluation/word-results'
import { accuracyToQuality } from '@/lib/srs'
import { getFeedbackMessage } from '@/lib/pronunciation/scoring'
import { PhonemeFeedbackTable } from '@/components/lesson/PhonemeFeedbackTable'
import { SelfGradeBar } from './SelfGradeBar'
import { QuietSpeakFeedback } from './QuietSpeakFeedback'
import { SpeakSkipActions } from './SpeakSkipActions'
import { micErrorMessage } from './mic-error-message'
import { playUiCue } from '@/lib/ui-sounds/cues'
import { cn } from '@/lib/cn'
import type { CoreWord } from '@/lib/core-1000/types'
import type { WordResult } from '@/lib/types'

interface Props {
  entry: CoreWord
  onGraded: (quality: number, extras?: { accuracy: number; transcript: string }) => Promise<void>
  onArchive: () => void
  fromSnooze?: boolean
  onKeepSnooze?: () => void
  onMaster?: () => void
}

interface Scored {
  score: number
  wordResults: WordResult[]
  transcript: string
}

export function SpeakReviewCard({
  entry,
  onGraded,
  onArchive,
  fromSnooze,
  onKeepSnooze,
  onMaster,
}: Props) {
  const { getStream, release } = useSharedMicStream()
  const { state, result, error: speechError, isSupported, start, stop, abort, reset } =
    useSpeechInput({ prefer: 'auto', getStream })

  const [scored, setScored] = useState<Scored | null>(null)
  const [isScoring, setIsScoring] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [micError, setMicError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const submitted = useRef(false)

  const sentence = entry.example_sentence

  useEffect(() => {
    submitted.current = false
    setScored(null)
    setMicError(null)
    setSubmitError(null)
    abort()
    release()
    reset()
  }, [entry.rank, abort, release, reset])

  useEffect(() => {
    if (state !== 'done' || !result || isScoring || scored) return
    setIsScoring(true)
    defaultEvaluationEngine
      .evaluate({
        exercise: { domain: 'pronunciation', mode: 'speak' },
        expected: sentence,
        actual: { kind: 'speech', transcript: result.transcript },
      })
      .then((evalResult) => {
        const score = evalResult.score ?? 0
        setScored({
          score,
          wordResults: getEvaluationWordResults(evalResult),
          transcript: result.transcript,
        })
        if (score >= 85) playUiCue('correct')
        else if (score >= 60) playUiCue('reveal')
        else playUiCue('wrong')
      })
      .finally(() => {
        setIsScoring(false)
        release()
      })
  }, [state, result, isScoring, scored, sentence, release])

  const handleMicToggle = useCallback(async () => {
    if (state === 'listening') {
      setMicError(null)
      await stop()
      return
    }
    setMicError(null)
    abort()
    reset()
    try {
      await getStream()
      await start()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'not-allowed'
      setMicError(msg)
      release()
    }
  }, [state, stop, abort, reset, getStream, start, release])

  const handleContinue = () => {
    if (!scored || submitted.current) return
    submitted.current = true
    setSubmitError(null)
    setIsSubmitting(true)
    void onGraded(accuracyToQuality(scored.score), {
      accuracy: scored.score,
      transcript: scored.transcript,
    })
      .catch(() => {
        submitted.current = false
        setSubmitError('No se pudo guardar este resultado. Intenta de nuevo.')
      })
      .finally(() => {
        setIsSubmitting(false)
      })
  }

  const handleSelfGrade = (quality: number) => {
    if (submitted.current) return
    submitted.current = true
    setSubmitError(null)
    setIsSubmitting(true)
    void onGraded(quality)
      .catch(() => {
        submitted.current = false
        setSubmitError('No se pudo guardar este resultado. Intenta de nuevo.')
      })
      .finally(() => {
        setIsSubmitting(false)
      })
  }

  const handleRetry = () => {
    setScored(null)
    setMicError(null)
    setSubmitError(null)
    abort()
    release()
    reset()
  }

  const isListening = state === 'listening'
  const isProcessing = state === 'processing' || isScoring
  const isError = state === 'error' || !!micError || !!speechError
  const errorDetail = micError ?? speechError
  const useFallback = !isSupported
  const feedback = scored ? getFeedbackMessage(scored.score, 70) : null

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-2xl bg-surface-raised px-6 py-7 shadow-sm">
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="m-0 text-sm font-medium text-fg-muted">Di la oración</p>
        <p className="m-0 text-xl text-balance text-fg">{sentence}</p>
        {entry.sentence_ipa && (
          <p className="ipa m-0 max-w-[36ch] text-center text-fg-muted">
            {entry.sentence_ipa}
          </p>
        )}
      </div>

      <ListenButton onPlay={() => speak(sentence, { rate: 0.95 })} label="Escuchar modelo" />

      {useFallback ? (
        <div className="flex w-full flex-col items-center gap-2">
          <p className="m-0 text-xs text-fg-subtle">
            Micrófono no disponible en este navegador — practica en voz alta y califícate:
          </p>
          <SelfGradeBar onGrade={handleSelfGrade} />
          {submitError && <p className="m-0 text-center text-xs text-error">{submitError}</p>}
        </div>
      ) : !scored ? (
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => void handleMicToggle()}
            disabled={isProcessing}
            aria-label={isListening ? 'Detener grabación' : 'Grabar mi voz'}
            className={cn(
              'flex h-16 w-16 items-center justify-center rounded-full border-none text-on-primary transition-colors focus-ring disabled:opacity-40',
              isListening ? 'bg-error' : 'bg-primary',
            )}
          >
            {isListening ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
          <p className="m-0 text-xs tracking-[.05em] text-fg-subtle">
            {isListening
              ? 'Escuchando… toca para parar'
              : isProcessing
                ? 'Analizando…'
                : 'Toca para hablar'}
          </p>
          {isError && (
            <p className="m-0 max-w-xs text-center text-xs text-error">
              {micErrorMessage(errorDetail)}{' '}
              <button
                type="button"
                onClick={handleRetry}
                className="cursor-pointer border-none bg-transparent font-[inherit] text-xs text-error underline focus-ring"
              >
                Reintentar
              </button>
            </p>
          )}
        </div>
      ) : (
        <div className="flex w-full flex-col items-center gap-4">
          {feedback && (
            <QuietSpeakFeedback accuracy={scored.score} message={feedback.message} />
          )}
          <PhonemeFeedbackTable wordResults={scored.wordResults} />
          <div className="flex gap-2">
            <PillButton variant="outline" size="sm" onClick={handleRetry}>
              Intentar de nuevo
            </PillButton>
            <PillButton variant="primary" size="sm" onClick={handleContinue} disabled={isSubmitting}>
              Continuar
            </PillButton>
          </div>
          {submitError && <p className="m-0 text-center text-xs text-error">{submitError}</p>}
        </div>
      )}

      <SpeakSkipActions
        onArchive={onArchive}
        fromSnooze={fromSnooze}
        onKeepSnooze={onKeepSnooze}
        onMaster={onMaster}
      />
    </div>
  )
}
