'use client'

// Planned structure:
// <AxSameDifferentExercise>
//   <AuditoryDiscriminationBase>
//     <StimuliSlot: A/X stimulus cards + PlayBoth button />
//   </AuditoryDiscriminationBase>
// </AxSameDifferentExercise>

import { useEffect, useState } from 'react'
import { Check, Volume2, Play } from '@/components/icons'
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
  const [heard, setHeard] = useState<ReadonlySet<number>>(new Set())
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
    markHeard(index)
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

  function markHeard(index: number) {
    setHeard((prev) => new Set(prev).add(index))
  }

  function handlePlayBoth() {
    setPlayingIndex(null)
    stimuli.forEach((_, i) => markHeard(i))
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
            <div
              key={label}
              className="flex flex-col items-center gap-2.5 rounded-3xl bg-lilac px-4 py-6 text-ink"
            >
              <span className="text-display font-extrabold leading-none text-ink!">{label}</span>
              <button
                type="button"
                onClick={() => handlePlay(i)}
                aria-label={`Escuchar estímulo ${label}`}
                aria-pressed={isPlaying}
                className="flex size-14 cursor-pointer items-center justify-center rounded-full bg-ink text-white transition-transform duration-150 select-none focus-ring active:scale-95"
              >
                <Volume2 size={24} className={cn(isPlaying && 'animate-pulse')} aria-hidden />
              </button>
              <span className="flex h-5 items-center gap-1.5 text-body-sm font-medium text-ink!">
                {heard.has(i) && (
                  <>
                    <Check size={16} aria-hidden />
                    Escuchado
                  </>
                )}
              </span>
            </div>
          )
        })}
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={handlePlayBoth}
          aria-label="Escuchar A y luego X en secuencia"
          className="inline-flex h-14 cursor-pointer items-center gap-2 rounded-full border-2 border-border-strong bg-surface-base px-6 text-body-md font-semibold text-fg transition-colors duration-150 hover:border-primary active:scale-95 focus-ring"
        >
          <Play size={14} fill="currentColor" aria-hidden />
          <span>Escuchar en secuencia · A → X</span>
        </button>
      </div>
    </div>
  )

  return (
    <AuditoryDiscriminationBase
      title="¿Suenan igual o distinto?"
      kicker={ipaDisplay ? `Sonido ${ipaDisplay} · Discriminación AX` : 'Discriminación AX'}
      hint="Escucha A y luego X, y decide si son el mismo sonido."
      stimulusSlot={stimulusSlot}
      options={exercise.options}
      selectedIds={selected ? [selected] : []}
      correctIds={exercise.correctIds}
      submitted={submitted}
      mode="single"
      optionStyle="choice"
      canConfirm={canConfirm}
      onToggleOption={handleSelect}
      onConfirm={handleConfirm}
    />
  )
}
