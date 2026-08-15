'use client'

// Planned structure:
// <SpeakScoredExercise>
//   <WordDisplay />            — palabra + IPA
//   <ListenModelButton />      — reproducir modelo (speak)
//   <RecognitionMicButton />   — useSpeechRecognition → transcript
//   <PronunciationFeedback />  — chips de fonema cuando hay resultado
//   <SelfPlaybackAudioBar />   — reproducir modelo vs voz del usuario
//   <FallbackShadowing />      — cuando SpeechRecognition no disponible
// </SpeakScoredExercise>

import { useCallback, useEffect, useRef, useState } from 'react'
import { Mic, MicOff } from "@/components/icons"
import { speak } from '@/lib/phoneme-practice/tts'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { BROWSER_BLOCKS_SCORING_ES } from '@/lib/speech/browser-support-message'
import { defaultEvaluationEngine } from '@/lib/exercises/evaluation'
import { getEvaluationWordResults } from '@/lib/exercises/evaluation/word-results'
import { getFeedbackMessage, calculateXP } from '@/lib/pronunciation/scoring'
import PronunciationFeedback from '@/components/lesson/PronunciationFeedback'
import { SelfPlaybackAudioBar } from '@/components/pronunciation/SelfPlaybackAudioBar'
import Button from '@/components/ui/Button'
import { ListenButton } from '@/components/ui/ListenButton'
import { cn } from '@/lib/cn'
import { useAuth } from '@/components/auth/AuthProvider'
import { feedbackFromScoringResult } from '@/lib/pronunciation/feedback/from-scoring'
import { persistPronunciationFeedbackEvidence } from '@/lib/pronunciation/feedback/persistence'
import { RemediationSequence } from '@/components/pronunciation-feedback/RemediationSequence'
import { PracticeActionBar, PracticeContinueButton } from '@/components/practice/session/PracticeActionBar'
import type { Exercise } from '@/lib/phoneme-practice/types'
import type { WordResult } from '@/lib/types'
import type { PracticeSubmitHandler } from '@/lib/practice/types'

interface Props {
  exercise: Exercise
  onSubmit: PracticeSubmitHandler
}

interface ScoredResult {
  correct: boolean
  score: number
  wordResults: WordResult[]
  transcript: string
}

type UnscoredReason = 'unsupported' | 'browser' | 'unavailable'

import { PhoneticWordHighlight } from '@/components/pronunciation/PhoneticWordHighlight'

function WordDisplay({ word, ipa, onListen }: { word?: string; ipa: string; onListen: () => void }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-3">
        <div className="text-display-word font-bold text-fg tracking-tight">
          {word ? <PhoneticWordHighlight word={word} phonemeOrIpa={ipa} /> : '—'}
        </div>
        <ListenButton iconOnly onPlay={onListen} aria-label="Escuchar" />
      </div>
      <div className="ipa text-fg-muted">
        {ipa}
      </div>
    </div>
  )
}

function ShadowingFallback({
  word,
  reason,
  onContinue,
}: {
  word?: string
  reason: UnscoredReason
  onContinue: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-caption text-fg-muted text-center max-w-xs m-0">
        {reason === 'unsupported'
          ? 'Tu navegador no admite puntuación por voz. Escucha el modelo y repite la palabra; este intento no recibirá puntuación.'
          : reason === 'browser'
            ? BROWSER_BLOCKS_SCORING_ES
            : 'La puntuación por voz no está disponible ahora. Escucha el modelo y repite la palabra; este intento no recibirá puntuación.'}
      </p>
      <ListenButton onPlay={() => word && speak(word)} label="Escuchar" />
      <PracticeActionBar>
        <PracticeContinueButton onClick={onContinue}>Continuar sin puntuación</PracticeContinueButton>
      </PracticeActionBar>
    </div>
  )
}

export function SpeakScoredExercise({ exercise, onSubmit }: Props) {
  const { user } = useAuth()
  const {
    status,
    result: speechResult,
    userAudioUrl,
    errorCode,
    isSupported,
    start,
    stop,
    reset,
  } = useSpeechRecognition()

  const [scored, setScored] = useState<ScoredResult | null>(null)
  const [isScoring, setIsScoring] = useState(false)
  const [evalFailed, setEvalFailed] = useState(false)
  const submitted = useRef(false)

  useEffect(() => {
    if (!isSupported || status !== 'done' || !speechResult || isScoring || scored || evalFailed) {
      return
    }

    const target = exercise.targetWord
    if (!target) return

    setIsScoring(true)

    defaultEvaluationEngine
      .evaluate({
        exercise: { domain: 'pronunciation', mode: 'speak' },
        expected: target,
        actual: { kind: 'speech', transcript: speechResult.transcript },
      })
      .then((evalResult) => {
        const wordResults = getEvaluationWordResults(evalResult)
        setScored({
          correct: evalResult.correct,
          score: evalResult.score ?? 0,
          wordResults,
          transcript: speechResult.transcript,
        })
        if (user?.id) {
          const feedback = feedbackFromScoringResult({
            accuracy: evalResult.score ?? 0,
            transcript: speechResult.transcript,
            wordResults,
            evaluatorVersion: 'lesson-stt-v1',
          })
          void persistPronunciationFeedbackEvidence(user.id, feedback).catch(() => undefined)
        }
      })
      .catch(() => {
        setEvalFailed(true)
      })
      .finally(() => setIsScoring(false))
  }, [isSupported, status, speechResult, isScoring, scored, evalFailed, exercise.targetWord, user?.id])

  const handleContinue = useCallback(() => {
    if (!scored || submitted.current) return
    submitted.current = true
    onSubmit(scored.correct, scored.transcript, { score: scored.score })
  }, [scored, onSubmit])

  const handleRetry = useCallback(() => {
    submitted.current = false
    setScored(null)
    reset()
  }, [reset])

  const handleShadowingDone = useCallback(() => {
    if (submitted.current) return
    submitted.current = true
    onSubmit(false, '')
  }, [onSubmit])

  const isListening = status === 'listening'
  const isDone = status === 'done'
  const isError = status === 'error'
  const isNetworkShadowing = isError && errorCode === 'network'
  const isShadowing = !isSupported || isNetworkShadowing || evalFailed
  const shadowingReason: UnscoredReason = !isSupported
    ? 'unsupported'
    : isNetworkShadowing
      ? 'browser'
      : 'unavailable'

  return (
    <div className="layout-stack-loose items-center w-full">
      <h2 className="m-0 text-center text-h4 text-fg">
        Di la palabra
      </h2>

      <WordDisplay
        word={exercise.targetWord}
        ipa={exercise.ipa}
        onListen={() => exercise.targetWord && speak(exercise.targetWord)}
      />

      {/* Mic button — hidden once scored or when shadowing */}
      {!scored && !isShadowing && (
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={isListening ? stop : start}
            disabled={isDone || isScoring}
            aria-label={isListening ? 'Detener grabación' : 'Grabar mi voz'}
            className={cn(
              'w-20 h-20 rounded-full border-none flex items-center justify-center cursor-pointer transition-all text-on-primary focus-ring disabled:opacity-40',
              isListening
                ? 'bg-error shadow-[0_0_0_14px_color-mix(in_oklch,var(--error)_18%,transparent)]'
                : 'bg-primary shadow-[0_4px_16px_color-mix(in_oklch,var(--primary)_35%,transparent)]',
            )}
          >
            {isListening ? <MicOff size={28} /> : <Mic size={28} />}
          </button>
          <p className="text-caption text-fg-subtle tracking-wider m-0">
            {isListening ? 'Escuchando… toca para parar' : isScoring ? 'Analizando…' : 'Toca para hablar'}
          </p>
        </div>
      )}

      {/* Shadowing fallback — unsupported browser, network block, or eval failure */}
      {isShadowing && !scored && (
        <ShadowingFallback word={exercise.targetWord} reason={shadowingReason} onContinue={handleShadowingDone} />
      )}

      {/* Error state (recoverable errors) */}
      {isError && !isShadowing && !scored && (
        <p className="text-caption text-fg-muted text-center m-0">
          {errorCode === 'not-allowed'
            ? 'Se denegó el acceso al micrófono. Permítelo en la configuración del navegador.'
            : errorCode === 'no-speech'
              ? 'No se detectó voz. Toca el micrófono y habla con claridad.'
              : 'No se pudo reconocer tu voz.'}{' '}
          <button type="button" onClick={handleRetry} className="underline cursor-pointer bg-transparent border-none font-[inherit] text-caption text-fg-muted focus-ring">
            Reintentar
          </button>
        </p>
      )}

      {/* Rich feedback + Self-monitoring audio loop */}
      {scored && (
        <>
          <PronunciationFeedback
            wordResults={scored.wordResults}
            accuracy={scored.score}
            feedback={getFeedbackMessage(scored.score, 70)}
            xpEarned={calculateXP(scored.score)}
            transcript={scored.transcript}
          />

          <SelfPlaybackAudioBar
            targetWord={exercise.targetWord}
            userAudioUrl={userAudioUrl}
          />

          <RemediationSequence
            onListen={() => exercise.targetWord && speak(exercise.targetWord)}
            onSlow={() => {
              if (!exercise.targetWord) return
              const utterance = new SpeechSynthesisUtterance(exercise.targetWord)
              utterance.rate = 0.6
              window.speechSynthesis.speak(utterance)
            }}
            onRetry={handleRetry}
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
