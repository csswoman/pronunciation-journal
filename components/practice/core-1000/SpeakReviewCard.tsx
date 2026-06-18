'use client'

// Planned structure:
// <SpeakReviewCard>
//   <SentencePrompt />          — oración objetivo + IPA + TTS modelo
//   <MicButton />               — useSpeechInput + getUserMedia → transcript
//   <PronunciationFeedback />   — resultado + Continuar
//   <SelfGradeBar />            — fallback si no hay mic/API de voz
// </SpeakReviewCard>

import { useCallback, useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Volume2 } from 'lucide-react'
import { speak } from '@/lib/phoneme-practice/tts'
import { useSpeechInput } from '@/hooks/useSpeechInput'
import { useSharedMicStream } from '@/hooks/useSharedMicStream'
import { defaultEvaluationEngine } from '@/lib/exercises/evaluation'
import { accuracyToQuality } from '@/lib/srs'
import { getFeedbackMessage, calculateXP } from '@/lib/pronunciation/scoring'
import PronunciationFeedback from '@/components/lesson/PronunciationFeedback'
import { PhonemeFeedbackTable } from '@/components/lesson/PhonemeFeedbackTable'
import { SelfGradeBar } from './SelfGradeBar'
import { cn } from '@/lib/cn'
import type { CoreWord } from '@/lib/core-1000/types'
import type { WordResult } from '@/lib/types'

interface Props {
  entry: CoreWord
  onGraded: (quality: number, extras?: { accuracy: number; transcript: string }) => void
}

interface Scored {
  score: number
  wordResults: WordResult[]
  transcript: string
}

const ttsAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window

function micErrorMessage(error: string | null): string {
  if (!error) return 'No se pudo iniciar el micrófono.'
  if (error === 'not-allowed' || error.includes('Permission')) {
    return 'Permiso de micrófono bloqueado. Actívalo en el candado de la barra de direcciones.'
  }
  if (error === 'no-speech') return 'No se detectó voz. Intenta hablar más cerca del micrófono.'
  if (error === 'audio-capture') return 'No se encontró un micrófono activo en el sistema.'

  const lower = error.toLowerCase()
  if (
    error === 'network' ||
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('abort')
  ) {
    return 'Sin conexión con el servicio de reconocimiento de voz. Revisa tu internet e intenta de nuevo.'
  }
  if (lower.includes('transcribe failed') || lower.includes('rate limit')) {
    return 'El servicio de transcripción no respondió. Intenta de nuevo en unos segundos.'
  }
  return 'No se pudo iniciar el micrófono.'
}

export function SpeakReviewCard({ entry, onGraded }: Props) {
  const { getStream, release } = useSharedMicStream()
  const { state, result, error: speechError, isSupported, start, stop, abort, reset } =
    useSpeechInput({ prefer: 'auto', getStream })

  const [scored, setScored] = useState<Scored | null>(null)
  const [isScoring, setIsScoring] = useState(false)
  const [micError, setMicError] = useState<string | null>(null)
  const submitted = useRef(false)

  const sentence = entry.example_sentence

  useEffect(() => {
    submitted.current = false
    setScored(null)
    setMicError(null)
    abort()
    release()
    reset()
  }, [entry.rank, abort, release, reset])

  useEffect(() => {
    if (state !== 'done' || !result || isScoring || scored) return
    setIsScoring(true)
    defaultEvaluationEngine
      .evaluate({
        exercise: { domain: 'pronunciation', mode: 'speak' },
        expected: sentence,
        actual: { kind: 'speech', transcript: result.transcript },
      })
      .then((evalResult) => {
        setScored({
          score: evalResult.score ?? 0,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          wordResults: (evalResult as any).wordResults ?? [],
          transcript: result.transcript,
        })
      })
      .finally(() => {
        setIsScoring(false)
        release()
      })
  }, [state, result, isScoring, scored, sentence, release])

  const handleMicToggle = useCallback(async () => {
    if (state === 'listening') {
      setMicError(null)
      await stop()
      return
    }
    setMicError(null)
    abort()
    reset()
    try {
      await getStream()
      await start()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'not-allowed'
      setMicError(msg)
      release()
    }
  }, [state, stop, abort, reset, getStream, start, release])

  const handleContinue = () => {
    if (!scored || submitted.current) return
    submitted.current = true
    onGraded(accuracyToQuality(scored.score), {
      accuracy: scored.score,
      transcript: scored.transcript,
    })
  }

  const handleSelfGrade = (quality: number) => {
    if (submitted.current) return
    submitted.current = true
    onGraded(quality)
  }

  const handleRetry = () => {
    setScored(null)
    setMicError(null)
    abort()
    release()
    reset()
  }

  const isListening = state === 'listening'
  const isProcessing = state === 'processing' || isScoring
  const isError = state === 'error' || !!micError || !!speechError
  const errorDetail = micError ?? speechError
  const useFallback = !isSupported

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-5">
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-xs font-semibold uppercase tracking-[.08em] text-[var(--text-tertiary)] m-0">
          Di la oración
        </p>
        <p className="text-xl text-[var(--text-primary)] m-0">{sentence}</p>
        {entry.sentence_ipa && (
          <p className="[font-family:var(--font-ipa),monospace] text-sm text-[var(--text-tertiary)] m-0">
            {entry.sentence_ipa}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => speak(sentence, { rate: 0.95 })}
        disabled={!ttsAvailable}
        className="inline-flex items-center gap-1.5 text-xs py-2 px-4 rounded-[var(--radius-full)] border border-[var(--border-subtle)] bg-transparent text-[var(--text-secondary)] cursor-pointer [font-family:inherit] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Volume2 size={14} aria-hidden />
        Escuchar modelo
      </button>

      {useFallback ? (
        <div className="flex w-full flex-col items-center gap-2">
          <p className="text-xs text-[var(--text-tertiary)] m-0">
            Micrófono no disponible en este navegador — practica en voz alta y califícate:
          </p>
          <SelfGradeBar onGrade={handleSelfGrade} />
        </div>
      ) : !scored ? (
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => void handleMicToggle()}
            disabled={isProcessing}
            aria-label={isListening ? 'Detener grabación' : 'Grabar mi voz'}
            className={cn(
              'w-20 h-20 rounded-full border-none flex items-center justify-center cursor-pointer transition-all text-white disabled:opacity-40',
              isListening
                ? 'bg-[var(--error)] shadow-[0_0_0_14px_color-mix(in_oklch,var(--error)_18%,transparent)]'
                : 'bg-[var(--primary)] shadow-[0_4px_16px_color-mix(in_oklch,var(--primary)_35%,transparent)]',
            )}
          >
            {isListening ? <MicOff size={28} /> : <Mic size={28} />}
          </button>
          <p className="text-xs text-[var(--text-tertiary)] tracking-[.05em] m-0">
            {isListening
              ? 'Escuchando… toca para parar'
              : isProcessing
                ? 'Analizando…'
                : 'Toca para hablar'}
          </p>
          {isError && (
            <p className="text-xs text-[var(--error)] text-center m-0 max-w-xs">
              {micErrorMessage(errorDetail)}{' '}
              <button
                type="button"
                onClick={handleRetry}
                className="underline cursor-pointer bg-transparent border-none [font-family:inherit] text-xs text-[var(--error)]"
              >
                Reintentar
              </button>
            </p>
          )}
        </div>
      ) : (
        <>
          <PronunciationFeedback
            wordResults={scored.wordResults}
            accuracy={scored.score}
            feedback={getFeedbackMessage(scored.score, 70)}
            xpEarned={calculateXP(scored.score)}
            showPhonemeDetail={false}
          />
          <PhonemeFeedbackTable wordResults={scored.wordResults} />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRetry}
              className="text-xs py-1.5 px-3 rounded-[var(--radius-full)] border border-[var(--border-subtle)] bg-transparent text-[var(--text-secondary)] cursor-pointer [font-family:inherit]"
            >
              Intentar de nuevo
            </button>
            <button
              type="button"
              onClick={handleContinue}
              className="text-xs py-1.5 px-3 rounded-[var(--radius-full)] bg-[var(--primary)] text-white border-none cursor-pointer [font-family:inherit] font-medium"
            >
              Continuar
            </button>
          </div>
        </>
      )}
    </div>
  )
}
