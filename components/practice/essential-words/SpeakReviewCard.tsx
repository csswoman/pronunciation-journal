'use client'

// Planned structure:
// <SpeakReviewCard>
//   <SentencePrompt />
//   <MicButton | SelfGradeBar />
//   <InlineFeedback + QuietSpeakFeedback + PhonemeFeedbackTable />
//   <SpeakSkipActions />
// </SpeakReviewCard>

import { useCallback, useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Loader2 } from '@/components/icons'
import { speak } from '@/lib/phoneme-practice/tts'
import { PillButton } from '@/components/ui/PillButton'
import { ListenButton } from '@/components/ui/ListenButton'
import { useSpeechInput } from '@/hooks/useSpeechInput'
import { useSharedMicStream } from '@/hooks/useSharedMicStream'
import { defaultEvaluationEngine } from '@/lib/exercises/evaluation'
import { getEvaluationWordResults } from '@/lib/exercises/evaluation/word-results'
import { getFeedbackMessage } from '@/lib/pronunciation/scoring'
import { PhonemeFeedbackTable } from '@/components/lesson/PhonemeFeedbackTable'
import { SelfGradeBar } from './SelfGradeBar'
import { QuietSpeakFeedback } from './QuietSpeakFeedback'
import { InlineFeedback } from '@/components/practice/session/InlineFeedback'
import { SpeakSkipActions } from './SpeakSkipActions'
import { micErrorMessage } from './mic-error-message'
import { playUiCue } from '@/lib/ui-sounds/cues'
import { cn } from '@/lib/cn'
import { selectSentence } from '@/lib/essential-words/sentence-variants'
import { displayEnglishText } from '@/lib/essential-words/word-display'
import { buildSpeakOutcome } from './useSpeakOutcome'
import { ExercisePhaseLabel } from './ExercisePhaseLabel'
import type { AttemptOutcome } from '@/lib/essential-words/attempt-grade'
import type { EssentialWord } from '@/lib/essential-words/types'
import type { WordResult } from '@/lib/types'

interface Props {
  entry: EssentialWord
  levelLabel?: string
  onAttempt: (outcome: AttemptOutcome) => Promise<void>
  onArchive: () => void
  fromSnooze?: boolean
  onKeepSnooze?: () => void
  onMaster?: () => void
  /** SM-2 repetition count — rotates which example sentence is practiced. */
  repetitions?: number
}

interface Scored {
  score: number
  wordResults: WordResult[]
  transcript: string
}

export function SpeakReviewCard({
  entry,
  levelLabel,
  onAttempt,
  onArchive,
  fromSnooze,
  onKeepSnooze,
  onMaster,
  repetitions = 0,
}: Props) {
  const { getStream, release } = useSharedMicStream()
  const { state, result, error: speechError, isSupported, start, stop, abort, reset } =
    useSpeechInput({ prefer: 'auto', getStream })

  const [scored, setScored] = useState<Scored | null>(null)
  const [isScoring, setIsScoring] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [micError, setMicError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showSoundDetail, setShowSoundDetail] = useState(false)
  const submitted = useRef(false)
  const startedAtRef = useRef(Date.now())

  const { sentence } = selectSentence(entry, repetitions)

  useEffect(() => {
    submitted.current = false
    startedAtRef.current = Date.now()
    setScored(null)
    setMicError(null)
    setSubmitError(null)
    setShowSoundDetail(false)
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
    void onAttempt(buildSpeakOutcome({ accuracy: scored.score, startedAt: startedAtRef.current }))
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
    void onAttempt(buildSpeakOutcome({ selfGradeQuality: quality, startedAt: startedAtRef.current }))
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
    setShowSoundDetail(false)
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
  const statusMessage = isListening
    ? 'Grabando tu voz. Toca el botón para detener la grabación.'
    : isProcessing
      ? 'Analizando tu pronunciación.'
      : scored
        ? `Resultado listo: ${scored.score} por ciento de precisión.`
        : isError
          ? `No se pudo usar el micrófono. ${micErrorMessage(errorDetail)}`
          : 'Escucha el modelo y graba tu voz cuando estés listo.'

  return (
    <div className="flex w-full flex-col items-center gap-space-5 rounded-lg border border-border-subtle bg-surface-raised layout-card-pad sm:gap-layout-stack-loose">
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </p>
      <ExercisePhaseLabel label={levelLabel} />
      <div className="flex max-w-[42ch] flex-col items-center gap-1 text-center">
        <p className="m-0 w-full text-body text-fg">Di la oración en voz alta</p>
        <p className="m-0 text-center text-body-lg font-medium leading-relaxed text-balance text-fg">
          {displayEnglishText(sentence)}
        </p>
        {entry.sentence_ipa && (
          <p className="ipa m-0 max-w-[36ch] text-center text-body-lg leading-relaxed text-fg-muted">
            {entry.sentence_ipa}
          </p>
        )}
      </div>

      <ListenButton onPlay={() => speak(sentence, { rate: 0.95 })} label="Escuchar modelo" />

      {useFallback ? (
        <div className="flex w-full flex-col items-center gap-2">
          <p className="m-0 text-caption text-fg-subtle">
            Micrófono no disponible en este navegador — practica en voz alta y califícate:
          </p>
          <SelfGradeBar onGrade={handleSelfGrade} />
          {submitError && <p className="m-0 text-center text-caption text-error">{submitError}</p>}
        </div>
      ) : !scored ? (
        <div className="flex flex-col items-center gap-2">
          <PillButton
            type="button"
            variant="primary"
            onClick={() => void handleMicToggle()}
            disabled={isProcessing}
            aria-label={isListening ? 'Detener grabación' : 'Grabar mi voz'}
            className={cn( 'h-16 w-16 p-0', isListening && 'bg-error hover:bg-error', )}
          >
            {isProcessing ? (
              <Loader2 size={24} className="animate-spin" />
            ) : isListening ? (
              <MicOff size={24} />
            ) : (
              <Mic size={24} />
            )}
          </PillButton>
          <p className="m-0 text-caption text-fg-subtle">
            {isListening
              ? 'Escuchando… toca para parar'
              : isProcessing
                ? 'Analizando…'
                : 'Toca para hablar'}
          </p>
          {isError && (
            <p className="m-0 max-w-xs text-center text-caption text-error">
              {micErrorMessage(errorDetail)}{' '}
              <button
                type="button"
                onClick={handleRetry}
                className="cursor-pointer border-none bg-transparent font-[inherit] text-caption text-error underline focus-ring"
              >
                Reintentar
              </button>
            </p>
          )}
        </div>
      ) : (
        <div className="flex w-full flex-col items-center gap-4">
          <InlineFeedback isCorrect={scored.score >= 70} />
          {feedback && (
            <QuietSpeakFeedback accuracy={scored.score} message={feedback.message} />
          )}
          <div className="flex gap-2">
            <PillButton variant="outline" size="sm" onClick={handleRetry}>
              Intentar de nuevo
            </PillButton>
            <PillButton
              variant="primary"
              size="sm"
              onClick={handleContinue}
              disabled={isSubmitting}
              isLoading={isSubmitting}
              icon={isSubmitting ? <Loader2 size={16} /> : undefined}
            >
              Guardar y ver la siguiente
            </PillButton>
          </div>
          {scored.wordResults.some((word) => word.phonemes?.alignment?.length) && (
            <div className="flex w-full flex-col items-center gap-3">
              <button
                type="button"
                aria-expanded={showSoundDetail}
                onClick={() => setShowSoundDetail((visible) => !visible)}
                className="rounded-md px-2 py-1 text-caption font-semibold text-primary transition-colors hover:bg-primary-soft focus-ring"
              >
                {showSoundDetail ? 'Ocultar detalle de sonidos' : 'Ver detalle de sonidos'}
              </button>
              {showSoundDetail && <PhonemeFeedbackTable wordResults={scored.wordResults} />}
            </div>
          )}
          {submitError && <p className="m-0 text-center text-caption text-error">{submitError}</p>}
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
