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
import { ArrowRight, Mic, RotateCcw } from '@/components/icons'
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

  // El primer fonema fallado de toda la linea, en orden de lectura.
  //
  // Se busca en dos pasadas: primero el culpable que localizo el desglose
  // silabico, y si ninguna palabra tuvo mapeo fiable, directamente el primer
  // fonema fallado del alignment. Antes solo existia la primera pasada, asi
  // que una linea sin silabas fiables se quedaba coloreada pero sin explicar
  // por que estaba mal — que es justo lo que hay que decirle a quien practica.
  const remediation = (() => {
    for (const word of attempt?.wordResults ?? []) {
      const culprit = syllableMap.get(word.expected)?.find((s) => s.culprit)?.culprit
      if (culprit) {
        const built = buildRemediation(culprit)
        if (built) return built
      }
    }
    for (const word of attempt?.wordResults ?? []) {
      const failed = word.phonemes?.alignment?.find((p) => p.status !== 'correct')
      if (failed) {
        const built = buildRemediation(failed)
        if (built) return built
      }
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
      <div className="flex flex-col items-end gap-2">
        <p className="m-0 max-w-[85%] rounded-xl bg-primary-soft px-3 py-2 text-body text-fg">{line.text}</p>
        <p className="text-body-sm text-fg-muted">
          Tu navegador no permite evaluar la pronunciación. Practica en voz alta y continúa.
        </p>
        <Button variant="primary" onClick={() => onLineComplete(null)}>Continuar</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end gap-2 animate-message-in">
      <span className="text-xxs font-semibold uppercase tracking-wider text-fg-subtle">
        Tu turno
      </span>

      {!attempt && (
        <div className="flex flex-col items-end gap-2.5 w-full max-w-[88%]">
          <p className="m-0 w-full rounded-lg border border-primary-subtle bg-primary-soft/95 px-4 py-3 text-body-md font-medium text-fg shadow-xs">
            {line.text}
          </p>
          <Button
            variant="primary"
            size="sm"
            className="mt-0.5"
            icon={<Mic size={16} aria-hidden />}
            onClick={start}
            disabled={status === 'listening' || isScoring}
          >
            {status === 'listening' ? 'Escuchando…' : 'Hablar'}
          </Button>
        </div>
      )}

      {attempt && (
        <>
          <div className="flex w-full max-w-[88%] flex-col gap-2.5 rounded-lg border border-border-subtle bg-primary-soft/95 px-4 py-3 shadow-xs">
            <SpokenLineFeedback
              wordResults={attempt.wordResults}
              syllableMap={syllableMap}
            />
            <p className="m-0 text-caption font-medium text-fg-muted">
              {attempt.score}% · {feedbackHeadline(attempt.score)}
            </p>
            {remediation && <SyllableRemediation remediation={remediation} />}
          </div>

          <div className="w-full max-w-[88%]">
            <SelfPlaybackAudioBar targetWord={line.text} userAudioUrl={userAudioUrl} />
          </div>

          <div className="flex items-center gap-2.5 pt-1.5">
            <Button
              variant="secondary"
              size="sm"
              icon={<RotateCcw size={16} aria-hidden />}
              onClick={handleRetry}
            >
              Repetir
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<ArrowRight size={16} aria-hidden />}
              iconPosition="right"
              onClick={() => onLineComplete(attempt)}
            >
              Continuar
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
