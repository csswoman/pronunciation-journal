'use client'

import { useCallback, useEffect, useState } from 'react'
import { defaultEvaluationEngine } from '@/lib/exercises/evaluation'
import { getEvaluationWordResults } from '@/lib/exercises/evaluation/word-results'
import { playUiCue } from '@/lib/ui-sounds/cues'
import type { SpeechInputResult } from '@/lib/speech/types'
import type { WordResult } from '@/lib/types'

export interface SpeakScored {
  score: number
  wordResults: WordResult[]
  transcript: string
}

interface Options {
  /** Texto objetivo del intento. */
  sentence: string
  /** Transcripción lista, o null mientras no lo esté. */
  result: SpeechInputResult | null
  /** True cuando el reconocedor ya terminó. */
  isDone: boolean
  /** Se invoca cuando el evaluador se abstiene; el llamador decide qué mostrar. Debe ser estable. */
  onAbstain: (explanation: string) => void
  /** Se llama al terminar, para soltar el micrófono. Debe ser estable. */
  onSettled: () => void
}

interface SpeakEvaluation {
  scored: SpeakScored | null
  isScoring: boolean
  /** Borra el resultado para volver a intentar. */
  clear: () => void
}

/**
 * Puntúa un intento hablado con el motor de evaluación local (sin Gemini) y
 * suena la señal de UI correspondiente. Extraído de `SpeakReviewCard` para que
 * la tarjeta solo componga.
 */
export function useSpeakEvaluation({
  sentence,
  result,
  isDone,
  onAbstain,
  onSettled,
}: Options): SpeakEvaluation {
  const [scored, setScored] = useState<SpeakScored | null>(null)
  const [isScoring, setIsScoring] = useState(false)

  useEffect(() => {
    if (!isDone || !result || isScoring || scored) return
    setIsScoring(true)
    defaultEvaluationEngine
      .evaluate({
        exercise: { domain: 'pronunciation', mode: 'speak' },
        expected: sentence,
        actual: {
          kind: 'speech',
          transcript: result.transcript,
          confidence: result.confidence,
          source: result.source,
        },
      })
      .then((evalResult) => {
        // Abstención: sin evidencia suficiente no se muestra una nota inventada.
        if (evalResult.scorable === false) {
          onAbstain(evalResult.feedback.explanation)
          return
        }

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
        onSettled()
      })
  }, [isDone, result, isScoring, scored, sentence, onAbstain, onSettled])

  const clear = useCallback(() => setScored(null), [])

  return { scored, isScoring, clear }
}
