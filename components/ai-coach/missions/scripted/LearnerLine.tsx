'use client'

// Planned structure:
// <LearnerLine>
//   <ShadowingPanel />           (escuchar el modelo antes/después de hablar)
//   <LearnerSpeechControls />    (captura con osciloscopio real)
//   <LineResult />               (veredicto + línea coloreada + fix + escucha)
//   <SelfPlaybackAudioBar />     (comparación en modo práctica sin STT)
//   <RetryAndContinue />         (repetir / continuar)
// </LearnerLine>

import { useCallback, useEffect, useState } from 'react'
import { useSharedMicStream } from '@/hooks/useSharedMicStream'
import { useLearnerSpeechCapture } from '@/hooks/useLearnerSpeechCapture'
import { useVoiceLevel } from '@/hooks/useVoiceLevel'
import { defaultEvaluationEngine } from '@/lib/exercises/evaluation'
import { getEvaluationWordResults } from '@/lib/exercises/evaluation/word-results'
import { useSyllableFeedback } from '@/hooks/useSyllableFeedback'
import { buildRemediation } from '@/lib/pronunciation/syllable-remediation'
import { pickPrimaryFix } from '@/lib/pronunciation/pick-primary-fix'
import { describePhonemeInWord } from '@/lib/pronunciation/phoneme-in-word'
import { LineResult, type LineResultFix } from './LineResult'
import { SelfPlaybackAudioBar } from '@/components/pronunciation/SelfPlaybackAudioBar'
import Button from '@/components/ui/Button'
import { ArrowRight } from '@/components/icons'
import { ShadowingPanel } from './ShadowingPanel'
import { LearnerSpeechControls } from './LearnerSpeechControls'
import { RetryAndContinue } from './RetryAndContinue'
import type { ScriptLine } from '@/lib/ai-practice/missions/types'
import type { WordResult } from '@/lib/types'

export interface LineAttemptResult {
  score: number
  transcript: string
  wordResults: WordResult[]
}

interface Props {
  line: ScriptLine
  missionId?: string
  onLineComplete: (result: LineAttemptResult | null) => void
}

export function LearnerLine({ line, missionId, onLineComplete }: Props) {
  const { getStream, release } = useSharedMicStream()
  const capture = useLearnerSpeechCapture({ targetText: line.text, getStream })
  const voice = useVoiceLevel(capture.micStream)

  const [attempt, setAttempt] = useState<LineAttemptResult | null>(null)
  const [isScoring, setIsScoring] = useState(false)

  const syllableMap = useSyllableFeedback(attempt?.wordResults ?? [])

  useEffect(() => {
    return release
  }, [release])

  useEffect(() => {
    if (capture.status !== 'done' || isScoring || attempt) return
    // Sin grabación real no hay nada que puntuar: evaluar aquí produciría un
    // score inventado sobre un transcript que el micro nunca respaldó.
    if (!capture.hasRecording) return
    const transcript = capture.transcript?.trim()
    if (!transcript) return
    setIsScoring(true)

    void defaultEvaluationEngine
      .evaluate({
        exercise: { domain: 'pronunciation', mode: 'speak' },
        expected: line.text,
        actual: {
          kind: 'speech',
          transcript,
          confidence: capture.confidence,
          source: capture.source,
        },
      })
      .then((evaluation) => {
        // Abstención: no registrar un intento que la evaluación no respalda.
        if (evaluation.scorable === false) return

        setAttempt({
          score: evaluation.score ?? 0,
          transcript,
          wordResults: getEvaluationWordResults(evaluation),
        })
      })
      .finally(() => setIsScoring(false))
  }, [
    capture.status,
    capture.transcript,
    capture.hasRecording,
    isScoring,
    attempt,
    line.text,
  ])

  const primaryFix = attempt
    ? pickPrimaryFix(attempt.wordResults, syllableMap)
    : null

  const remediation = primaryFix ? buildRemediation(primaryFix.culprit) : null

  const fix: LineResultFix | null = (() => {
    if (!primaryFix) return null
    const explanation = describePhonemeInWord(primaryFix.syllableText, primaryFix.culprit)
    if (!explanation) return null
    const phonemeIpa = remediation?.ipa ?? `/${primaryFix.culprit.ipa ?? ''}/`
    const status = primaryFix.culprit.status === 'missing' ? 'missing' : 'incorrect'
    return { explanation, phonemeIpa, status }
  })()

  const handleRetry = useCallback(() => {
    setAttempt(null)
    capture.reset()
  }, [capture])

  // Hubo audio pero no habrá puntuación (offline, STT caído o transcript vacío):
  // igual se ofrece la comparación en lugar de dejar el turno sin salida.
  const showPracticePlayback =
    !attempt && capture.hasRecording && !capture.isCapturing && !isScoring

  return (
    <div className="flex flex-col items-end gap-2.5 w-full animate-message-in">
      <span className="text-xxs font-semibold uppercase tracking-wider text-fg-subtle">
        Tu turno
      </span>

      <div className="flex flex-col items-end gap-2.5 w-full max-w-[88%]">
        <ShadowingPanel line={line} missionId={missionId} />

        {!attempt && !showPracticePlayback && (
          <>
            <LearnerSpeechControls
              status={capture.status}
              isCapturing={capture.isCapturing}
              isScoring={isScoring || capture.status === 'processing'}
              errorCode={capture.errorCode}
              getSamples={voice.getSamples}
              peak={voice.peak}
              canScore={capture.canScore}
              onStart={capture.start}
              onStop={capture.stop}
              onRetry={handleRetry}
            />
            {!capture.canScore && capture.status === 'idle' && (
              <Button
                variant="secondary"
                size="sm"
                icon={<ArrowRight size={15} aria-hidden />}
                iconPosition="right"
                onClick={() => onLineComplete(null)}
              >
                Continuar
              </Button>
            )}
          </>
        )}

        {showPracticePlayback && (
          <>
            <div className="w-full">
              <SelfPlaybackAudioBar targetWord={line.text} userAudioUrl={capture.userAudioUrl} />
            </div>
            <RetryAndContinue
              onRetry={handleRetry}
              onContinue={() => onLineComplete(null)}
            />
          </>
        )}

        {attempt && (
          <LineResult
            score={attempt.score}
            wordResults={attempt.wordResults}
            syllableMap={syllableMap}
            fix={fix}
            remediation={remediation}
            targetText={line.text}
            userAudioUrl={capture.userAudioUrl}
            onRetry={handleRetry}
            onContinue={() => onLineComplete(attempt)}
          />
        )}
      </div>
    </div>
  )
}
