'use client'

// Structure:
// <ReaderSentenceRecorder>
//   <RecorderControls />
//   <PronunciationFeedback />
// </ReaderSentenceRecorder>

import { useState, useEffect, useRef } from 'react'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { scorePronunciation, getFeedbackMessage, calculateXP } from '@/lib/pronunciation/scoring'
import type { ScoringResult } from '@/lib/types'
import PronunciationFeedback from '@/components/lesson/PronunciationFeedback'
import Button from '@/components/ui/Button'
import { Mic } from '@/components/icons'
import { cn } from '@/lib/cn'

interface Props {
  sentenceText: string
  online: boolean
  onRecorded?: (score: number, transcript: string, timeMs: number) => void
}

export function ReaderSentenceRecorder({ sentenceText, onRecorded }: Omit<Props, 'online'> & { online?: boolean }) {
  const { status, result: speechResult, userAudioUrl, isSupported, start, stop, reset } =
    useSpeechRecognition()
  const [scoring, setScoring] = useState<ScoringResult | null>(null)
  const [isScoring, setIsScoring] = useState(false)
  const lastSentenceRef = useRef(sentenceText)
  const startMsRef = useRef<number>(Date.now())

  // Reset when active sentence changes
  useEffect(() => {
    if (lastSentenceRef.current !== sentenceText) {
      lastSentenceRef.current = sentenceText
      setScoring(null)
      setIsScoring(false)
      reset()
    }
  }, [sentenceText, reset])

  useEffect(() => {
    if (status !== 'done' || !speechResult || isScoring || scoring) return

    setIsScoring(true)
    const timeMs = Math.max(500, Date.now() - startMsRef.current)
    scorePronunciation(speechResult.transcript, sentenceText)
      .then((res) => {
        setScoring(res)
        onRecorded?.(res.accuracy, res.transcript, timeMs)
      })
      .catch((err) => {
        console.error('[ReaderSentenceRecorder] scoring failed', err)
      })
      .finally(() => {
        setIsScoring(false)
      })
  }, [status, speechResult, isScoring, scoring, sentenceText, onRecorded])

  const handleToggleRecord = () => {
    if (status === 'listening') {
      stop()
    } else {
      setScoring(null)
      startMsRef.current = Date.now()
      start()
    }
  }

  const handleRetry = () => {
    setScoring(null)
    reset()
    startMsRef.current = Date.now()
    start()
  }

  if (!isSupported) {
    return (
      <div className="rounded-xl border border-border-default bg-surface-raised p-3 text-caption text-fg-muted">
        Tu navegador no soporta reconocimiento de voz para shadowing oral.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-default bg-surface-raised p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-body-sm font-semibold text-fg">🎙️ Práctica oral de la frase</span>
          <span className="text-caption text-fg-muted">Shadowing</span>
        </div>

        {!scoring && (
          <button
            type="button"
            onClick={handleToggleRecord}
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-4 py-2 font-label text-caption font-semibold transition-all cursor-pointer focus-ring',
              status === 'listening'
                ? 'bg-error text-on-error animate-pulse shadow-sm'
                : 'bg-primary text-on-primary hover:bg-primary/90 shadow-sm',
            )}
            aria-label={status === 'listening' ? 'Detener grabación' : 'Grabar repetición'}
          >
            <Mic className="w-4 h-4" />
            <span>{status === 'listening' ? 'Detener (escuchando…)' : 'Imitar y grabar'}</span>
          </button>
        )}
      </div>

      {isScoring && (
        <div className="py-2 text-center text-caption text-fg-muted animate-pulse">
          Analizando tu pronunciación…
        </div>
      )}

      {scoring && (
        <div className="flex flex-col gap-3">
          <PronunciationFeedback
            wordResults={scoring.wordResults}
            accuracy={scoring.accuracy}
            feedback={getFeedbackMessage(scoring.accuracy)}
            xpEarned={calculateXP(scoring.accuracy)}
            transcript={scoring.transcript}
            userAudioUrl={userAudioUrl}
          />
          <div className="flex justify-end pt-1">
            <Button variant="secondary" size="sm" onClick={handleRetry}>
              Repetir grabación
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
