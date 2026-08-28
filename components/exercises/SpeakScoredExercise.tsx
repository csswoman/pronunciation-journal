'use client'

// Planned structure:
// <SpeakScoredExercise>
//   <WordDisplay />
//   <SpeakMicButton />
//   <PronunciationFeedback />
//   <SelfPlaybackAudioBar />
//   <ShadowingFallback />
// </SpeakScoredExercise>

import { useCallback, useEffect, useRef, useState } from 'react'
import { speak } from '@/lib/phoneme-practice/tts'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { defaultEvaluationEngine } from '@/lib/exercises/evaluation'
import { getEvaluationWordResults } from '@/lib/exercises/evaluation/word-results'
import { getFeedbackMessage, calculateXP } from '@/lib/pronunciation/scoring'
import PronunciationFeedback from '@/components/lesson/PronunciationFeedback'
import { SelfPlaybackAudioBar } from '@/components/pronunciation/SelfPlaybackAudioBar'
import Button from '@/components/ui/Button'
import { useAuth } from '@/components/auth/AuthProvider'
import { feedbackFromScoringResult } from '@/lib/pronunciation/feedback/from-scoring'
import { persistPronunciationFeedbackEvidence } from '@/lib/pronunciation/feedback/persistence'
import { PracticeActionBar, PracticeContinueButton } from '@/components/practice/session/PracticeActionBar'
import type { Exercise } from '@/lib/phoneme-practice/types'
import type { WordResult } from '@/lib/types'
import type { PracticeSubmitHandler } from '@/lib/practice/types'
import {
  ShadowingFallback,
  SpeakMicButton,
  WordDisplay,
  type UnscoredReason,
} from './SpeakScoredParts'

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
      <h2 className="m-0 text-center text-h4 text-fg">Di la palabra</h2>

      <WordDisplay
        word={exercise.targetWord}
        ipa={exercise.ipa}
        onListen={() => exercise.targetWord && speak(exercise.targetWord)}
      />

      {!scored && !isShadowing && (
        <SpeakMicButton
          isListening={isListening}
          isDone={isDone}
          isScoring={isScoring}
          onToggle={isListening ? stop : start}
        />
      )}

      {isShadowing && !scored && (
        <ShadowingFallback word={exercise.targetWord} reason={shadowingReason} onContinue={handleShadowingDone} />
      )}

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

          <PracticeActionBar>
            <Button variant="secondary" size="lg" fullWidth onClick={handleRetry}>Intentar de nuevo</Button>
            <PracticeContinueButton onClick={handleContinue} />
          </PracticeActionBar>
        </>
      )}
    </div>
  )
}
