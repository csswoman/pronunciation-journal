'use client'

// Planned structure:
// <AxSameDifferentExercise>
//   <AuditoryDiscriminationBase>
//     <StimuliSlot: A/X stimulus cards + PlayBoth button />
//   </AuditoryDiscriminationBase>
// </AxSameDifferentExercise>

import { useEffect, useState } from 'react'
import { Volume2, Play } from '@/components/icons'
import { speak, speakSequence } from '@/lib/phoneme-practice/tts'
import type { Exercise } from '@/lib/phoneme-practice/types'
import { AuditoryDiscriminationBase } from '@/components/phoneme-practice/AuditoryDiscriminationBase'
import { playUiCue } from '@/lib/ui-sounds/cues'
import { cn } from '@/lib/cn'

interface Props {
  exercise: Exercise
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
  voice?: SpeechSynthesisVoice
}

const STIMULUS_LABELS = ['A', 'X'] as const

export function AxSameDifferentExercise({ exercise, onSubmit, voice }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const stimuli = exercise.stimuli ?? []
  const canConfirm = Boolean(selected) && !submitted

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  function handlePlay(index: number) {
    const word = stimuli[index]?.word
    if (!word) return
    setPlayingIndex(index)
    const utt = speak(word, {
      voice,
      onStart: () => setPlayingIndex(index),
      onEnd: () => setPlayingIndex((current) => (current === index ? null : current)),
      onError: () => setPlayingIndex((current) => (current === index ? null : current)),
    })
    if (!utt) {
      setPlayingIndex(null)
    }
  }

  function handlePlayBoth() {
    setPlayingIndex(null)
    speakSequence(
      stimuli.map((s) => s.word),
      {
        voice,
        onItemStart: (i) => setPlayingIndex(i),
        onItemEnd: (i) => setPlayingIndex((current) => (current === i ? null : current)),
        onEnd: () => setPlayingIndex(null),
        onError: () => setPlayingIndex(null),
      },
    )
  }

  function handleSelect(id: string) {
    if (submitted) return
    playUiCue('tap')
    setSelected(id)
  }

  function handleConfirm() {
    if (!selected || submitted) return
    setSubmitted(true)
    onSubmit(exercise.correctIds.includes(selected), selected)
  }

  const rawIpa = exercise.ipa?.replace(/^\/+|\/+$/g, '')
  const ipaDisplay = rawIpa ? `/${rawIpa}/` : undefined

  const stimulusSlot = (
    <div className="flex w-full flex-col gap-4">
      <div className="grid w-full grid-cols-2 gap-3.5">
        {STIMULUS_LABELS.map((label, i) => {
          const isPlaying = playingIndex === i
          return (
            <button
              key={label}
              type="button"
              onClick={() => handlePlay(i)}
              aria-label={`Escuchar estímulo ${label}`}
              aria-pressed={isPlaying}
              className={cn(
                'relative flex cursor-pointer flex-col items-center gap-2.5 rounded-xl border p-4 transition-all duration-150 focus-ring select-none',
                isPlaying
                  ? 'border-primary bg-primary-soft/60 shadow-xs ring-2 ring-primary/30'
                  : 'border-border-default bg-surface-sunken/50 hover:bg-surface-sunken hover:border-primary/50',
              )}
            >
              <span
                className={cn(
                  'font-mono text-tiny font-bold uppercase tracking-wider transition-colors duration-150',
                  isPlaying ? 'text-primary' : 'text-fg-subtle',
                )}
              >
                Sonido {label}
              </span>
              <div
                className={cn(
                  'flex size-11 items-center justify-center rounded-full border transition-all duration-150',
                  isPlaying
                    ? 'border-primary bg-primary text-on-primary scale-105 shadow-xs'
                    : 'border-border-default bg-surface-raised text-fg',
                )}
              >
                <Volume2
                  size={20}
                  className={cn(
                    'transition-transform duration-150',
                    isPlaying && 'scale-110 animate-pulse',
                  )}
                  aria-hidden
                />
              </div>
              <span
                className={cn(
                  'text-caption font-medium transition-colors duration-150',
                  isPlaying ? 'text-primary font-semibold' : 'text-fg-muted',
                )}
              >
                {isPlaying ? 'Reproduciendo...' : 'Reproducir'}
              </span>
              <div
                className={cn(
                  'h-1 w-8 rounded-full transition-all duration-150',
                  isPlaying
                    ? 'bg-primary scale-100 opacity-100'
                    : 'bg-transparent scale-50 opacity-0',
                )}
                aria-hidden
              />
            </button>
          )
        })}
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={handlePlayBoth}
          aria-label="Escuchar A y luego X en secuencia"
          className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border-default bg-surface-raised px-4 py-2 text-body-sm font-medium text-fg transition-all duration-150 hover:border-primary hover:text-primary active:scale-95 focus-ring shadow-xs"
        >
          <Play size={13} fill="currentColor" aria-hidden />
          <span>Escuchar en secuencia (A → X)</span>
        </button>
      </div>
    </div>
  )

  return (
    <AuditoryDiscriminationBase
      title="¿Suenan igual o distinto?"
      kicker={ipaDisplay ? `Sonido ${ipaDisplay} · Discriminación AX` : 'Discriminación AX'}
      hint="Escucha los estímulos A y X, luego determina si son iguales"
      stimulusSlot={stimulusSlot}
      options={exercise.options}
      selectedIds={selected ? [selected] : []}
      correctIds={exercise.correctIds}
      submitted={submitted}
      mode="single"
      canConfirm={canConfirm}
      onToggleOption={handleSelect}
      onConfirm={handleConfirm}
    />
  )
}
