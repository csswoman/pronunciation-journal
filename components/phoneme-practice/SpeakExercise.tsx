'use client'

// Planned structure:
// <SpeakExercise>
//   <WordDisplay />        — word + IPA
//   <ModelPlaybackRow />   — play model + duration badge
//   <RecordRow />          — mic button + state label
//   <PlaybackCompare />    — play user recording + duration bars
// </SpeakExercise>

import { useCallback, useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Play, RotateCcw, Volume2 } from 'lucide-react'
import type { Exercise } from '@/lib/phoneme-practice/types'
import { cn } from '@/lib/cn'
import { PhonemeExercisePrompt } from './PhonemeExercisePrompt'
import { getPhonemeExerciseMeta } from '@/lib/phoneme-practice/exercise-labels'
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder'

interface Props {
  exercise: Exercise
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
  focusUi?: boolean
}

// --- WordDisplay ---
function WordDisplay({ word, ipa, focusUi }: { word?: string; ipa: string; focusUi: boolean }) {
  if (focusUi) {
    return (
      <div className="pf-pron">
        <div className="pf-pron__word">{word ?? '—'}</div>
        <div className="pf-pron__ipa">{ipa}</div>
      </div>
    )
  }
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[.08em] text-[var(--text-tertiary)] m-0">
        Shadowing — repite lo que oyes
      </p>
      <div className="[font-family:var(--font-phoneme),serif] text-5xl font-bold text-[var(--text-primary)] tracking-[-1px] leading-none">
        {word ?? '—'}
      </div>
      <div className="[font-family:var(--font-ipa),monospace] text-base text-[var(--primary)]">
        {ipa}
      </div>
    </>
  )
}

// --- DurationBar ---
function DurationBar({ label, ms, maxMs }: { label: string; ms: number; maxMs: number }) {
  const pct = maxMs > 0 ? Math.min((ms / maxMs) * 100, 100) : 0
  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between text-xs text-[var(--text-secondary)]">
        <span>{label}</span>
        <span className="tabular-nums">{ms} ms</span>
      </div>
      <div className="h-2 rounded-[var(--radius-full)] bg-[var(--surface-raised)] overflow-hidden">
        <div
          className="h-full rounded-[var(--radius-full)] bg-[var(--primary)] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// --- useModelDuration: speaks and measures utterance duration via onend ---
function useModelDuration() {
  const [durationMs, setDurationMs] = useState<number | null>(null)
  const startRef = useRef<number>(0)

  const playAndMeasure = useCallback((word: string) => {
    if (typeof window === 'undefined') return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(word)
    utt.rate = 1.0
    utt.lang = 'en-US'
    startRef.current = Date.now()
    utt.onend = () => setDurationMs(Date.now() - startRef.current)
    window.speechSynthesis.speak(utt)
  }, [])

  return { durationMs, playAndMeasure }
}

export function SpeakExercise({ exercise, onSubmit, focusUi = false }: Props) {
  const meta = getPhonemeExerciseMeta('speak_word', { targetWord: exercise.targetWord })
  const { durationMs: modelMs, playAndMeasure } = useModelDuration()
  const { state, result, isSupported, start, stop, reset } = useVoiceRecorder()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playingBack, setPlayingBack] = useState(false)
  const submitted = useRef(false)

  // Auto-play model on mount
  useEffect(() => {
    if (!exercise.targetWord) return
    const t = setTimeout(() => playAndMeasure(exercise.targetWord!), 400)
    return () => clearTimeout(t)
  }, [exercise.targetWord, playAndMeasure])

  // Once recording is done, auto-submit (no verdict — always neutral)
  useEffect(() => {
    if (state === 'done' && result && !submitted.current) {
      submitted.current = true
      // Shadowing always passes (isCorrect=true) so the session doesn't re-queue it.
      // SRS exclusion happens in finishSession (exerciseType === 'speak_word' is skipped).
      onSubmit(true, `shadowing:${result.durationMs}ms`)
    }
  }, [state, result, onSubmit])

  const handlePlayUser = useCallback(() => {
    if (!result?.url) return
    const audio = audioRef.current ?? new Audio()
    audioRef.current = audio
    audio.src = result.url
    setPlayingBack(true)
    audio.onended = () => setPlayingBack(false)
    void audio.play()
  }, [result])

  const handleReset = useCallback(() => {
    submitted.current = false
    reset()
  }, [reset])

  const maxMs = Math.max(modelMs ?? 0, result?.durationMs ?? 0) * 1.2 || 1000

  if (!isSupported) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-[var(--text-secondary)]">
          Tu navegador no soporta grabación de audio. Prueba Chrome o Edge.
        </p>
      </div>
    )
  }

  const isRecording = state === 'recording'
  const isDone = state === 'done'
  const isError = state === 'error'

  const content = (
    <>
      <WordDisplay word={exercise.targetWord} ipa={exercise.ipa} focusUi={focusUi} />

      {/* Model playback */}
      <div className={focusUi ? 'pf-listen-row' : 'flex items-center gap-3'}>
        <button
          type="button"
          onClick={() => exercise.targetWord && playAndMeasure(exercise.targetWord)}
          className={focusUi ? 'pf-chip' : 'text-xs font-medium py-2 px-4 rounded-[var(--radius-full)] border border-[var(--border-subtle)] bg-transparent text-[var(--text-secondary)] cursor-pointer [font-family:inherit] inline-flex items-center gap-1.5'}
        >
          <Volume2 size={14} aria-hidden />
          Escuchar modelo
        </button>
        {modelMs !== null && (
          <span className="text-xs tabular-nums text-[var(--text-tertiary)]">{modelMs} ms</span>
        )}
      </div>

      {/* Mic button */}
      <div className={focusUi ? 'pf-mic-wrap' : 'flex flex-col items-center gap-2'}>
        <button
          type="button"
          onClick={isRecording ? stop : start}
          disabled={isDone}
          aria-label={isRecording ? 'Detener grabación' : 'Grabar mi voz'}
          className={cn(
            focusUi
              ? 'pf-mic'
              : 'w-20 h-20 rounded-full border-none flex items-center justify-center cursor-pointer transition-all text-white disabled:opacity-40',
            focusUi && isRecording && 'pf-mic--rec',
            !focusUi && (isRecording
              ? 'bg-[var(--error)] shadow-[0_0_0_14px_color-mix(in_oklch,var(--error)_18%,transparent)]'
              : 'bg-[var(--primary)] shadow-[0_4px_16px_color-mix(in_oklch,var(--primary)_35%,transparent)]'),
          )}
        >
          {isRecording ? <MicOff size={28} /> : <Mic size={28} />}
        </button>
        <p className={focusUi ? 'pf-mic-label' : 'text-xs text-[var(--text-tertiary)] tracking-[.05em]'}>
          {isRecording ? 'Grabando… toca para parar' : isDone ? 'Grabación lista' : 'Toca para grabar'}
        </p>
      </div>

      {/* Duration comparison */}
      {isDone && result && (
        <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
          {modelMs !== null && (
            <DurationBar label="Modelo" ms={modelMs} maxMs={maxMs} />
          )}
          <DurationBar label="Tu voz" ms={result.durationMs} maxMs={maxMs} />

          <div className="flex gap-2 justify-center pt-1">
            <button
              type="button"
              onClick={handlePlayUser}
              disabled={playingBack}
              className="inline-flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-[var(--radius-full)] border border-[var(--border-subtle)] bg-transparent text-[var(--text-secondary)] cursor-pointer [font-family:inherit] disabled:opacity-50"
            >
              <Play size={12} aria-hidden />
              Oír mi voz
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-[var(--radius-full)] border border-[var(--border-subtle)] bg-transparent text-[var(--text-secondary)] cursor-pointer [font-family:inherit]"
            >
              <RotateCcw size={12} aria-hidden />
              Intentar de nuevo
            </button>
          </div>
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-[var(--error)] text-center">
            No se pudo acceder al micrófono. Comprueba los permisos.
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 text-xs py-1 px-3 rounded-[var(--radius-full)] border border-[var(--border-subtle)] bg-transparent text-[var(--text-secondary)] cursor-pointer [font-family:inherit]"
          >
            <RotateCcw size={13} /> Reintentar
          </button>
        </div>
      )}
    </>
  )

  if (!focusUi) {
    return <div className="flex flex-col items-center gap-5 w-full">{content}</div>
  }

  return (
    <div className="phoneme-focus__exercise">
      <PhonemeExercisePrompt eyebrow={meta.eyebrow} />
      {content}
    </div>
  )
}
