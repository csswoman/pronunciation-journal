'use client'

// Planned structure:
// <Phase2LinkingCard>
//   <LinkingModel />
//   <LinkingRecorder />
//   <LinkingFeedback />
// </Phase2LinkingCard>

import { useCallback } from 'react'
import { ListenButton } from '@/components/ui/ListenButton'
import { PracticeActionBar, PracticeContinueButton, PracticeExerciseCard } from '@/components/practice/session/PracticeActionBar'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { cn } from '@/lib/cn'
import { speak } from '@/lib/phoneme-practice/tts'
import type { EdDrillItem } from '@/lib/pronunciation/ed-drills/types'
import { canScoreSpeech } from '@/lib/speech/adapters/webSpeechAdapter'
import { SCORING_UNAVAILABLE_SHADOW_ES, STT_NETWORK_FAILURE_ES } from '@/lib/speech/browser-support-message'

interface Phase2Result {
  correct: boolean
  scored: boolean
  suspectedEpenthesis: boolean
}

interface Phase2LinkingCardProps {
  item: EdDrillItem
  onComplete: (result: Phase2Result) => void
  suspectedEpenthesis?: boolean
}

function hasPastVerb(transcript: string, pastVerb: string): boolean {
  return new RegExp(`\\b${pastVerb}\\b`, 'i').test(transcript)
}

export function Phase2LinkingCard({
  item,
  onComplete,
  suspectedEpenthesis = false,
}: Phase2LinkingCardProps) {
  const { status, result, errorCode, start, stop, reset } = useSpeechRecognition()
  const environment = item.environments[1]
  const isProcessing = status === 'processing'
  const isNetworkShadowing = status === 'error' && errorCode === 'network'
  const isShadowing = !canScoreSpeech() || isNetworkShadowing
  const transcript = result?.transcript ?? ''
  const isCorrect = status === 'done' && hasPastVerb(transcript, item.pastVerb)
  const isAnswered = status === 'done' && Boolean(transcript)

  const completeShadowing = useCallback(() => {
    onComplete({ correct: false, scored: false, suspectedEpenthesis: false })
  }, [onComplete])

  const retry = useCallback(() => reset(), [reset])
  const completeScored = useCallback(() => {
    onComplete({ correct: isCorrect, scored: true, suspectedEpenthesis })
  }, [isCorrect, onComplete, suspectedEpenthesis])

  return (
    <PracticeExerciseCard spacing="roomy">
      <div className="flex w-full flex-col items-center gap-2 text-center">
        <span className="font-kicker text-primary">Fase 2 · Boca con enlace</span>
        <h2 className="text-h3 text-fg">Suelta la consonante hacia la vocal</h2>
        <p className="text-body-lg font-medium text-fg">{environment.targetChunk}</p>
        <p className="font-mono text-body-md text-primary">{environment.syllabified}</p>
        <p className="font-ipa text-body-md text-fg-muted">{environment.ipa}</p>
        <ListenButton onPlay={() => speak(environment.sentence)} label="Escuchar modelo" />
      </div>

      {isShadowing ? (
        <div className="flex w-full flex-col items-center gap-4 text-center">
          <p className="text-body-sm text-fg-muted">
            {isNetworkShadowing ? STT_NETWORK_FAILURE_ES : SCORING_UNAVAILABLE_SHADOW_ES}
          </p>
          <PracticeActionBar>
            <PracticeContinueButton onClick={completeShadowing}>Continuar sin puntuación</PracticeContinueButton>
          </PracticeActionBar>
        </div>
      ) : isProcessing ? (
        <p aria-live="polite" className="text-body-sm text-fg-muted">Estamos transcribiendo tu voz…</p>
      ) : isAnswered ? (
        <div className="flex w-full flex-col items-center gap-4 text-center">
          <p className={cn('text-body-sm font-medium', isCorrect ? 'text-success' : 'text-error')}>
            {isCorrect ? `Detectamos “${item.pastVerb}”.` : `No apareció “${item.pastVerb}” en lo que escuchamos.`}
          </p>
          {suspectedEpenthesis ? (
            <p className="text-body-sm text-warning">
              <strong>Tip de articulación:</strong> sonó un poco largo. Toca la consonante final y frénala sin abrir la boca para añadir una “e”.
            </p>
          ) : null}
          <PracticeActionBar>
            <PracticeContinueButton onClick={completeScored}>Continuar</PracticeContinueButton>
          </PracticeActionBar>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={status === 'listening' ? stop : start}
            disabled={status === 'done'}
            aria-label={status === 'listening' ? 'Detener grabación' : 'Grabar mi voz'}
            className="min-h-11 rounded-full bg-primary px-6 py-3 text-body-sm font-semibold text-on-primary transition-colors focus-ring hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === 'listening' ? 'Detener grabación' : 'Grabar mi voz'}
          </button>
          {status === 'error' ? (
            <button type="button" onClick={retry} className="min-h-11 text-body-sm text-fg-muted underline focus-ring">Reintentar</button>
          ) : null}
        </div>
      )}
    </PracticeExerciseCard>
  )
}
