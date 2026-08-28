'use client'

// Planned structure:
// <CsShadowPhraseExercise>
'use client'

// Planned structure:
// <CsShadowPhraseExercise>
//   <PhraseHeader />        — phrase + Listen button
//   <MicButton />           — useSpeechRecognition → transcript
//   <ShadowingFallback />   — unsupported/failed recognition → honest unscored continue
//   <PronunciationFeedback /> — score + word/phoneme breakdown
// </CsShadowPhraseExercise>

import { useCallback, useEffect, useRef, useState } from 'react'
import { Mic, MicOff } from '@/components/icons'
import Button from '@/components/ui/Button'
import { ListenButton } from '@/components/ui/ListenButton'
import PronunciationFeedback from '@/components/lesson/PronunciationFeedback'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { BROWSER_BLOCKS_SCORING_SHADOW_ES } from '@/lib/speech/browser-support-message'
import { scorePronunciation, getFeedbackMessage, calculateXP } from '@/lib/pronunciation/scoring'
import { speak } from '@/lib/phoneme-practice/tts'
import { cn } from '@/lib/cn'
import { useAuth } from '@/components/auth/AuthProvider'
import { feedbackFromScoringResult } from '@/lib/pronunciation/feedback/from-scoring'
import { persistPronunciationFeedbackEvidence } from '@/lib/pronunciation/feedback/persistence'
import { PracticeActionBar, PracticeContinueButton } from '@/components/practice/session/PracticeActionBar'
import type { ScoringResult } from '@/lib/types'
import type { CsShadowPhraseExercise as CsShadowPhraseExerciseType } from '@/lib/exercises/types'
import type { GenericRenderExtras } from '@/lib/practice/exercise-renderer/generic-registry'

interface Props {
  exercise: CsShadowPhraseExerciseType
  onResult: (
    isCorrect: boolean,
    userAnswer: string,
    timeMs: number,
    extras?: GenericRenderExtras,
  ) => void
}

export function CsShadowPhraseExercise({ exercise, onResult }: Props) {
  const { user } = useAuth()
  const { status, result: speechResult, errorCode, isSupported, start, stop, reset } =
    useSpeechRecognition()
  const [scoring, setScoring] = useState<ScoringResult | null>(null)
  const [isScoring, setIsScoring] = useState(false)
  const [evalFailed, setEvalFailed] = useState(false)
  const startMs = useRef(Date.now())
  const submitted = useRef(false)

  useEffect(() => {
    if (status !== 'done' || !speechResult || isScoring || scoring || evalFailed) return

    setIsScoring(true)
    scorePronunciation(speechResult.transcript, exercise.phrase)
      .then((result) => {
        setScoring(result)
        if (user?.id) {
          const feedback = feedbackFromScoringResult({
            accuracy: result.accuracy, transcript: result.transcript, wordResults: result.wordResults,
            evaluatorVersion: 'shadow-stt-v1',
            authoredTargetId: exercise.pronunciationTargetId,
          })
          void persistPronunciationFeedbackEvidence(user.id, feedback).catch(() => undefined)
        }
      })
      .catch(() => {
        // Evaluation errored — honest 'failed' outcome, not a silent 0%.
        // Fall through to the unscored shadowing UI, same pattern as
        // SpeakScoredExercise (plan 063 step 2).
        setEvalFailed(true)
      })
      .finally(() => setIsScoring(false))
  }, [status, speechResult, isScoring, scoring, evalFailed, exercise.phrase, exercise.pronunciationTargetId, user?.id])

  const handleContinue = useCallback(() => {
    if (!scoring || submitted.current) return
    submitted.current = true
    onResult(scoring.isCorrect, scoring.transcript, Date.now() - startMs.current, {
      score: scoring.accuracy,
      resultStatus: 'answered',
    })
  }, [scoring, onResult])

  const handleRetry = useCallback(() => {
    submitted.current = false
    setScoring(null)
    setEvalFailed(false)
    reset()
    startMs.current = Date.now()
  }, [reset])

  // Never a correct answer, never a score — cannot affect accuracy/SRS/mastery.
  const handleShadowingDone = useCallback(() => {
    if (submitted.current) return
    submitted.current = true
    onResult(false, '', Date.now() - startMs.current, {
      resultStatus: evalFailed ? 'evaluator_failed' : 'unscored',
    })
  }, [onResult, evalFailed])

  const isListening = status === 'listening'
  const isDone = status === 'done'
  const isError = status === 'error'
  const isNetworkShadowing = isError && errorCode === 'network'
  const isShadowing = !isSupported || isNetworkShadowing || evalFailed

  return (
    <div className="layout-stack-loose w-full items-center">
      <div className="flex flex-col items-center gap-2">
        <p className="m-0 max-w-xs text-center text-body-lg font-medium text-fg">
          {exercise.phrase}
        </p>
        {exercise.phraseIpa ? (
          <p className="font-ipa m-0 max-w-md text-center text-body-md leading-relaxed text-fg-muted">
            {exercise.phraseIpa}
          </p>
        ) : null}
        <ListenButton onPlay={() => speak(exercise.phrase)} label="Escuchar" />
      </div>

      {!scoring && !isShadowing && (
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={isListening ? stop : start}
            disabled={isDone || isScoring}
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
          <p className="m-0 text-caption tracking-wider text-fg-subtle">
            {isListening ? 'Escuchando… toca para parar' : isScoring ? 'Analizando…' : 'Toca para hablar'}
          </p>
        </div>
      )}

      {isShadowing && !scoring && (
        <div className="flex flex-col items-center gap-4">
          <p className="m-0 max-w-xs text-center text-caption text-fg-muted">
            {!isSupported
              ? 'Tu navegador no admite puntuación por voz. Escucha el modelo y repítelo en voz alta; este intento no recibirá puntuación.'
              : isNetworkShadowing
                ? BROWSER_BLOCKS_SCORING_SHADOW_ES
                : 'La puntuación por voz no está disponible ahora. Escucha el modelo y repítelo en voz alta; este intento no recibirá puntuación.'}
          </p>
          <PracticeActionBar>
            <PracticeContinueButton onClick={handleShadowingDone}>Continuar sin puntuación</PracticeContinueButton>
          </PracticeActionBar>
        </div>
      )}

      {isError && !isShadowing && !scoring && (
        <p className="m-0 text-center text-caption text-fg-muted">
          {errorCode === 'not-allowed'
            ? 'Se denegó el acceso al micrófono. Permítelo en la configuración del navegador.'
            : errorCode === 'no-speech'
              ? 'No se detectó voz. Toca el micrófono y habla con claridad.'
              : 'No se pudo reconocer tu voz.'}{' '}
          <button
            type="button"
            onClick={handleRetry}
            className="cursor-pointer border-none bg-transparent font-[inherit] text-caption text-fg-muted underline focus-ring"
          >
            Reintentar
          </button>
        </p>
      )}

      {scoring && (
        <>
          <PronunciationFeedback
            wordResults={scoring.wordResults}
            accuracy={scoring.accuracy}
            feedback={getFeedbackMessage(scoring.accuracy)}
            xpEarned={calculateXP(scoring.accuracy)}
            transcript={scoring.transcript}
          />
          <PracticeActionBar>
            <Button variant="secondary" size="lg" fullWidth onClick={handleRetry}>Intentar de nuevo</Button>
            <PracticeContinueButton onClick={handleContinue} />
          </PracticeActionBar>
        </>
      )}
    </div>
  )
}
