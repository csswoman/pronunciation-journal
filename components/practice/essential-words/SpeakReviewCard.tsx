'use client'

// Planned structure:
// <SpeakReviewCard>
//   <SentencePrompt />
//   <MicButton | SelfGradeBar />
//   <InlineFeedback + QuietSpeakFeedback + PhonemeFeedbackTable />
//   <SpeakSkipActions />
// </SpeakReviewCard>

import { useCallback, useEffect, useRef, useState } from 'react'
import { speak } from '@/lib/phoneme-practice/tts'
import { ListenButton } from '@/components/ui/ListenButton'
import { useSpeechInput } from '@/hooks/useSpeechInput'
import { useSharedMicStream } from '@/hooks/useSharedMicStream'
import { defaultEvaluationEngine } from '@/lib/exercises/evaluation'
import { getEvaluationWordResults } from '@/lib/exercises/evaluation/word-results'
import { getFeedbackMessage } from '@/lib/pronunciation/scoring'
import { PracticeExerciseCard } from '@/components/practice/session/PracticeActionBar'
import { SpeakSkipActions } from './SpeakSkipActions'
import { SpeakMicPanel } from './SpeakMicPanel'
import { SpeakScoredPanel } from './SpeakScoredPanel'
import { micErrorMessage } from './mic-error-message'
import { playUiCue } from '@/lib/ui-sounds/cues'
import { selectSentence } from '@/lib/essential-words/sentence-variants'
import { displayEnglishText } from '@/lib/essential-words/word-display'
import { buildSpeakOutcome } from './useSpeakOutcome'
import { ExercisePhaseLabel } from './ExercisePhaseLabel'
import { useEnterToContinue } from '@/hooks/useEnterToContinue'
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

  const { sentence, sentence_ipa } = selectSentence(entry, repetitions)

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

  useEnterToContinue(Boolean(scored && !isSubmitting), handleContinue)

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
    <PracticeExerciseCard spacing="roomy" className="sm:gap-layout-stack-loose">
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </p>
      <ExercisePhaseLabel label={levelLabel} />
      <div className="flex max-w-[42ch] flex-col items-center gap-1 text-center">
        <p className="m-0 w-full text-body text-fg">Di la oración en voz alta</p>
        <p className="m-0 text-center text-body-lg font-medium leading-relaxed text-balance text-fg">
          {displayEnglishText(sentence)}
        </p>
        {sentence_ipa && (
          <p className="ipa m-0 max-w-[36ch] text-center text-body-lg leading-relaxed text-fg-muted">
            {sentence_ipa}
          </p>
        )}
      </div>

      <ListenButton onPlay={() => speak(sentence, { rate: 0.95 })} label="Escuchar modelo" />

      {!scored ? (
        <SpeakMicPanel
          useFallback={useFallback}
          isListening={isListening}
          isProcessing={isProcessing}
          isError={isError}
          errorDetail={errorDetail ?? null}
          submitError={submitError}
          onMicToggle={() => void handleMicToggle()}
          onSelfGrade={handleSelfGrade}
          onRetry={handleRetry}
        />
      ) : (
        <SpeakScoredPanel
          score={scored.score}
          feedbackMessage={feedback?.message ?? null}
          wordResults={scored.wordResults}
          showSoundDetail={showSoundDetail}
          isSubmitting={isSubmitting}
          submitError={submitError}
          onToggleSoundDetail={() => setShowSoundDetail((visible) => !visible)}
          onRetry={handleRetry}
          onContinue={handleContinue}
        />
      )}

      <SpeakSkipActions
        onArchive={onArchive}
        fromSnooze={fromSnooze}
        onKeepSnooze={onKeepSnooze}
        onMaster={onMaster}
      />
    </PracticeExerciseCard>
  )
}
