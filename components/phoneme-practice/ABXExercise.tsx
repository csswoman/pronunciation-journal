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
    <div className="flex w-full flex-col gap-3.5">
      <div className="grid w-full grid-cols-1 gap-3.5 sm:grid-cols-2">
        {[stimA, stimB].map((stim, i) =>
          stim ? (
            <div
              key={i}
              className="flex items-center gap-4 rounded-2xl bg-surface-sunken px-4 py-3.5 dark:bg-white/10"
            >
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border-default bg-surface-base text-body-md font-bold text-fg"
                aria-hidden
              >
                {i + 1}
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-caption font-bold uppercase tracking-widest text-fg-muted">
                  Referencia
                </span>
                {stim.ipa && (
                  <span className="font-ipa text-title font-semibold text-fg">
                    /{stim.ipa.replace(/^\/+|\/+$/g, '')}/
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => handlePlay(i)}
                aria-label={`Escuchar referencia ${i + 1}`}
                aria-pressed={playingIndex === i}
                className="flex size-14 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-border-default bg-surface-base text-fg transition-transform duration-150 select-none hover:border-primary focus-ring active:scale-95"
              >
                <Volume2 size={22} className={cn(playingIndex === i && 'animate-pulse')} aria-hidden />
              </button>
            </div>
          ) : null,
        )}
      </div>

      {stimX && (
        <div className="flex w-full flex-col items-center gap-3 rounded-3xl bg-lilac px-4 py-6 text-center text-ink">
          <span className="text-caption font-bold uppercase tracking-widest text-ink!">
            3 · Sonido incógnita
          </span>
          <button
            type="button"
            onClick={() => handlePlay(2)}
            aria-label="Escuchar sonido incógnita 3"
            aria-pressed={playingIndex === 2}
            className="flex size-18 cursor-pointer items-center justify-center rounded-full bg-ink text-white transition-transform duration-150 select-none focus-ring active:scale-95"
          >
            <Volume2 size={28} className={cn(playingIndex === 2 && 'animate-pulse')} aria-hidden />
          </button>
          <p className="m-0 text-body-md font-medium text-ink!">
            {playingIndex === 2 ? 'Reproduciendo…' : 'Toca para escuchar'}
          </p>
        </div>
      )}
    </div>
  )

  const options = exercise.options.map((opt, i) => ({
    ...opt,
    label: `Como el ${i + 1}`,
    ipa: stimuli[i]?.ipa,
    ariaLabel: `Suena como la referencia ${i + 1}`,
  }))

  return (
    <AuditoryDiscriminationBase
      title="¿El sonido 3 se parece al 1 o al 2?"
      kicker={ipaDisplay ? `Sonido ${ipaDisplay} · Discriminación auditiva` : 'Discriminación auditiva'}
      hint="Escucha las dos referencias y luego el sonido incógnita."
      stimulusSlot={stimulusSlot}
      options={options}
      optionStyle="choice"
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
