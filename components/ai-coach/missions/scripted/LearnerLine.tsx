'use client'

// Planned structure:
// <LearnerLine>
//   <TargetText />
//   <SpeakMicButton />
//   <SyllableBreakdown />        (feedback por sílaba)
//   <SyllableRemediation />      (fonema culpable)
//   <SelfPlaybackAudioBar />     (comparación IA vs tú)
//   <RetryAndContinue />

import { useCallback, useEffect, useState } from 'react'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { defaultEvaluationEngine } from '@/lib/exercises/evaluation'
import { getEvaluationWordResults } from '@/lib/exercises/evaluation/word-results'
import { useSyllableFeedback } from '@/hooks/useSyllableFeedback'
import { SyllableBreakdown } from '@/components/pronunciation-feedback/SyllableBreakdown'
import { SyllableRemediation } from '@/components/pronunciation-feedback/SyllableRemediation'
import { buildRemediation } from '@/lib/pronunciation/syllable-remediation'
import { SelfPlaybackAudioBar } from '@/components/pronunciation/SelfPlaybackAudioBar'
import Button from '@/components/ui/Button'
import type { ScriptLine } from '@/lib/ai-practice/missions/types'
import type { WordResult } from '@/lib/types'

/** Exportado: `ScriptedMissionRunner` (Tarea 15) consume este mismo tipo. */
export interface LineAttemptResult {
  score: number
  transcript: string
  wordResults: WordResult[]
}

interface Props {
  line: ScriptLine
  onLineComplete: (result: LineAttemptResult | null) => void
}

export function LearnerLine({ line, onLineComplete }: Props) {
  const { status, result: speechResult, userAudioUrl, isSupported, start, reset } =
    useSpeechRecognition()
  const [attempt, setAttempt] = useState<LineAttemptResult | null>(null)
  const [isScoring, setIsScoring] = useState(false)

  const syllableMap = useSyllableFeedback(attempt?.wordResults ?? [])

  useEffect(() => {
    if (status !== 'done' || !speechResult || isScoring || attempt) return
    setIsScoring(true)

    void defaultEvaluationEngine
      .evaluate({
        exercise: { domain: 'pronunciation', mode: 'speak' },
        expected: line.text,
        actual: { kind: 'speech', transcript: speechResult.transcript },
      })
      .then((evaluation) => {
        setAttempt({
          score: evaluation.score ?? 0,
          transcript: speechResult.transcript,
          wordResults: getEvaluationWordResults(evaluation),
        })
      })
      .finally(() => setIsScoring(false))
  }, [status, speechResult, isScoring, attempt, line.text])

  const handleRetry = useCallback(() => {
    setAttempt(null)
    reset()
  }, [reset])

  // Sin reconocimiento no hay puntuación: se avanza sin inventar un 0.
  if (!isSupported) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-border-default p-4">
        <p className="text-body text-fg">{line.text}</p>
        <p className="text-body-sm text-fg-muted">
          Tu navegador no permite evaluar la pronunciación. Practica en voz alta y continúa.
        </p>
        <Button variant="primary" onClick={() => onLineComplete(null)}>Continuar</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-strong p-4">
      <span className="font-caption text-xs font-semibold uppercase tracking-wider text-fg-muted">
        Tu turno
      </span>
      <p className="text-body text-fg">{line.text}</p>

      {!attempt && (
        <Button variant="primary" onClick={start} disabled={status === 'listening' || isScoring}>
          {status === 'listening' ? 'Escuchando…' : 'Hablar'}
        </Button>
      )}

      {attempt && (
        <>
          <div className="flex flex-col gap-2">
            {attempt.wordResults.map((word, index) => {
              const syllables = syllableMap.get(word.expected)
              if (!syllables) {
                return <span key={index} className="text-body text-fg-muted">{word.expected}</span>
              }
              // Una sola tarjeta articulatoria por palabra: la de la primera
              // sílaba fallada. Volcar una por cada fallo sería ruido.
              const culprit = syllables.find((s) => s.culprit !== null)?.culprit ?? null
              const remediation = culprit ? buildRemediation(culprit) : null
              return (
                <div key={index} className="flex flex-col gap-2">
                  <SyllableBreakdown syllables={syllables} />
                  {remediation && <SyllableRemediation remediation={remediation} />}
                </div>
              )
            })}
          </div>

          <SelfPlaybackAudioBar targetWord={line.text} userAudioUrl={userAudioUrl} />

          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleRetry}>Repetir</Button>
            <Button variant="primary" onClick={() => onLineComplete(attempt)}>Continuar</Button>
          </div>
        </>
      )}
    </div>
  )
}
