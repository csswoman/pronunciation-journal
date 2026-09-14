'use client'

// Planned structure:
// <ABXExercise>
//   <AuditoryDiscriminationBase>
//     <StimuliSlot: References 1 and 2 + Unknown target 3 />
//   </AuditoryDiscriminationBase>
// </ABXExercise>

import { useEffect, useState } from 'react'
import { Volume2 } from '@/components/icons'
import { speak } from '@/lib/phoneme-practice/tts'
import type { Exercise } from '@/lib/phoneme-practice/types'
import { AuditoryDiscriminationBase } from '@/components/phoneme-practice/AuditoryDiscriminationBase'
import { playUiCue } from '@/lib/ui-sounds/cues'
import { cn } from '@/lib/cn'

interface Props {
  exercise: Exercise
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
  voice?: SpeechSynthesisVoice
}

export function ABXExercise({ exercise, onSubmit, voice }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const stimuli = exercise.stimuli ?? []
  const [stimA, stimB, stimX] = stimuli

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
      {/* References 1 and 2 */}
      <div className="grid w-full grid-cols-2 gap-3.5">
        {[stimA, stimB].map((stim, i) => {
          const num = i === 0 ? '1' : '2'
          const isPlaying = playingIndex === i
          return stim ? (
            <button
              key={num}
              type="button"
              onClick={() => handlePlay(i)}
              aria-label={`Escuchar referencia ${num}`}
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
                Referencia {num}
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
              {stim.ipa ? (
                <span className="font-ipa text-body-lg font-semibold text-fg">
                  {stim.ipa}
                </span>
              ) : (
                <span
                  className={cn(
                    'text-caption font-medium transition-colors duration-150',
                    isPlaying ? 'text-primary font-semibold' : 'text-fg-muted',
                  )}
                >
                  {isPlaying ? 'Reproduciendo...' : 'Escuchar'}
                </span>
              )}
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
          ) : null
        })}
      </div>

      {/* Unknown Target Stimulus (3 / X) */}
      {stimX && (() => {
        const isPlaying = playingIndex === 2
        return (
          <button
            type="button"
            onClick={() => handlePlay(2)}
            aria-label="Escuchar sonido incógnita 3"
            aria-pressed={isPlaying}
            className={cn(
              'relative flex w-full cursor-pointer flex-col items-center gap-2.5 rounded-xl border p-5 transition-all duration-150 focus-ring select-none',
              isPlaying
                ? 'border-primary bg-primary-soft shadow-xs ring-2 ring-primary/40'
                : 'border-primary/40 bg-primary-soft/40 hover:bg-primary-soft/60 hover:border-primary',
            )}
          >
            <span className="font-mono text-tiny font-bold uppercase tracking-wider text-primary">
              3 · Sonido incógnita
            </span>
            <div
              className={cn(
                'flex size-12 items-center justify-center rounded-full border-2 border-primary bg-primary text-on-primary shadow-sm transition-transform duration-150',
                isPlaying ? 'scale-110 ring-2 ring-primary/30' : 'active:scale-95',
              )}
            >
              <Volume2
                size={22}
                className={cn(
                  'transition-transform duration-150',
                  isPlaying && 'animate-pulse',
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
              {isPlaying ? 'Reproduciendo audio 3...' : 'Toca para escuchar el audio 3'}
            </span>
            <div
              className={cn(
                'h-1 w-12 rounded-full transition-all duration-150',
                isPlaying
                  ? 'bg-primary scale-100 opacity-100'
                  : 'bg-transparent scale-50 opacity-0',
              )}
              aria-hidden
            />
          </button>
        )
      })()}
    </div>
  )

  return (
    <AuditoryDiscriminationBase
      title="¿El tercer sonido suena más como el 1 o el 2?"
      kicker={ipaDisplay ? `Sonido ${ipaDisplay} · Discriminación auditiva` : 'Discriminación auditiva'}
      hint="Escucha los 3 audios y elige a cuál referencia se asemeja la incógnita"
      stimulusSlot={stimulusSlot}
      options={exercise.options}
      selectedIds={selected ? [selected] : []}
      correctIds={exercise.correctIds}
      submitted={submitted}
      mode="single"
      canConfirm={!(!selected || submitted)}
      onToggleOption={handleSelect}
      onConfirm={handleConfirm}
    />
  )
}
