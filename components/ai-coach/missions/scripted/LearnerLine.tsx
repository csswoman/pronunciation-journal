'use client'

// Planned structure:
// <LearnerLine>
//   <TargetText />
//   <SpeakMicButton />
//   <SpokenLineFeedback />       (la frase en color, palabra a palabra)
//   <SyllableRemediation />      (fonema culpable)
//   <SelfPlaybackAudioBar />     (comparación IA vs tú)
//   <RetryAndContinue />

import { useCallback, useEffect, useState } from 'react'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { defaultEvaluationEngine } from '@/lib/exercises/evaluation'
import { getEvaluationWordResults } from '@/lib/exercises/evaluation/word-results'
import { useSyllableFeedback } from '@/hooks/useSyllableFeedback'
import { SpokenLineFeedback } from '@/components/pronunciation-feedback/SpokenLineFeedback'
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

function feedbackHeadline(score: number): string {
  if (score >= 90) return 'Muy bien'
  if (score >= 70) return 'Casi: fíjate en lo marcado'
  return 'Repite fijándote en lo marcado'
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

  // El primer fonema culpable de toda la linea, en orden de lectura.
  const remediation = (() => {
    for (const word of attempt?.wordResults ?? []) {
      const culprit = syllableMap.get(word.expected)?.find((s) => s.culprit)?.culprit
      if (culprit) return buildRemediation(culprit)
    }
    return null
  })()

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
    <div className="flex flex-col gap-2">
      <span className="font-caption text-xs font-semibold uppercase tracking-wider text-fg-muted">
        Tu turno
      </span>
      {/* Antes del intento se lee lo que hay que decir; despues, esa misma
          frase reaparece coloreada y repetirla aqui seria duplicarla. */}
      {!attempt && <p className="m-0 text-body text-fg">{line.text}</p>}

      {!attempt && (
        <Button variant="primary" onClick={start} disabled={status === 'listening' || isScoring}>
          {status === 'listening' ? 'Escuchando…' : 'Hablar'}
        </Button>
      )}

      {attempt && (
        <>
          <div className="flex flex-col gap-2">
            <SpokenLineFeedback
              wordResults={attempt.wordResults}
              syllableMap={syllableMap}
            />
            <p className="m-0 text-body-sm text-fg-muted">
              {attempt.score}% · {feedbackHeadline(attempt.score)}
            </p>
            {/* Una sola tarjeta articulatoria por linea: la del primer fonema
                culpable. Volcar una por cada fallo seria ruido. */}
            {remediation && <SyllableRemediation remediation={remediation} />}
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
