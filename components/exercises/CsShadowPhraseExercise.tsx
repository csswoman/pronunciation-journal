'use client'

// Planned structure:
// <CsShadowPhraseExercise>
//   <ShadowPhraseCard />    — phrase + IPA + normal/slow listen
//   <MicButton />           — useSpeechRecognition → transcript
//   <ShadowingFallback />   — unsupported/failed recognition → honest unscored continue
//   <PronunciationFeedback /> — score + word/phoneme breakdown
// </CsShadowPhraseExercise>

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Mic, MicOff } from '@/components/icons'
import Button from '@/components/ui/Button'
import { ShadowPhraseCard } from '@/components/exercises/ShadowPhraseCard'
import PronunciationFeedback from '@/components/lesson/PronunciationFeedback'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { SCORING_UNAVAILABLE_SHADOW_ES } from '@/lib/speech/browser-support-message'
import { scorePronunciation, getFeedbackMessage, calculateXP } from '@/lib/pronunciation/scoring'
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
  onSkip?: () => void
}

export function CsShadowPhraseExercise({ exercise, onResult, onSkip }: Props) {
  const { user } = useAuth()
  const { status, result: speechResult, userAudioUrl, errorCode, isSupported, start, stop, reset } =
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
  const isTranscribing = status === 'processing'
  const isDone = status === 'done'
  const isError = status === 'error'
  const isNetworkShadowing = isError && errorCode === 'network'
  const isShadowing = !isSupported || isNetworkShadowing || evalFailed
  // Transcribir y puntuar son dos fases distintas para nosotros, pero para el
  // estudiante son una sola espera: "la IA está trabajando con mi audio".
  const isBusy = isTranscribing || isScoring

  return (
    <div className="flex w-full flex-col items-stretch gap-4">
      <ShadowPhraseCard phrase={exercise.phrase} phraseIpa={exercise.phraseIpa} />

      {!scoring && !isShadowing && (
        <>
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-border bg-surface px-4 py-8 text-center sm:py-10">
            {/* Anillo neutro alrededor del botón azul, igual que SpokenProductionControls. */}
            <span className="flex size-[9rem] items-center justify-center rounded-full bg-surface-sunken">
              <button
                type="button"
                onClick={isListening ? stop : start}
                disabled={isDone || isBusy}
                aria-label={
                  isListening ? 'Detener grabación' : isBusy ? 'Procesando tu respuesta' : 'Grabar mi voz'
                }
                className={cn(
                  'flex size-[7.25rem] cursor-pointer items-center justify-center rounded-full border-none bg-primary text-on-primary transition-all duration-200 focus-ring disabled:cursor-not-allowed',
                  isListening && 'animate-pulse',
                  isBusy && 'opacity-70 disabled:opacity-70',
                  !isListening && !isBusy && 'hover:opacity-90 active:scale-95 disabled:opacity-40',
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
            <div className="flex flex-col items-center gap-0.5">
              <p className="m-0 text-body-md font-semibold text-fg" role="status" aria-live="polite">
                {isListening
                  ? 'Escuchando… habla en voz alta'
                  : isTranscribing
                    ? 'Escuchando lo que dijiste…'
                    : isScoring
                      ? 'Analizando tu respuesta…'
                      : 'Toca para hablar'}
              </p>
              <p className="m-0 text-caption text-fg-muted">
                {isListening
                  ? 'Toca el botón cuando termines'
                  : isTranscribing
                    ? 'Convirtiendo tu audio en texto. No cierres esta pantalla.'
                    : isScoring
                      ? 'Comprobando tu pronunciación'
                      : 'Escucha el modelo y repítelo en inglés'}
              </p>
            </div>
          </div>
          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              disabled={isBusy || isListening}
              className="min-h-11 cursor-pointer self-center rounded-md border-none bg-transparent px-1 text-body-md font-medium text-fg-muted underline underline-offset-4 transition-colors hover:text-fg focus-ring disabled:cursor-not-allowed disabled:opacity-40"
            >
              Omitir este ejercicio
            </button>
          )}
        </>
      )}

      {isShadowing && !scoring && (
        <div className="flex flex-col items-center gap-4">
          <p className="m-0 max-w-xs text-center text-caption text-fg-muted">
            {!isSupported
              ? SCORING_UNAVAILABLE_SHADOW_ES
              : isNetworkShadowing
                ? 'No se pudo completar la transcripción; necesita conexión a internet. Escucha e imita la frase en voz alta; este intento no recibirá puntuación.'
                : 'La puntuación por voz no está disponible ahora. Escucha e imita la frase en voz alta; este intento no recibirá puntuación.'}
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
            userAudioUrl={userAudioUrl}
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
